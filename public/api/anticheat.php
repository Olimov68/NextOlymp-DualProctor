<?php

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $olympiadId = $_GET['olympiadId'] ?? null;
    $studentId = $_GET['studentId'] ?? null;

    if ($olympiadId) {
        $stmt = $pdo->prepare("SELECT * FROM `anti_cheat_logs` WHERE `olympiadId` = ? ORDER BY `timestamp` DESC LIMIT 200");
        $stmt->execute([$olympiadId]);
    } else if ($studentId) {
        $stmt = $pdo->prepare("SELECT * FROM `anti_cheat_logs` WHERE `studentId` = ? ORDER BY `timestamp` DESC LIMIT 200");
        $stmt->execute([$studentId]);
    } else {
        $stmt = $pdo->query("SELECT * FROM `anti_cheat_logs` ORDER BY `timestamp` DESC LIMIT 200");
    }

    $logs = $stmt->fetchAll();
    echo json_encode(['status' => 'success', 'data' => $logs]);
    exit;
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (empty($data['studentId']) || empty($data['eventType'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Missing studentId or eventType']);
        exit;
    }

    $id = $data['id'] ?? ('inc_' . time() . '_' . rand(100, 999));
    $studentId = $data['studentId'];
    $studentName = $data['studentName'] ?? 'Ishtirokchi';
    $studentEmail = $data['studentEmail'] ?? null;
    $studentPhone = $data['studentPhone'] ?? null;
    $olympiadId = $data['olympiadId'] ?? 'olymp-current';
    $olympiadTitle = $data['olympiadTitle'] ?? 'Olimpiada';
    $eventType = $data['eventType'];
    $details = $data['details'] ?? ($data['detail'] ?? 'Qoidabuzarlik holati aniqlandi');
    $severity = $data['severity'] ?? 'O\'rta';
    $timestamp = $data['timestamp'] ?? date('Y-m-d H:i:s');
    $snapshotUrl = $data['snapshotUrl'] ?? null;
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $status = $data['status'] ?? 'pending';

    $sql = "INSERT INTO `anti_cheat_logs` (
        `id`, `studentId`, `studentName`, `studentEmail`, `studentPhone`,
        `olympiadId`, `olympiadTitle`, `eventType`, `details`,
        `severity`, `timestamp`, `snapshotUrl`, `ipAddress`, `status`
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $id, $studentId, $studentName, $studentEmail, $studentPhone,
        $olympiadId, $olympiadTitle, $eventType, $details,
        $severity, $timestamp, $snapshotUrl, $ipAddress, $status
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Anti-cheat incident saved to MySQL', 'id' => $id]);
    exit;
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM `anti_cheat_logs` WHERE `id` = ?");
        $stmt->execute([$id]);
    } else {
        $pdo->exec("DELETE FROM `anti_cheat_logs`");
    }

    echo json_encode(['status' => 'success', 'message' => 'Logs cleared from MySQL']);
    exit;
}
