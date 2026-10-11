-- =========================================================================
-- NextOlymp & IbnSino Platform - PostgreSQL Production Schema Migration 001
-- Covers all 11 core domain entities with strict constraints, FKs, and indexes.
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(32),
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'parent')),
    grade INT CHECK (grade >= 1 AND grade <= 12),
    region VARCHAR(128),
    district VARCHAR(128),
    school VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. EXAMS TABLE
CREATE TABLE IF NOT EXISTS exams (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(128) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    total_points INT NOT NULL DEFAULT 100 CHECK (total_points >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'kutilmoqda' CHECK (status IN ('kutilmoqda', 'faol', 'yopiq', 'arxiv')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    registration_end_date TIMESTAMPTZ,
    is_always_open BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject);

-- 4. ANTI-CHEAT POLICIES TABLE (1:1 with Exam)
CREATE TABLE IF NOT EXISTS anti_cheat_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id VARCHAR(64) UNIQUE NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    proctoring_mode VARCHAR(32) NOT NULL DEFAULT 'STANDARD' CHECK (proctoring_mode IN ('STRICT', 'STANDARD', 'RELAXED', 'DISABLED')),
    
    -- Face & Camera checks
    require_webcam BOOLEAN NOT NULL DEFAULT TRUE,
    require_mic BOOLEAN NOT NULL DEFAULT FALSE,
    require_both_eyes_visible BOOLEAN NOT NULL DEFAULT TRUE,
    strict_face_check BOOLEAN NOT NULL DEFAULT FALSE,
    track_gaze_direction BOOLEAN NOT NULL DEFAULT TRUE,
    min_face_confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.70 CHECK (min_face_confidence >= 0.50 AND min_face_confidence <= 0.95),
    max_absence_grace_period INT NOT NULL DEFAULT 4 CHECK (max_absence_grace_period >= 1 AND max_absence_grace_period <= 10),
    max_violations_allowed INT NOT NULL DEFAULT 3 CHECK (max_violations_allowed >= 1 AND max_violations_allowed <= 20),
    
    -- Voice biometrics
    require_voice_biometrics BOOLEAN NOT NULL DEFAULT FALSE,
    detect_unknown_speakers BOOLEAN NOT NULL DEFAULT TRUE,
    detect_multiple_speakers BOOLEAN NOT NULL DEFAULT TRUE,
    voice_similarity_threshold NUMERIC(3, 2) NOT NULL DEFAULT 0.70 CHECK (voice_similarity_threshold >= 0.50 AND voice_similarity_threshold <= 0.95),
    
    -- Browser lockdown
    block_tab_switch BOOLEAN NOT NULL DEFAULT TRUE,
    block_copy_paste BOOLEAN NOT NULL DEFAULT TRUE,
    require_fullscreen BOOLEAN NOT NULL DEFAULT TRUE,
    block_dev_tools BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Network & Single IP
    block_duplicate_ip BOOLEAN NOT NULL DEFAULT FALSE,
    heartbeat_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    heartbeat_interval_sec INT NOT NULL DEFAULT 10 CHECK (heartbeat_interval_sec >= 2 AND heartbeat_interval_sec <= 60),
    
    -- Evidence snapshots
    camera_face_snapshot_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    snapshot_on_multiple_faces BOOLEAN NOT NULL DEFAULT TRUE,
    snapshot_on_no_face BOOLEAN NOT NULL DEFAULT TRUE,
    
    version INT NOT NULL DEFAULT 1,
    updated_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anti_cheat_policies_exam_id ON anti_cheat_policies(exam_id);

-- 5. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(64) PRIMARY KEY,
    exam_id VARCHAR(64) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 0,
    type VARCHAR(32) NOT NULL DEFAULT 'MULTIPLE_CHOICE' CHECK (type IN ('MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY', 'TRUE_FALSE', 'FILE_UPLOAD')),
    text TEXT NOT NULL,
    options JSONB, -- Array of string options or {id, text}
    correct_answer TEXT NOT NULL, -- Strictly mandatory, never defaults to A
    points NUMERIC(6, 2) NOT NULL DEFAULT 5.0 CHECK (points >= 0),
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(exam_id, order_index);

-- 6. EXAM SESSIONS TABLE
CREATE TABLE IF NOT EXISTS exam_sessions (
    id VARCHAR(64) PRIMARY KEY,
    exam_id VARCHAR(64) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'DISQUALIFIED', 'TIMEOUT', 'DISCONNECTED')),
    client_ip VARCHAR(64),
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    violation_count INT NOT NULL DEFAULT 0 CHECK (violation_count >= 0),
    disqualification_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_exam ON exam_sessions(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_ip ON exam_sessions(client_ip);

-- 7. HEARTBEAT TABLE
CREATE TABLE IF NOT EXISTS session_heartbeats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(64) NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    client_time TIMESTAMPTZ NOT NULL,
    server_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_heartbeats_session ON session_heartbeats(session_id, created_at);

-- 8. PROCTOR EVENTS TABLE
CREATE TABLE IF NOT EXISTS proctor_events (
    id VARCHAR(64) PRIMARY KEY, -- event_id for idempotency
    session_id VARCHAR(64) NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    exam_id VARCHAR(64) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    details TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_violation BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proctor_events_session ON proctor_events(session_id);
CREATE INDEX IF NOT EXISTS idx_proctor_events_exam_user ON proctor_events(exam_id, user_id);

-- 9. SNAPSHOTS / EVIDENCE METADATA TABLE
CREATE TABLE IF NOT EXISTS snapshots (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    exam_id VARCHAR(64) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(64) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    mime_type VARCHAR(32) NOT NULL DEFAULT 'image/jpeg',
    size_bytes INT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 1048576), -- Max 1MB
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snapshots_exam ON snapshots(exam_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_session ON snapshots(session_id);

-- 10. ANSWERS TABLE
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(64) NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct BOOLEAN,
    points_awarded NUMERIC(6, 2) DEFAULT 0 CHECK (points_awarded >= 0),
    answered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_session_question UNIQUE (session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_session ON answers(session_id);

-- 11. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS submissions (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) UNIQUE NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    exam_id VARCHAR(64) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_score NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (total_score >= 0),
    max_possible_score NUMERIC(6, 2) NOT NULL DEFAULT 100,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_exam_score ON submissions(exam_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);

-- 12. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(64) PRIMARY KEY,
    submission_id VARCHAR(64) UNIQUE NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id VARCHAR(64) NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    verification_code VARCHAR(64) UNIQUE NOT NULL,
    qr_code_data TEXT NOT NULL,
    score NUMERIC(6, 2) NOT NULL,
    rank INT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);
