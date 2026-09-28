<?php

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = $_GET['id'] ?? null;

    try {
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM `users` WHERE `id` = ?");
            $stmt->execute([$id]);
            $u = $stmt->fetch();
            if ($u) {
                $clean = [
                    'id' => (string)$u['id'],
                    'fullName' => $u['full_name'] ?? ($u['fullName'] ?? ($u['name'] ?? 'Foydalanuvchi')),
                    'full_name' => $u['full_name'] ?? ($u['fullName'] ?? 'Foydalanuvchi'),
                    'email' => $u['email'] ?? '',
                    'phone' => $u['phone'] ?? '',
                    'role' => $u['role'] ?? 'student',
                    'gender' => $u['gender'] ?? 'male',
                    'grade' => isset($u['grade']) ? (int)$u['grade'] : 9,
                    'score' => (int)($u['score'] ?? 0),
                    'region' => $u['region'] ?: 'Toshkent shahri',
                    'district' => $u['district'] ?: '',
                    'school' => $u['school'] ?: '',
                    'package' => $u['package'] ?? 'Bepul',
                    'status' => $u['status'] ?? 'active',
                    'avatarUrl' => $u['avatar_url'] ?? ($u['avatarUrl'] ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
                    'createdAt' => $u['created_at'] ?? ($u['createdAt'] ?? date('Y-m-d')),
                    'created_at' => $u['created_at'] ?? date('Y-m-d')
                ];
                echo json_encode(['status' => 'success', 'data' => $clean]);
            } else {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Foydalanuvchi topilmadi']);
            }
            exit;
        }

        $stmt = $pdo->query("SELECT * FROM `users` ORDER BY `id` DESC");
        $rawUsers = $stmt->fetchAll();
        $users = [];

        foreach ($rawUsers as $u) {
            $users[] = [
                'id' => (string)$u['id'],
                'fullName' => $u['full_name'] ?? ($u['fullName'] ?? ($u['name'] ?? 'Ishtirokchi')),
                'full_name' => $u['full_name'] ?? ($u['fullName'] ?? 'Ishtirokchi'),
                'email' => $u['email'] ?? '',
                'phone' => $u['phone'] ?? '+998 90 123 45 67',
                'role' => $u['role'] ?? 'student',
                'gender' => $u['gender'] ?? 'male',
                'grade' => isset($u['grade']) ? (int)$u['grade'] : 9,
                'score' => (int)($u['score'] ?? 0),
                'region' => $u['region'] ?: 'Toshkent shahri',
                'district' => $u['district'] ?: 'Yunusobod tumani',
                'school' => $u['school'] ?: 'Prezident maktabi',
                'package' => $u['package'] ?? 'Bepul',
                'status' => $u['status'] ?? 'active',
                'avatarUrl' => $u['avatar_url'] ?? ($u['avatarUrl'] ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
                'createdAt' => $u['created_at'] ?? ($u['createdAt'] ?? date('Y-m-d')),
                'created_at' => $u['created_at'] ?? date('Y-m-d'),
                'participationCount' => (int)($u['participationCount'] ?? 0)
            ];
        }

        echo json_encode(['status' => 'success', 'data' => $users]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        exit;
    }
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "JSON ma'lumotlar yuborilmadi"]);
        exit;
    }

    $fullName = trim($data['fullName'] ?? ($data['full_name'] ?? ($data['name'] ?? '')));
    $phone = trim($data['phone'] ?? '');
    $email = trim($data['email'] ?? '');
    $id = (string)($data['id'] ?? ('USR-' . time() . rand(10, 99)));

    if (empty($fullName)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "To'liq ism talab qilinadi"]);
        exit;
    }

    $role = $data['role'] ?? 'student';
    $gender = $data['gender'] ?? 'male';
    $grade = isset($data['grade']) ? (int)$data['grade'] : 9;
    $score = (int)($data['score'] ?? 0);
    $region = $data['region'] ?? 'Toshkent shahri';
    $district = $data['district'] ?? '';
    $school = $data['school'] ?? '';
    $status = $data['status'] ?? 'active';
    $package = $data['package'] ?? 'Bepul';
    $password = $data['password'] ?? '123456';
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $avatarUrl = $data['avatarUrl'] ?? ($data['avatar_url'] ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
    $createdAt = date('Y-m-d H:i:s');

    $sql = "INSERT INTO `users` (
        `id`, `full_name`, `fullName`, `phone`, `email`, `password_hash`, `password`,
        `role`, `gender`, `grade`, `score`, `region`, `district`, `school`,
        `avatar_url`, `avatarUrl`, `status`, `package`, `created_at`
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
    ) ON DUPLICATE KEY UPDATE
        `full_name` = VALUES(`full_name`),
        `fullName` = VALUES(`fullName`),
        `phone` = VALUES(`phone`),
        `email` = VALUES(`email`),
        `role` = VALUES(`role`),
        `gender` = VALUES(`gender`),
        `grade` = VALUES(`grade`),
        `score` = VALUES(`score`),
        `region` = VALUES(`region`),
        `district` = VALUES(`district`),
        `school` = VALUES(`school`),
        `avatar_url` = VALUES(`avatar_url`),
        `avatarUrl` = VALUES(`avatarUrl`),
        `status` = VALUES(`status`),
        `package` = VALUES(`package`);";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $id, $fullName, $fullName, $phone, $email, $passwordHash, $password,
        $role, $gender, $grade, $score, $region, $district, $school,
        $avatarUrl, $avatarUrl, $status, $package, $createdAt
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Foydalanuvchi MySQL bazasiga saqlandi',
        'id' => $id
    ]);
    exit;
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Foydalanuvchi ID talab qilinadi"]);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM `users` WHERE `id` = ?");
    $stmt->execute([$id]);

    echo json_encode(['status' => 'success', 'message' => "Foydalanuvchi MySQL bazasidan o'chirildi"]);
    exit;
}
