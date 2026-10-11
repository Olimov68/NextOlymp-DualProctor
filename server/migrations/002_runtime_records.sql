-- Runtime repository uses per-entity JSONB rows with database-enforced identifiers and references.
-- This schema is separate from the abandoned prototype migration; never drop existing tables.
CREATE TABLE IF NOT EXISTS app_records (
  kind text NOT NULL,
  id text NOT NULL,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  ordinal integer NOT NULL DEFAULT 0,
  exam_kind text GENERATED ALWAYS AS (CASE WHEN kind IN ('questions','sessions','submissions','snapshots','proctorSessions') THEN 'exams' END) STORED,
  exam_id text GENERATED ALWAYS AS (CASE WHEN kind IN ('questions','sessions','submissions','snapshots','proctorSessions') THEN payload->>'examId' END) STORED,
  user_kind text GENERATED ALWAYS AS (CASE WHEN kind IN ('sessions','submissions','snapshots') THEN 'users' END) STORED,
  user_id text GENERATED ALWAYS AS (CASE WHEN kind IN ('sessions','submissions','snapshots') THEN payload->>'userId' END) STORED,
  PRIMARY KEY (kind,id),
  FOREIGN KEY (exam_kind,exam_id) REFERENCES app_records(kind,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (user_kind,user_id) REFERENCES app_records(kind,id) DEFERRABLE INITIALLY DEFERRED
);
CREATE UNIQUE INDEX IF NOT EXISTS app_user_email ON app_records(lower(payload->>'email')) WHERE kind='users';
CREATE UNIQUE INDEX IF NOT EXISTS app_user_phone ON app_records((regexp_replace(payload->>'phone','[^0-9]','','g'))) WHERE kind='users' AND COALESCE(payload->>'phone','')<>'';
CREATE UNIQUE INDEX IF NOT EXISTS app_certificate_code ON app_records(upper(payload->>'verificationCode')) WHERE kind='submissions' AND COALESCE(payload->>'verificationCode','')<>'';
CREATE UNIQUE INDEX IF NOT EXISTS app_submission_attempt ON app_records((payload->>'userId'),(payload->>'examId'),(COALESCE(payload->>'attempt','1'))) WHERE kind='submissions';
CREATE UNIQUE INDEX IF NOT EXISTS app_submission_session ON app_records((payload->>'sessionId')) WHERE kind='submissions' AND COALESCE(payload->>'sessionId','')<>'';
CREATE UNIQUE INDEX IF NOT EXISTS app_proctor_event_id ON app_records((payload->>'sessionId'),(payload->>'eventId')) WHERE kind='proctorEvents' AND COALESCE(payload->>'eventId','')<>'';
