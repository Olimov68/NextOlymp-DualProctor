<?php

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = $_GET['user_id'] ?? null;

    if ($userId) {
        $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 50");
        $stmt->execute([$userId]);
    } else {
        $stmt = $pdo->query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50");
    }

    $notifications = $stmt->fetchAll();
    echo json_encode(['status' => 'success', 'data' => $notifications]);
    exit;
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data || empty($data['title']) || empty($data['message'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "title va message talab qilinadi"]);
        exit;
    }

    $userId = !empty($data['user_id']) ? (int)$data['user_id'] : null;
    $title = trim($data['title']);
    $message = trim($data['message']);

    $sql = "INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, 0)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId, $title, $message]);
    $insertedId = (int)$pdo->lastInsertId();

    echo json_encode([
        'status' => 'success',
        'message' => 'Xabarnoma muvaffaqiyatli yaratildi',
        'id' => $insertedId
    ]);
    exit;
}
