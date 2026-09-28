<?php

require_once __DIR__ . '/db.php';

$region = $_GET['region'] ?? null;
$limit = (int)($_GET['limit'] ?? 100);

if ($region && $region !== 'all') {
    $stmt = $pdo->prepare("SELECT id, full_name, fullName, score, region, district, school, grade, avatar_url, avatarUrl FROM users WHERE role = 'student' AND region = ? ORDER BY score DESC, id ASC LIMIT ?");
    $stmt->execute([$region, $limit]);
} else {
    $stmt = $pdo->prepare("SELECT id, full_name, fullName, score, region, district, school, grade, avatar_url, avatarUrl FROM users WHERE role = 'student' ORDER BY score DESC, id ASC LIMIT ?");
    $stmt->execute([$limit]);
}

$rows = $stmt->fetchAll();
$rank = 1;
$leaderboard = [];

foreach ($rows as $row) {
    $name = !empty($row['full_name']) ? $row['full_name'] : ($row['fullName'] ?? 'Ishtirokchi');
    $score = (int)($row['score'] ?? 0);
    $xp = $score * 10;

    $leaderboard[] = [
        'rank' => $rank,
        'userId' => $row['id'],
        'userName' => $name,
        'score' => $score,
        'totalXP' => $xp,
        'region' => $row['region'] ?: 'Toshkent shahri',
        'district' => $row['district'] ?: 'Yunusobod tumani',
        'school' => $row['school'] ?: 'Prezident maktabi',
        'grade' => (int)($row['grade'] ?? 9),
        'avatarUrl' => $row['avatar_url'] ?: ($row['avatarUrl'] ?: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')
    ];
    $rank++;
}

echo json_encode([
    'status' => 'success',
    'total' => count($leaderboard),
    'data' => $leaderboard
]);
