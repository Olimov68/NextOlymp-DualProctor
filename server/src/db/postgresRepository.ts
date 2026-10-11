import { Pool, PoolClient } from 'pg';
import {
  UserRecord,
  ExamRecord,
  QuestionRecord,
  ExamSessionRecord,
  AntiCheatConfig,
  SnapshotRecord,
} from './store';

export interface DatabaseConfig {
  connectionString?: string;
  isProduction: boolean;
}

export class PostgresRepository {
  private pool: Pool | null = null;
  private readonly isProduction: boolean;

  constructor(config?: Partial<DatabaseConfig>) {
    this.isProduction = config?.isProduction ?? (process.env.NODE_ENV === 'production');
    const connectionString = config?.connectionString ?? process.env.DATABASE_URL;

    if (!connectionString) {
      if (this.isProduction) {
        // FAIL-FAST in production if DATABASE_URL is missing
        throw new Error(
          '[FATAL] Production database configuration missing! DATABASE_URL must be specified in production.'
        );
      } else {
        console.warn(
          '[Database] DATABASE_URL mavjud emas. Development muhitida JSON fallback ishlatilmoqda.'
        );
      }
    } else {
      this.pool = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      this.pool.on('error', (err) => {
        console.error('[PostgreSQL] Kutilmagan pool xatosi:', err);
      });
    }
  }

  public isAvailable(): boolean {
    return this.pool !== null;
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.pool) {
      throw new Error('PostgreSQL ulanishi mavjud emas');
    }
    const res = await this.pool.query(sql, params);
    return res.rows;
  }

  public async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('PostgreSQL ulanishi mavjud emas');
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // --- 1. Users ---
  public async findUserByEmail(email: string): Promise<UserRecord | null> {
    const rows = await this.query<UserRecord>(
      'SELECT id, email, phone, password_hash as "passwordHash", full_name as "fullName", role, grade, region, district, school, is_active as "isActive", created_at as "createdAt" FROM users WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );
    return rows[0] || null;
  }

  public async createUser(user: UserRecord): Promise<void> {
    await this.query(
      `INSERT INTO users (id, email, phone, password_hash, full_name, role, grade, region, district, school, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        user.id,
        user.email.toLowerCase(),
        user.phone || null,
        user.passwordHash,
        user.fullName,
        user.role,
        user.grade || null,
        user.region || null,
        user.district || null,
        user.school || null,
        user.isActive ?? true,
        user.createdAt || new Date().toISOString(),
      ]
    );
  }

  // --- 2. Exams & AntiCheat ---
  public async findExamById(id: string): Promise<ExamRecord | null> {
    const rows = await this.query<any>(
      `SELECT e.id, e.title, e.subject, e.duration_minutes as "durationMinutes", e.total_points as "totalPoints", e.status,
              e.start_date as "startDate", e.end_date as "endDate", e.registration_end_date as "registrationEndDate",
              e.is_always_open as "isAlwaysOpen", e.created_at as "createdAt",
              row_to_json(p) as "antiCheatConfig"
       FROM exams e
       LEFT JOIN anti_cheat_policies p ON p.exam_id = e.id
       WHERE e.id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  public async saveAntiCheatPolicy(examId: string, policy: AntiCheatConfig): Promise<void> {
    await this.query(
      `INSERT INTO anti_cheat_policies (
         exam_id, enabled, proctoring_mode, require_webcam, require_mic, require_both_eyes_visible,
         strict_face_check, track_gaze_direction, min_face_confidence, max_absence_grace_period,
         max_violations_allowed, require_voice_biometrics, detect_unknown_speakers, detect_multiple_speakers,
         voice_similarity_threshold, block_tab_switch, block_copy_paste, require_fullscreen, block_dev_tools,
         block_duplicate_ip, heartbeat_enabled, heartbeat_interval_sec, camera_face_snapshot_enabled,
         snapshot_on_multiple_faces, snapshot_on_no_face, version, updated_by, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
         $11, $12, $13, $14, $15, $16, $17, $18, $19,
         $20, $21, $22, $23, $24, $25, $26, $27, $28
       )
       ON CONFLICT (exam_id) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         proctoring_mode = EXCLUDED.proctoring_mode,
         require_webcam = EXCLUDED.require_webcam,
         require_mic = EXCLUDED.require_mic,
         require_both_eyes_visible = EXCLUDED.require_both_eyes_visible,
         strict_face_check = EXCLUDED.strict_face_check,
         track_gaze_direction = EXCLUDED.track_gaze_direction,
         min_face_confidence = EXCLUDED.min_face_confidence,
         max_absence_grace_period = EXCLUDED.max_absence_grace_period,
         max_violations_allowed = EXCLUDED.max_violations_allowed,
         require_voice_biometrics = EXCLUDED.require_voice_biometrics,
         detect_unknown_speakers = EXCLUDED.detect_unknown_speakers,
         detect_multiple_speakers = EXCLUDED.detect_multiple_speakers,
         voice_similarity_threshold = EXCLUDED.voice_similarity_threshold,
         block_tab_switch = EXCLUDED.block_tab_switch,
         block_copy_paste = EXCLUDED.block_copy_paste,
         require_fullscreen = EXCLUDED.require_fullscreen,
         block_dev_tools = EXCLUDED.block_dev_tools,
         block_duplicate_ip = EXCLUDED.block_duplicate_ip,
         heartbeat_enabled = EXCLUDED.heartbeat_enabled,
         heartbeat_interval_sec = EXCLUDED.heartbeat_interval_sec,
         camera_face_snapshot_enabled = EXCLUDED.camera_face_snapshot_enabled,
         snapshot_on_multiple_faces = EXCLUDED.snapshot_on_multiple_faces,
         snapshot_on_no_face = EXCLUDED.snapshot_on_no_face,
         version = EXCLUDED.version,
         updated_by = EXCLUDED.updated_by,
         updated_at = EXCLUDED.updated_at`,
      [
        examId,
        policy.enabled,
        policy.proctoringMode,
        policy.requireWebcam,
        policy.requireMic,
        policy.requireBothEyesVisible,
        policy.strictFaceCheck,
        policy.trackGazeDirection,
        policy.minFaceConfidence,
        policy.maxAbsenceGracePeriod,
        policy.maxViolationsAllowed,
        policy.requireVoiceBiometrics,
        policy.detectUnknownSpeakers,
        policy.detectMultipleSpeakers,
        policy.voiceSimilarityThreshold,
        policy.blockTabSwitch,
        policy.blockCopyPaste,
        policy.requireFullscreen,
        policy.blockDevTools,
        policy.blockDuplicateIP,
        policy.heartbeatEnabled,
        policy.heartbeatIntervalSec,
        policy.cameraFaceSnapshotEnabled,
        policy.snapshotOnMultipleFaces,
        policy.snapshotOnNoFace,
        policy.version,
        policy.updatedBy || null,
        policy.updatedAt || new Date().toISOString(),
      ]
    );
  }

  public async getExamAntiCheatConfig(examId: string): Promise<AntiCheatConfig | null> {
    const exam = await this.findExamById(examId);
    return (exam?.antiCheatConfig as AntiCheatConfig) || null;
  }

  public async saveExamAntiCheatConfig(examId: string, policy: AntiCheatConfig): Promise<void> {
    return this.saveAntiCheatPolicy(examId, policy);
  }

  public async createSession(session: ExamSessionRecord): Promise<void> {
    await this.query(
      `INSERT INTO exam_sessions (id, exam_id, user_id, status, client_ip, started_at, expires_at, last_heartbeat_at, violation_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        session.sessionId || session.id,
        session.examId,
        session.userId,
        session.status,
        session.clientIp || null,
        session.startedAt,
        session.expiresAt,
        session.lastHeartbeatAt || session.startedAt,
        session.violationCount || 0,
      ]
    );
  }

  /**
   * Atomic session creation + Single IP check inside a PostgreSQL transaction with row locks
   */
  public async createSessionAtomic(
    session: ExamSessionRecord,
    policy: AntiCheatConfig
  ): Promise<{ success: boolean; session?: ExamSessionRecord; error?: string; code?: string }> {
    return this.withTransaction(async (client) => {
      const now = Date.now();

      // 1. Lock the exam record to serialize concurrent session creations for this exam
      await client.query('SELECT id FROM exams WHERE id = $1 FOR UPDATE', [session.examId]);

      // 2. Check Single-IP constraint if enabled in policy
      if (policy.enabled && policy.blockDuplicateIP && session.clientIp) {
        const cleanIp = session.clientIp.replace(/^.*:/, '').trim();
        const isLoopback = ['127.0.0.1', '::1', 'localhost', '0.0.0.0'].includes(cleanIp);

        if (!isLoopback) {
          const conflictRes = await client.query(
            `SELECT id, user_id FROM exam_sessions 
             WHERE exam_id = $1 
               AND client_ip = $2 
               AND status = 'IN_PROGRESS' 
               AND user_id != $3 
               AND expires_at > $4 
             LIMIT 1 FOR UPDATE`,
            [session.examId, cleanIp, session.userId, now]
          );

          if (conflictRes.rows.length > 0) {
            return {
              success: false,
              code: 'SINGLE_IP_VIOLATION',
              error: 'Bitta IP manzildan bir vaqtning o‘zida faqat bitta faol imtihon sessiyasiga ruxsat beriladi',
            };
          }
        }
      }

      // 3. Check if user already has an active session for this exam
      const existingUserSession = await client.query(
        `SELECT id FROM exam_sessions 
         WHERE exam_id = $1 
           AND user_id = $2 
           AND status = 'IN_PROGRESS' 
           AND expires_at > $3 
         LIMIT 1 FOR UPDATE`,
        [session.examId, session.userId, now]
      );

      if (existingUserSession.rows.length > 0) {
        return {
          success: false,
          code: 'ACTIVE_SESSION_EXISTS',
          error: 'Sizda ushbu imtihon uchun allaqachon faol sessiya mavjud',
        };
      }

      // 4. Insert the new session inside the transaction
      await client.query(
        `INSERT INTO exam_sessions (id, exam_id, user_id, status, client_ip, started_at, expires_at, last_heartbeat_at, violation_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          session.sessionId || session.id,
          session.examId,
          session.userId,
          session.status,
          session.clientIp || null,
          session.startedAt,
          session.expiresAt,
          session.lastHeartbeatAt || session.startedAt,
          session.violationCount || 0,
        ]
      );

      return { success: true, session };
    });
  }

  public async recordHeartbeat(sessionId: string, clientTime: string): Promise<void> {
    await this.withTransaction(async (client) => {
      await client.query(
        'UPDATE exam_sessions SET last_heartbeat_at = CURRENT_TIMESTAMP WHERE id = $1',
        [sessionId]
      );
      await client.query(
        'INSERT INTO session_heartbeats (session_id, client_time, server_time) VALUES ($1, $2, CURRENT_TIMESTAMP)',
        [sessionId, clientTime]
      );
    });
  }

  public async recordProctorEvent(event: {
    id: string;
    sessionId: string;
    examId: string;
    userId: string;
    eventType: string;
    details?: string;
    occurredAt: string;
    isViolation: boolean;
  }): Promise<void> {
    await this.query(
      `INSERT INTO proctor_events (id, session_id, exam_id, user_id, event_type, details, occurred_at, is_violation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        event.id,
        event.sessionId,
        event.examId,
        event.userId,
        event.eventType,
        event.details || null,
        event.occurredAt,
        event.isViolation,
      ]
    );
  }

  public async saveSnapshot(snapshot: SnapshotRecord): Promise<void> {
    await this.query(
      `INSERT INTO snapshots (id, session_id, exam_id, user_id, reason, file_path, mime_type, size_bytes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        snapshot.id,
        snapshot.sessionId,
        snapshot.examId,
        snapshot.userId,
        snapshot.reason || snapshot.eventType,
        snapshot.filePath,
        snapshot.mimeType,
        snapshot.sizeBytes ?? snapshot.fileSize,
        snapshot.createdAt,
      ]
    );
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

// Global factory with fail-fast check
export const postgresRepository = new PostgresRepository({
  connectionString: process.env.DATABASE_URL,
  isProduction: process.env.NODE_ENV === 'production',
});
