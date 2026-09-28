<?php

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Faqat POST so\'rovi qabul qilinadi']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => "JSON ma'lumotlar yuborilmadi"]);
    exit;
}

$userId = $data['userId'] ?? null;
$olympiadId = $data['olympiadId'] ?? ($data['examId'] ?? null);

if (!$userId || !$olympiadId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'userId va olympiadId (yoki examId) talab qilinadi']);
    exit;
}

$id = $data['id'] ?? ('sub_' . time() . '_' . rand(100, 999));
$userName = $data['userName'] ?? ($data['name'] ?? 'Ishtirokchi');
$olympiadTitle = $data['olympiadTitle'] ?? ($data['title'] ?? 'Olimpiada');
$score = (int)($data['score'] ?? 0);
$maxScore = (int)($data['maxScore'] ?? 100);
$percentage = (int)($data['percentage'] ?? round(($score / max($maxScore, 1)) * 100));
$rank = (int)($data['rank'] ?? 1);
$answers = json_encode($data['answers'] ?? []);
$timeSpentMinutes = (int)($data['timeSpentMinutes'] ?? 0);
$completedAt = $data['completedAt'] ?? date('Y-m-d H:i:s');
$status = $data['status'] ?? 'published';

$sql = "INSERT INTO `submissions` (
    `id`, `userId`, `userName`, `olympiadId`, `olympiadTitle`,
    `score`, `maxScore`, `percentage`, `rank`, `answers`,
    `timeSpentMinutes`, `completedAt`, `status`
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $pdo->prepare($sql);
$stmt->execute([
    $id, $userId, $userName, $olympiadId, $olympiadTitle,
    $score, $maxScore, $percentage, $rank, $answers,
    $timeSpentMinutes, $completedAt, $status
]);

try {
    $uStmt = $pdo->prepare("UPDATE `users` SET `score` = GREATEST(`score`, ?) WHERE `id` = ?");
    $uStmt->execute([$score, $userId]);
} catch (Exception $e) {}

echo json_encode([
    'status' => 'success',
    'message' => 'Javoblar MySQL bazasiga muvaffaqiyatli saqlandi',
    'id' => $id,
    'data' => [
        'id' => $id,
        'userId' => $userId,
        'userName' => $userName,
        'olympiadId' => $olympiadId,
        'olympiadTitle' => $olympiadTitle,
        'score' => $score,
        'maxScore' => $maxScore,
        'percentage' => $percentage,
        'completedAt' => $completedAt
    ]
]);
