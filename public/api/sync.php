<?php

require_once __DIR__ . '/config.php';

$res = [
    'status' => 'healthy',
    'database' => 'MySQL nextolymp connected',
    'timestamp' => date('Y-m-d H:i:s'),
    'counts' => [
        'users' => (int)$pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn(),
        'olympiads' => (int)$pdo->query("SELECT COUNT(*) FROM `olympiads`")->fetchColumn(),
        'questions' => (int)$pdo->query("SELECT COUNT(*) FROM `questions`")->fetchColumn(),
        'submissions' => (int)$pdo->query("SELECT COUNT(*) FROM `submissions`")->fetchColumn(),
        'anti_cheat_logs' => (int)$pdo->query("SELECT COUNT(*) FROM `anti_cheat_logs`")->fetchColumn()
    ]
];

echo json_encode($res);
