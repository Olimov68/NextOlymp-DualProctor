<?php

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = $_GET['user_id'] ?? ($_GET['userId'] ?? null);
    $olympiadId = $_GET['olympiad_id'] ?? ($_GET['olympiadId'] ?? null);

    if ($userId) {
        $stmt = $pdo->prepare("SELECT * FROM submissions WHERE user_id = ? OR userId = ? ORDER BY started_at DESC");
        $stmt->execute([$userId, $userId]);
    } elseif ($olympiadId) {
        $stmt = $pdo->prepare("SELECT * FROM submissions WHERE olympiad_id = ? OR olympiadId = ? ORDER BY score DESC, submitted_at ASC");
        $stmt->execute([$olympiadId, $olympiadId]);
    } else {
        $stmt = $pdo->query("SELECT * FROM submissions ORDER BY started_at DESC LIMIT 100");
    }

    $subs = $stmt->fetchAll();
    foreach ($subs as &$s) {
        $s['score'] = (int)$s['score'];
        $s['total_questions'] = (int)$s['total_questions'];
        $s['rasch_theta'] = (float)$s['rasch_theta'];
        $s['answers'] = !empty($s['answers_json']) ? json_decode($s['answers_json'], true) : (!empty($s['answers']) ? json_decode($s['answers'], true) : []);
    }

    echo json_encode(['status' => 'success', 'data' => $subs]);
    exit;
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "JSON ma'lumotlar yuborilmadi"]);
        exit;
    }

    $userId = $data['user_id'] ?? ($data['userId'] ?? null);
    $olympiadId = $data['olympiad_id'] ?? ($data['olympiadId'] ?? null);

    if (!$userId || !$olympiadId) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'user_id va olympiad_id talab qilinadi']);
        exit;
    }

    $id = $data['id'] ?? ('sub_' . time() . '_' . rand(100, 999));
    $userName = $data['userName'] ?? ($data['user_name'] ?? 'Ishtirokchi');
    $olympiadTitle = $data['olympiadTitle'] ?? 'Olimpiada';
    $score = (int)($data['score'] ?? 0);
    $totalQuestions = (int)($data['total_questions'] ?? ($data['totalQuestions'] ?? 25));
    $maxScore = (int)($data['maxScore'] ?? ($totalQuestions * 4));
    $percentage = (int)($data['percentage'] ?? round(($score / max($maxScore, 1)) * 100));
    $answers = $data['answers'] ?? ($data['answers_json'] ?? []);
    $answersJson = is_array($answers) ? json_encode($answers) : $answers;
    $timeSpentMinutes = (int)($data['timeSpentMinutes'] ?? 0);
    $status = $data['status'] ?? 'completed';
    $submittedAt = date('Y-m-d H:i:s');

    
    $correctCount = min($totalQuestions, max(0, (int)round(($percentage / 100) * $totalQuestions)));
    if ($correctCount <= 0) {
        $raschTheta = -3.00;
    } elseif ($correctCount >= $totalQuestions) {
        $raschTheta = 3.00;
    } else {
        $p = $correctCount / $totalQuestions;
        $raschTheta = round(log($p / (1 - $p)), 2);
        $raschTheta = max(-3.00, min(3.00, $raschTheta));
    }

    $sql = "INSERT INTO submissions (
        id, user_id, userId, userName, olympiad_id, olympiadId, olympiadTitle,
        score, total_questions, maxScore, percentage, rasch_theta, answers_json, answers,
        timeSpentMinutes, status, submitted_at, completedAt
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $id, $userId, $userId, $userName, $olympiadId, $olympiadId, $olympiadTitle,
        $score, $totalQuestions, $maxScore, $percentage, $raschTheta, $answersJson, $answersJson,
        $timeSpentMinutes, $status, $submittedAt, $submittedAt
    ]);

    
    try {
        $uStmt = $pdo->prepare("UPDATE users SET score = GREATEST(score, ?) WHERE id = ?");
        $uStmt->execute([$score, $userId]);
    } catch (Exception $e) {}

    echo json_encode([
        'status' => 'success',
        'message' => 'Natijalar va Rasch modeli bahosi MySQL bazasiga saqlandi',
        'id' => $id,
        'data' => [
            'id' => $id,
            'userId' => $userId,
            'olympiadId' => $olympiadId,
            'score' => $score,
            'total_questions' => $totalQuestions,
            'rasch_theta' => $raschTheta,
            'status' => $status,
            'submitted_at' => $submittedAt
        ]
    ]);
    exit;
}
