import 'tsx/esm';
import '../server/src/config/constants.ts';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
const pool = new Pool({ connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined });
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(73001001)');
  if (process.argv[2] === 'migrate') {
    await client.query(await readFile(new URL('../server/migrations/002_runtime_records.sql', import.meta.url), 'utf8'));
    console.log('Runtime PostgreSQL schema migrated. Existing tables preserved.');
  } else if (process.argv[2] === 'admin') {
    const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    if (!email || !password || password.length < 14 || Buffer.byteLength(password) > 72 || /replace|example|change_me/i.test(password))
      throw new Error('INITIAL_ADMIN_EMAIL and a strong INITIAL_ADMIN_PASSWORD (14+ chars, max 72 bytes) required');
    const exists = await client.query("SELECT 1 FROM app_records WHERE kind='users' AND payload->>'role'='admin' LIMIT 1");
    if (exists.rowCount) throw new Error('Admin already exists; refusing to overwrite credentials');
    const id = 'usr_' + randomUUID();
    const payload = { id, email, phone: '', fullName: 'Administrator', passwordHash: await bcrypt.hash(password, 12),
      role: 'admin', authVersion: 0, grade: 0, region: '', district: '', school: '', score: 0,
      status: 'active', createdAt: new Date().toISOString() };
    await client.query("INSERT INTO app_records(kind,id,payload) VALUES('users',$1,$2)", [id, payload]);
    console.log('Initial administrator created. Remove bootstrap password from environment.');
  } else throw new Error('Use migrate or admin');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error.message);
  process.exitCode = 1;
} finally { client.release(); await pool.end(); }
