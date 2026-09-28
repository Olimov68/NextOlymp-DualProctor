<?php

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM `olympiads` ORDER BY `id` DESC");
        $olympiads = $stmt->fetchAll();

        foreach ($olympiads as &$olymp) {
            $olymp['id'] = (string)$olymp['id'];
            $olymp['title'] = $olymp['title'] ?? 'Olimpiada';
            $olymp['subject'] = $olymp['subject'] ?? ($olymp['category'] ?? 'Matematika');
            $olymp['category'] = $olymp['category'] ?? ($olymp['subject'] ?? 'math');
            $olymp['format'] = $olymp['format'] ?? 'online';
            $olymp['price'] = (float)($olymp['price'] ?? 0);
            $olymp['status'] = in_array($olymp['status'] ?? '', ['ochiq', 'yopiq']) ? $olymp['status'] : ($olymp['status'] === 'active' ? 'ochiq' : 'yopiq');
            $olymp['startDate'] = $olymp['startDate'] ?? ($olymp['start_time'] ?? date('Y-m-d H:i'));
            $olymp['endDate'] = $olymp['endDate'] ?? ($olymp['end_time'] ?? date('Y-m-d H:i', time() + 7 * 86400));
            $olymp['durationMinutes'] = (int)($olymp['durationMinutes'] ?? ($olymp['duration_minutes'] ?? 60));
            $olymp['maxScore'] = (int)($olymp['maxScore'] ?? ($olymp['max_score'] ?? 100));
            $olymp['totalQuestions'] = (int)($olymp['totalQuestions'] ?? ($olymp['total_questions'] ?? 25));
            $olymp['registeredCount'] = (int)($olymp['registeredCount'] ?? 0);
            $olymp['submittedCount'] = (int)($olymp['submittedCount'] ?? 0);
            $olymp['paidCount'] = (int)($olymp['paidCount'] ?? 0);
            $olymp['totalRevenue'] = (float)($olymp['totalRevenue'] ?? 0);
            $olymp['isPinned'] = !empty($olymp['isPinned']);
            $olymp['description'] = $olymp['description'] ?? '';
            $olymp['organizer'] = $olymp['organizer'] ?? 'NextOlymp Kengashi';
            $olymp['image'] = $olymp['image'] ?? 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80';

            
            try {
                $qStmt = $pdo->prepare("SELECT * FROM `questions` WHERE `olympiad_id` = ? OR `olympiadId` = ?");
                $qStmt->execute([$olymp['id'], $olymp['id']]);
                $rawQuestions = $qStmt->fetchAll();
                $questions = [];
                foreach ($rawQuestions as $rq) {
                    $optArr = !empty($rq['options']) ? (is_string($rq['options']) ? json_decode($rq['options'], true) : $rq['options']) : [$rq['option_a'] ?? '', $rq['option_b'] ?? '', $rq['option_c'] ?? '', $rq['option_d'] ?? ''];
                    $questions[] = [
                        'id' => (string)$rq['id'],
                        'olympiadId' => (string)$olymp['id'],
                        'question_text' => $rq['question_text'] ?? ($rq['content'] ?? ''),
                        'text' => $rq['question_text'] ?? ($rq['content'] ?? ''),
                        'content' => $rq['content'] ?? ($rq['question_text'] ?? ''),
                        'option_a' => $rq['option_a'] ?? ($optArr[0] ?? ''),
                        'option_b' => $rq['option_b'] ?? ($optArr[1] ?? ''),
                        'option_c' => $rq['option_c'] ?? ($optArr[2] ?? ''),
                        'option_d' => $rq['option_d'] ?? ($optArr[3] ?? ''),
                        'options' => $optArr,
                        'correct_option' => $rq['correct_option'] ?? ($rq['correctAnswer'] ?? 'A'),
                        'correctAnswer' => $rq['correctAnswer'] ?? ($rq['correct_option'] ?? 'A'),
                        'difficulty_level' => (float)($rq['difficulty_level'] ?? 0.0),
                        'points' => (int)($rq['points'] ?? 4)
                    ];
                }
                $olymp['questions'] = $questions;
            } catch (Exception $qe) {
                $olymp['questions'] = [];
            }
        }

        echo json_encode(['status' => 'success', 'data' => $olympiads]);
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

    if (empty($data['id']) || empty($data['title'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID va Sarlavha talab qilinadi (id, title)']);
        exit;
    }

    $id = (string)$data['id'];
    $title = trim($data['title']);
    $category = $data['category'] ?? ($data['subject'] ?? 'math');
    $subject = $data['subject'] ?? ($data['category'] ?? 'Matematika');
    $format = $data['format'] ?? 'online';
    $description = $data['description'] ?? '';
    $image = $data['image'] ?? 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80';
    $startDate = $data['startDate'] ?? ($data['start_time'] ?? date('Y-m-d H:i:s'));
    $endDate = $data['endDate'] ?? ($data['end_time'] ?? date('Y-m-d H:i:s', time() + 7 * 86400));
    $durationMinutes = (int)($data['durationMinutes'] ?? ($data['duration_minutes'] ?? 60));
    $price = (float)($data['price'] ?? 0);
    $status = $data['status'] ?? 'ochiq';
    $isPinned = !empty($data['isPinned']) ? 1 : 0;
    $maxScore = (int)($data['maxScore'] ?? ($data['max_score'] ?? 100));
    $totalQuestions = (int)($data['totalQuestions'] ?? ($data['total_questions'] ?? (isset($data['questions']) ? count($data['questions']) : 25)));
    $registeredCount = (int)($data['registeredCount'] ?? 0);
    $submittedCount = (int)($data['submittedCount'] ?? 0);
    $paidCount = (int)($data['paidCount'] ?? 0);
    $totalRevenue = (float)($data['totalRevenue'] ?? 0);
    $organizer = $data['organizer'] ?? 'NextOlymp Kengashi';

    $sql = "INSERT INTO `olympiads` (
        `id`, `title`, `category`, `subject`, `format`, `description`, `image`,
        `start_time`, `end_time`, `startDate`, `endDate`, `duration_minutes`, `durationMinutes`,
        `price`, `status`, `isPinned`, `max_score`, `maxScore`, `total_questions`, `totalQuestions`,
        `registeredCount`, `submittedCount`, `paidCount`, `totalRevenue`, `organizer`
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
    ) ON DUPLICATE KEY UPDATE
        `title` = VALUES(`title`),
        `category` = VALUES(`category`),
        `subject` = VALUES(`subject`),
        `format` = VALUES(`format`),
        `description` = VALUES(`description`),
        `image` = VALUES(`image`),
        `start_time` = VALUES(`start_time`),
        `end_time` = VALUES(`end_time`),
        `startDate` = VALUES(`startDate`),
        `endDate` = VALUES(`endDate`),
        `duration_minutes` = VALUES(`duration_minutes`),
        `durationMinutes` = VALUES(`durationMinutes`),
        `price` = VALUES(`price`),
        `status` = VALUES(`status`),
        `isPinned` = VALUES(`isPinned`),
        `max_score` = VALUES(`max_score`),
        `maxScore` = VALUES(`maxScore`),
        `total_questions` = VALUES(`total_questions`),
        `totalQuestions` = VALUES(`totalQuestions`),
        `registeredCount` = VALUES(`registeredCount`),
        `submittedCount` = VALUES(`submittedCount`),
        `paidCount` = VALUES(`paidCount`),
        `totalRevenue` = VALUES(`totalRevenue`),
        `organizer` = VALUES(`organizer`)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $id, $title, $category, $subject, $format, $description, $image,
        $startDate, $endDate, $startDate, $endDate, $durationMinutes, $durationMinutes,
        $price, $status, $isPinned, $maxScore, $maxScore, $totalQuestions, $totalQuestions,
        $registeredCount, $submittedCount, $paidCount, $totalRevenue, $organizer
    ]);

    
    if (isset($data['questions']) && is_array($data['questions']) && count($data['questions']) > 0) {
        $del = $pdo->prepare("DELETE FROM `questions` WHERE `olympiad_id` = ? OR `olympiadId` = ?");
        $del->execute([$id, $id]);

        $qInsert = $pdo->prepare("INSERT INTO `questions` (
            `id`, `olympiad_id`, `olympiadId`, `question_text`, `content`,
            `option_a`, `option_b`, `option_c`, `option_d`, `options`,
            `correct_option`, `correctAnswer`, `difficulty_level`, `points`, `orderNum`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $order = 1;
        foreach ($data['questions'] as $q) {
            $qId = (string)($q['id'] ?? "q_{$id}_{$order}");
            $qText = $q['question_text'] ?? ($q['content'] ?? ($q['text'] ?? "Savol 
            $opts = $q['options'] ?? [$q['option_a'] ?? '', $q['option_b'] ?? '', $q['option_c'] ?? '', $q['option_d'] ?? ''];
            $optA = $q['option_a'] ?? ($opts[0] ?? '');
            $optB = $q['option_b'] ?? ($opts[1] ?? '');
            $optC = $q['option_c'] ?? ($opts[2] ?? '');
            $optD = $q['option_d'] ?? ($opts[3] ?? '');
            $correct = $q['correct_option'] ?? ($q['correctAnswer'] ?? 'A');
            $diff = (float)($q['difficulty_level'] ?? 0.0);
            $points = (int)($q['points'] ?? 4);

            $qInsert->execute([
                $qId, $id, $id, $qText, $qText,
                $optA, $optB, $optC, $optD, json_encode($opts),
                $correct, $correct, $diff, $points, $order
            ]);
            $order++;
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Olimpiada MySQL bazasiga muvaffaqiyatli saqlandi',
        'id' => $id
    ]);
    exit;
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'ID talab qilinadi']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM `olympiads` WHERE `id` = ?");
    $stmt->execute([$id]);

    echo json_encode(['status' => 'success', 'message' => 'Olimpiada MySQL bazasidan o\'chirildi']);
    exit;
}
