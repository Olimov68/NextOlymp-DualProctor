import { dbStore, ExamSessionRecord, AntiCheatConfig } from '../db/store';
import { databaseTransaction } from '../db/transactionStore';
import { sweepSnapshots } from './snapshotRetention';

export interface HeartbeatSweepResult {
  checkedCount: number;
  disconnectedCount: number;
  disconnectedSessionIds: string[];
}

export class HeartbeatWorker {
  private timer: NodeJS.Timeout | null = null;
  private isSweeping = false;
  private lastRetentionSweep = 0;

  constructor(private sweepIntervalMs: number = 5000) {}

  public start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.sweepHeartbeats().catch((err) => {
        console.error('[HeartbeatWorker Sweep Error]:', err);
      });
      if (Date.now() - this.lastRetentionSweep > 3600_000) {
        this.lastRetentionSweep = Date.now();
        void sweepSnapshots().catch(() => console.error('[snapshots] Retention failed; retry next hour'));
      }
    }, this.sweepIntervalMs);
    // unref to allow node process to exit cleanly in test environments
    if (this.timer.unref) {
      this.timer.unref();
    }
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Authoritative server sweep of all active sessions
   * Accepts optional `currentTime` for deterministic unit & integration tests with fake timers
   */
  public async sweepHeartbeats(currentTime?: number): Promise<HeartbeatSweepResult> {
    return databaseTransaction(() => this.sweepInsideTransaction(currentTime));
  }

  private async sweepInsideTransaction(currentTime?: number): Promise<HeartbeatSweepResult> {
    if (this.isSweeping) {
      return { checkedCount: 0, disconnectedCount: 0, disconnectedSessionIds: [] };
    }
    this.isSweeping = true;

    try {
      const now = currentTime ?? Date.now();
      const sessions = dbStore.getSessions();
      const activeSessions = sessions.filter((s) => ['IN_PROGRESS', 'DISCONNECTED'].includes(s.status));

      const disconnectedSessionIds: string[] = [];

      for (const session of activeSessions) {
        if (now >= session.expiresAt) {
          // Timer expiry is authoritative even if the browser is closed or offline.
          dbStore.finishAndGradeExam(session.sessionId);
          continue;
        }
        const policy: AntiCheatConfig = dbStore.getExamAntiCheatConfig(session.examId);

        // If heartbeat is disabled in anti-cheat policy, skip
        if (session.mode === 'practice' || !policy.enabled || !policy.heartbeatEnabled) {
          continue;
        }

        const intervalSec = policy.heartbeatIntervalSec || 10;
        const maxSilenceMs = intervalSec * 3 * 1000;
        const lastBeat = session.lastHeartbeatAt || session.startedAt;
        const elapsed = now - lastBeat;

        if (elapsed > maxSilenceMs) {
          // Idempotent state transition: Only transition if still IN_PROGRESS
          if (session.status === 'IN_PROGRESS') {
            session.status = 'DISCONNECTED';

            const eventId = `evt_hb_timeout_${session.sessionId}_${Math.floor(lastBeat / 1000)}`;

            // Ensure event is not logged more than once even if multiple sweeps happen
            if (!session.processedEventIds) {
              session.processedEventIds = [];
            }

            if (!session.processedEventIds.includes(eventId)) {
              session.processedEventIds.push(eventId);

              dbStore.addProctorEvent({
                id: `prc_hb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                eventId,
                sessionId: session.sessionId,
                userId: session.userId,
                examId: session.examId,
                eventType: 'HEARTBEAT_TIMEOUT',
                details: `Aloqa uzildi: ${Math.round(elapsed / 1000)} soniya davomida heartbeat kelmadi (ruxsat etilgan maksimal muddat: ${intervalSec * 3}s)`,
                severity: 'high',
                timestamp: new Date(now).toISOString(),
                ipAddress: session.clientIp || '127.0.0.1',
              });
            }

            disconnectedSessionIds.push(session.sessionId);
          }
        }
      }

      if (disconnectedSessionIds.length > 0) {
        dbStore.saveData();
      }

      return {
        checkedCount: activeSessions.length,
        disconnectedCount: disconnectedSessionIds.length,
        disconnectedSessionIds,
      };
    } finally {
      this.isSweeping = false;
    }
  }

  /**
   * Idempotent client reconnection handler
   */
  public handleReconnect(sessionId: string, currentTime?: number): { success: boolean; session?: ExamSessionRecord; error?: string } {
    const session = dbStore.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Sessiya topilmadi' };
    }

    const now = currentTime ?? Date.now();

    // If session was DISQUALIFIED or EXPIRED, reconnection is rejected
    if (session.status === 'DISQUALIFIED') {
      return { success: false, error: 'Sessiya diskvalifikatsiya qilingan, qayta ulanish taqiqlanadi' };
    }
    if (session.status === 'COMPLETED') {
      return { success: false, error: 'Imtihon allaqachon yakunlangan' };
    }
    if (now > session.expiresAt) {
      session.status = 'EXPIRED';
      dbStore.saveData();
      return { success: false, error: 'Imtihon vaqti tugagan' };
    }

    if (session.status === 'DISCONNECTED') {
      // Re-establish session to IN_PROGRESS
      session.status = 'IN_PROGRESS';
      session.lastHeartbeatAt = now;

      const reconnectEventId = `evt_hb_reconnect_${session.sessionId}_${Math.floor(now / 1000)}`;
      if (!session.processedEventIds) {
        session.processedEventIds = [];
      }
      if (!session.processedEventIds.includes(reconnectEventId)) {
        session.processedEventIds.push(reconnectEventId);
        dbStore.addProctorEvent({
          id: `prc_rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          eventId: reconnectEventId,
          sessionId: session.sessionId,
          userId: session.userId,
          examId: session.examId,
          eventType: 'HEARTBEAT_RECONNECTED',
          details: 'Foydalanuvchi muvaffaqiyatli qayta ulandi',
          severity: 'low',
          timestamp: new Date(now).toISOString(),
          ipAddress: session.clientIp || '127.0.0.1',
        });
      }

      dbStore.saveData();
      return { success: true, session };
    }

    if (session.status === 'IN_PROGRESS') {
      session.lastHeartbeatAt = now;
      dbStore.saveData();
      return { success: true, session };
    }

    return { success: false, error: `Sessiya holati (${session.status}) qayta ulanishga ruxsat bermaydi` };
  }
}

export const heartbeatWorker = new HeartbeatWorker();
