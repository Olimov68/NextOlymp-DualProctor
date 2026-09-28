<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = "127.0.0.1";
$port = "3306";
$dbname = "nextolymp"; 
$username = "alimoff";  
$password = "Olimov6890"; 

try {
    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Baza bilan aloqa yo'q: " . $e->getMessage()
    ]);
    exit;
}

function initNextOlympTables($pdo) {
    $sqls = [
        
        "CREATE TABLE IF NOT EXISTS `users` (
            `id` VARCHAR(64) PRIMARY KEY,
            `full_name` VARCHAR(150) NOT NULL,
            `fullName` VARCHAR(255) DEFAULT NULL,
            `phone` VARCHAR(64) DEFAULT NULL,
            `email` VARCHAR(191) DEFAULT NULL,
            `password_hash` VARCHAR(255) DEFAULT NULL,
            `password` VARCHAR(255) DEFAULT NULL,
            `role` ENUM('student', 'teacher', 'admin') DEFAULT 'student',
            `region` VARCHAR(100) DEFAULT '',
            `district` VARCHAR(100) DEFAULT '',
            `school` VARCHAR(150) DEFAULT '',
            `grade` INT DEFAULT 9,
            `score` INT DEFAULT 0,
            `avatar_url` TEXT DEFAULT NULL,
            `avatarUrl` TEXT DEFAULT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `createdAt` VARCHAR(64) DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        
        "CREATE TABLE IF NOT EXISTS `olympiads` (
            `id` VARCHAR(64) PRIMARY KEY,
            `title` VARCHAR(255) NOT NULL,
            `category` VARCHAR(100) DEFAULT 'math',
            `subject` VARCHAR(64) DEFAULT 'math',
            `description` TEXT DEFAULT NULL,
            `start_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `end_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `startDate` VARCHAR(64) DEFAULT NULL,
            `endDate` VARCHAR(64) DEFAULT NULL,
            `duration_minutes` INT DEFAULT 60,
            `durationMinutes` INT DEFAULT 60,
            `price` DECIMAL(10, 2) DEFAULT 0.00,
            `status` VARCHAR(32) DEFAULT 'active',
            `max_score` INT DEFAULT 100,
            `maxScore` INT DEFAULT 100,
            `total_questions` INT DEFAULT 25,
            `totalQuestions` INT DEFAULT 25,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `createdAt` VARCHAR(64) DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        
        "CREATE TABLE IF NOT EXISTS `questions` (
            `id` VARCHAR(64) PRIMARY KEY,
            `olympiad_id` VARCHAR(64) NOT NULL,
            `olympiadId` VARCHAR(64) DEFAULT NULL,
            `question_text` TEXT NOT NULL,
            `content` TEXT DEFAULT NULL,
            `option_a` VARCHAR(255) DEFAULT '',
            `option_b` VARCHAR(255) DEFAULT '',
            `option_c` VARCHAR(255) DEFAULT '',
            `option_d` VARCHAR(255) DEFAULT '',
            `options` LONGTEXT DEFAULT NULL,
            `correct_option` CHAR(1) DEFAULT 'A',
            `correctAnswer` VARCHAR(255) DEFAULT 'A',
            `difficulty_level` DECIMAL(4, 2) DEFAULT 0.00,
            `points` INT DEFAULT 4,
            `orderNum` INT DEFAULT 1,
            INDEX (`olympiad_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        
        "CREATE TABLE IF NOT EXISTS `submissions` (
            `id` VARCHAR(64) PRIMARY KEY,
            `user_id` VARCHAR(64) NOT NULL,
            `userId` VARCHAR(64) DEFAULT NULL,
            `userName` VARCHAR(255) DEFAULT NULL,
            `olympiad_id` VARCHAR(64) NOT NULL,
            `olympiadId` VARCHAR(64) DEFAULT NULL,
            `olympiadTitle` VARCHAR(255) DEFAULT NULL,
            `score` INT DEFAULT 0,
            `total_questions` INT DEFAULT 0,
            `maxScore` INT DEFAULT 100,
            `percentage` INT DEFAULT 0,
            `rasch_theta` DECIMAL(5, 2) DEFAULT 0.00,
            `answers_json` LONGTEXT DEFAULT NULL,
            `answers` LONGTEXT DEFAULT NULL,
            `timeSpentMinutes` INT DEFAULT 0,
            `status` VARCHAR(32) DEFAULT 'completed',
            `started_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `submitted_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `completedAt` VARCHAR(64) DEFAULT NULL,
            INDEX (`user_id`),
            INDEX (`olympiad_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        
        "CREATE TABLE IF NOT EXISTS `security_logs` (
            `id` VARCHAR(64) PRIMARY KEY,
            `user_id` VARCHAR(64) DEFAULT NULL,
            `studentId` VARCHAR(64) DEFAULT NULL,
            `studentName` VARCHAR(255) DEFAULT NULL,
            `ip_address` VARCHAR(45) NOT NULL,
            `event_type` VARCHAR(100) NOT NULL,
            `details` TEXT DEFAULT NULL,
            `severity` VARCHAR(32) DEFAULT 'medium',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        
        "CREATE TABLE IF NOT EXISTS `payments` (
            `id` VARCHAR(64) PRIMARY KEY,
            `user_id` VARCHAR(64) NOT NULL,
            `olympiad_id` VARCHAR(64) NOT NULL,
            `amount` DECIMAL(10, 2) NOT NULL,
            `provider` ENUM('click', 'payme', 'uzum') NOT NULL,
            `status` ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
            `transaction_id` VARCHAR(100) NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;",

        
        "CREATE TABLE IF NOT EXISTS `notifications` (
            `id` VARCHAR(64) PRIMARY KEY,
            `user_id` VARCHAR(64) NULL,
            `title` VARCHAR(255) NOT NULL,
            `message` TEXT NOT NULL,
            `is_read` BOOLEAN DEFAULT FALSE,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
    ];

    foreach ($sqls as $sql) {
        $pdo->exec($sql);
    }
}

initNextOlympTables($pdo);
