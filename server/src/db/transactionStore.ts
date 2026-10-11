import { AsyncLocalStorage } from 'node:async_hooks';
import { Pool, type PoolClient } from 'pg';
import type { DatabaseSchema } from './store';

export const emptyDatabase = (): DatabaseSchema => ({ users: [], exams: [], questions: [], sessions: [],
  submissions: [], proctorEvents: [], securityBlockedIps: [], proctorSessions: [], snapshots: [],
  supportTickets: [], notificationLogs: [] });

interface Work { data: DatabaseSchema; dirty: boolean; afterCommit: Array<() => Promise<void>>; }
export const transactionContext = new AsyncLocalStorage<Work>();
const configured = Boolean(process.env.DATABASE_URL);
export let databasePool = configured ? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
}) : null;
databasePool?.on('error', () => console.error('[database] Idle database connection failed'));

export function setTestDatabase(pool: Pool | null): void {
  if (process.env.NODE_ENV !== 'test') throw new Error('Test database injection is forbidden');
  databasePool = pool;
}

const collections = ['users', 'exams', 'questions', 'sessions', 'submissions', 'proctorEvents',
  'securityBlockedIps', 'proctorSessions', 'snapshots', 'supportTickets', 'notificationLogs'] as const;
type Collection = typeof collections[number];
type Document = { kind: string; id: string; payload: Record<string, unknown> };

function records(data: DatabaseSchema): Document[] {
  const result: Document[] = [];
  for (const kind of collections) {
    for (const item of data[kind] ?? []) {
      const payload = item as unknown as Record<string, unknown>;
      const id = payload.id ?? payload.sessionId ?? payload.ip;
      if (typeof id !== 'string' || !id) throw new Error(`Missing ${kind} record identifier`);
      result.push({ kind, id, payload });
    }
  }
  if (data.securitySettings) result.push({ kind: 'settings', id: 'security', payload: { ...data.securitySettings } });
  if (data.passwordResets) for (const [id, payload] of Object.entries(data.passwordResets)) {
    result.push({ kind: 'passwordResets', id, payload: { ...payload } });
  }
  return result;
}

async function load(client: PoolClient): Promise<DatabaseSchema> {
  const result = await client.query<Document>('SELECT kind, id, payload FROM app_records ORDER BY ordinal');
  const data = emptyDatabase();
  for (const row of result.rows) {
    if ((collections as readonly string[]).includes(row.kind)) {
      (data[row.kind as Collection] as unknown[]).push(row.payload);
    } else if (row.kind === 'settings' && row.id === 'security') {
      data.securitySettings = row.payload as unknown as DatabaseSchema['securitySettings'];
    } else if (row.kind === 'passwordResets') {
      (data.passwordResets ??= {})[row.id] = row.payload as unknown as NonNullable<DatabaseSchema['passwordResets']>[string];
    }
  }
  return data;
}

async function save(client: PoolClient, before: Map<string, string>, data: DatabaseSchema) {
  const rows = records(data);
  const remaining = new Set(rows.map(r => `${r.kind}\0${r.id}`));
  for (const key of before.keys()) {
    if (!remaining.has(key)) {
      const [kind, id] = key.split('\0');
      await client.query('DELETE FROM app_records WHERE kind=$1 AND id=$2', [kind, id]);
    }
  }
  for (let ordinal = 0; ordinal < rows.length; ordinal++) {
    const row = rows[ordinal];
    const payload = JSON.stringify(row.payload);
    if (before.get(`${row.kind}\0${row.id}`) === payload) continue;
    await client.query(`INSERT INTO app_records(kind,id,payload,ordinal) VALUES($1,$2,$3::jsonb,$4)
      ON CONFLICT(kind,id) DO UPDATE SET payload=EXCLUDED.payload,ordinal=EXCLUDED.ordinal`,
    [row.kind, row.id, payload, ordinal]);
  }
}

// A global advisory lock preserves existing synchronous domain methods while making each
// request atomic across processes. Deliberately serialized: load-test before raising traffic.
export async function databaseTransaction<T>(fn: () => Promise<T>): Promise<T> {
  if (transactionContext.getStore() || !databasePool) return fn();
  const client = await databasePool.connect();
  const work: Work = { data: emptyDatabase(), dirty: false, afterCommit: [] };
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '15s'");
    await client.query('SELECT pg_advisory_xact_lock(73001001)');
    work.data = await load(client);
    const before = new Map(records(work.data).map(row => [`${row.kind}\0${row.id}`, JSON.stringify(row.payload)]));
    const result = await transactionContext.run(work, fn);
    if (work.dirty) await save(client, before, work.data);
    await client.query('COMMIT');
    for (const action of work.afterCommit) {
      try { await action(); } catch { console.error('[database] Post-commit cleanup requires retry'); }
    }
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally { client.release(); }
}

export async function checkDatabase(): Promise<void> {
  if (!databasePool) {
    if (process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL is required in production');
    return;
  }
  await databasePool.query('SELECT kind FROM app_records LIMIT 0');
}
