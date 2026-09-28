<?php

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM `national_exams` WHERE `id` = ?");
        $stmt->execute([$id]);
        $exam = $stmt->fetch();
        if ($exam) {
            $exam['isPinned'] = (bool)$exam['isPinned'];
            $exam['durationMinutes'] = (int)$exam['durationMinutes'];
            $exam['maxScore'] = (int)$exam['maxScore'];
            $exam['aThreshold'] = (int)$exam['aThreshold'];
            $exam['totalQuestions'] = (int)$exam['totalQuestions'];
            $exam['registeredCount'] = (int)$exam['registeredCount'];
            $exam['submittedCount'] = (int)$exam['submittedCount'];
            $exam['paidCount'] = (int)$exam['paidCount'];
            $exam['totalRevenue'] = (int)$exam['totalRevenue'];
            $exam['questions'] = !empty($exam['questions']) ? json_decode($exam['questions'], true) : [];
            echo json_encode(['status' => 'success', 'data' => $exam]);
        } else {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Imtihon topilmadi']);
        }
        exit;
    }

    $stmt = $pdo->query("SELECT * FROM `national_exams` ORDER BY `createdAt` DESC");
    $exams = $stmt->fetchAll();

    foreach ($exams as &$exam) {
        $exam['isPinned'] = (bool)$exam['isPinned'];
        $exam['durationMinutes'] = (int)$exam['durationMinutes'];
        $exam['maxScore'] = (int)$exam['maxScore'];
        $exam['aThreshold'] = (int)$exam['aThreshold'];
        $exam['totalQuestions'] = (int)$exam['totalQuestions'];
        $exam['registeredCount'] = (int)$exam['registeredCount'];
        $exam['submittedCount'] = (int)$exam['submittedCount'];
        $exam['paidCount'] = (int)$exam['paidCount'];
        $exam['totalRevenue'] = (int)$exam['totalRevenue'];
        $exam['questions'] = !empty($exam['questions']) ? json_decode($exam['questions'], true) : [];
    }

    echo json_encode(['status' => 'success', 'data' => $exams]);
    exit;
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (empty($data['title'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Imtihon nomi (title) talab qilinadi"]);
        exit;
    }

    $id = $data['id'] ?? ('NC-' . time());
    $title = trim($data['title']);
    $subject = $data['subject'] ?? 'Matematika';
    $description = $data['description'] ?? '';
    $specType = $data['specType'] ?? 'spec_1';
    $durationMinutes = (int)($data['durationMinutes'] ?? 150);
    $maxScore = (int)($data['maxScore'] ?? 75);
    $aThreshold = (int)($data['aThreshold'] ?? 65);
    $calculationMethod = $data['calculationMethod'] ?? 'rasch';
    $questions = isset($data['questions']) ? json_encode($data['questions']) : '[]';
    $totalQuestions = isset($data['questions']) && is_array($data['questions']) ? count($data['questions']) : (int)($data['totalQuestions'] ?? 45);
    $registeredCount = (int)($data['registeredCount'] ?? 0);
    $submittedCount = (int)($data['submittedCount'] ?? 0);
    $paidCount = (int)($data['paidCount'] ?? 0);
    $totalRevenue = (int)($data['totalRevenue'] ?? 0);
    $isPinned = !empty($data['isPinned']) ? 1 : 0;
    $status = $data['status'] ?? 'ochiq';
    $createdAt = $data['createdAt'] ?? date('Y-m-d H:i:s');

    $sql = "INSERT INTO `national_exams` (
        `id`, `title`, `subject`, `description`, `specType`,
        `durationMinutes`, `maxScore`, `aThreshold`, `calculationMethod`,
        `totalQuestions`, `registeredCount`, `submittedCount`, `paidCount`,
        `totalRevenue`, `isPinned`, `status`, `questions`, `createdAt`
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    ) ON DUPLICATE KEY UPDATE
        `title` = VALUES(`title`),
        `subject` = VALUES(`subject`),
        `description` = VALUES(`description`),
        `specType` = VALUES(`specType`),
        `durationMinutes` = VALUES(`durationMinutes`),
        `maxScore` = VALUES(`maxScore`),
        `aThreshold` = VALUES(`aThreshold`),
        `calculationMethod` = VALUES(`calculationMethod`),
        `totalQuestions` = VALUES(`totalQuestions`),
        `registeredCount` = VALUES(`registeredCount`),
        `submittedCount` = VALUES(`submittedCount`),
        `paidCount` = VALUES(`paidCount`),
        `totalRevenue` = VALUES(`totalRevenue`),
        `isPinned` = VALUES(`isPinned`),
        `status` = VALUES(`status`),
        `questions` = VALUES(`questions`);";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $id, $title, $subject, $description, $specType,
        $durationMinutes, $maxScore, $aThreshold, $calculationMethod,
        $totalQuestions, $registeredCount, $submittedCount, $paidCount,
        $totalRevenue, $isPinned, $status, $questions, $createdAt
    ]);

    echo json_encode([
        'status' => 'success',
        'message' => "Milliy sertifikat imtihoni MySQL bazasiga saqlandi",
        'id' => $id
    ]);
    exit;
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "ID talab qilinadi"]);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM `national_exams` WHERE `id` = ?");
    $stmt->execute([$id]);

    echo json_encode(['status' => 'success', 'message' => "Imtihon MySQL bazasidan o'chirildi"]);
    exit;
}
