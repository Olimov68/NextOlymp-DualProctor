

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `security_logs`;
DROP TABLE IF EXISTS `submissions`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `olympiads`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
    `id` VARCHAR(64) PRIMARY KEY,
    `full_name` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) UNIQUE NOT NULL,
    `email` VARCHAR(191) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    `gender` VARCHAR(16) DEFAULT 'male',
    `region` VARCHAR(100) DEFAULT '',
    `district` VARCHAR(100) DEFAULT '',
    `school` VARCHAR(150) DEFAULT '',
    `grade` INT DEFAULT 9,
    `score` INT DEFAULT 0,
    `status` VARCHAR(32) DEFAULT 'active',
    `package` VARCHAR(32) DEFAULT 'Bepul',
    `avatar_url` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `olympiads` (
    `id` VARCHAR(64) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) DEFAULT 'math',
    `subject` VARCHAR(100) DEFAULT 'Matematika',
    `format` VARCHAR(32) DEFAULT 'online',
    `description` TEXT DEFAULT NULL,
    `image` TEXT DEFAULT NULL,
    `start_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `end_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `startDate` VARCHAR(64) DEFAULT NULL,
    `endDate` VARCHAR(64) DEFAULT NULL,
    `duration_minutes` INT DEFAULT 60,
    `durationMinutes` INT DEFAULT 60,
    `price` DECIMAL(10, 2) DEFAULT 0.00,
    `status` VARCHAR(32) DEFAULT 'ochiq',
    `isPinned` BOOLEAN DEFAULT FALSE,
    `max_score` INT DEFAULT 100,
    `maxScore` INT DEFAULT 100,
    `total_questions` INT DEFAULT 25,
    `totalQuestions` INT DEFAULT 25,
    `registeredCount` INT DEFAULT 0,
    `submittedCount` INT DEFAULT 0,
    `paidCount` INT DEFAULT 0,
    `totalRevenue` DECIMAL(10, 2) DEFAULT 0.00,
    `organizer` VARCHAR(150) DEFAULT 'NextOlymp Kengashi',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `questions` (
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
    `correctAnswer` VARCHAR(32) DEFAULT 'A',
    `difficulty_level` DECIMAL(4, 2) DEFAULT 0.00, 
    `points` INT DEFAULT 4,
    `orderNum` INT DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (`olympiad_id`),
    CONSTRAINT `fk_questions_olympiad` FOREIGN KEY (`olympiad_id`) REFERENCES `olympiads`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `submissions` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `userId` VARCHAR(64) DEFAULT NULL,
    `userName` VARCHAR(255) DEFAULT NULL,
    `olympiad_id` VARCHAR(64) NOT NULL,
    `olympiadId` VARCHAR(64) DEFAULT NULL,
    `olympiadTitle` VARCHAR(255) DEFAULT NULL,
    `score` INT DEFAULT 0,
    `total_questions` INT DEFAULT 25,
    `maxScore` INT DEFAULT 100,
    `percentage` INT DEFAULT 0,
    `rasch_theta` DECIMAL(5, 2) DEFAULT 0.00, 
    `answers_json` LONGTEXT DEFAULT NULL,
    `answers` LONGTEXT DEFAULT NULL,
    `timeSpentMinutes` INT DEFAULT 0,
    `status` VARCHAR(32) DEFAULT 'completed',
    `started_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `submitted_at` DATETIME NULL,
    INDEX (`user_id`),
    INDEX (`olympiad_id`),
    CONSTRAINT `fk_submissions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_submissions_olympiad` FOREIGN KEY (`olympiad_id`) REFERENCES `olympiads`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `security_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(64) NULL,
    `studentId` VARCHAR(64) NULL,
    `studentName` VARCHAR(255) NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `event_type` VARCHAR(100) NOT NULL, 
    `details` TEXT NULL,
    `severity` VARCHAR(32) DEFAULT 'medium',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `olympiad_id` VARCHAR(64) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `provider` ENUM('click', 'payme', 'uzum') NOT NULL,
    `status` ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    `transaction_id` VARCHAR(100) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (`user_id`),
    INDEX (`olympiad_id`),
    CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_payments_olympiad` FOREIGN KEY (`olympiad_id`) REFERENCES `olympiads`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` VARCHAR(64) NULL, 
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
