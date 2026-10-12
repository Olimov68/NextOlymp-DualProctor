import 'tsx/esm';
import '../server/src/config/constants.ts';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const action = process.argv[2];

if (action === 'admin') {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!email || !password || password.length < 8 || Buffer.byteLength(password) > 72 || /replace|example|change_me/i.test(password)) {
    throw new Error('INITIAL_ADMIN_EMAIL and a strong INITIAL_ADMIN_PASSWORD (8+ chars, max 72 bytes) required');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  if (process.env.DATABASE_URL) {
    // PostgreSQL mode
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(73001001)');

      const exists = await client.query("SELECT id FROM app_records WHERE kind='users' AND payload->>'role'='admin' LIMIT 1");
      if (exists.rowCount > 0) {
        const existingId = exists.rows[0].id;
        await client.query(
          "UPDATE app_records SET payload = jsonb_set(jsonb_set(payload, '{email}', to_jsonb($1::text)), '{passwordHash}', to_jsonb($2::text)) WHERE kind='users' AND id=$3",
          [email, passwordHash, existingId]
        );
        console.log(`Administrator [${email}] credentials successfully updated in PostgreSQL.`);
      } else {
        const id = 'usr_' + randomUUID();
        const payload = {
          id, email, phone: '', fullName: 'Administrator', passwordHash,
          role: 'admin', authVersion: 0, grade: 0, region: '', district: '', school: '', score: 0,
          status: 'active', createdAt: new Date().toISOString()
        };
        await client.query("INSERT INTO app_records(kind,id,payload) VALUES('users',$1,$2)", [id, payload]);
        console.log(`Administrator [${email}] successfully created in PostgreSQL.`);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
      await pool.end();
    }
  } else {
    // File store mode (server/data/store.json)
    const storePath = path.resolve(process.cwd(), 'server/data/store.json');
    let data = { users: [] };
    if (existsSync(storePath)) {
      try {
        data = JSON.parse(readFileSync(storePath, 'utf8'));
      } catch {}
    }
    if (!Array.isArray(data.users)) data.users = [];

    const adminIdx = data.users.findIndex(u => u.role === 'admin' || u.email?.toLowerCase() === email || u.username === 'user1447');
    if (adminIdx >= 0) {
      data.users[adminIdx].email = email;
      data.users[adminIdx].username = 'user1447';
      data.users[adminIdx].passwordHash = passwordHash;
      data.users[adminIdx].role = 'admin';
      console.log(`Administrator [${email}] credentials updated in store.json.`);
    } else {
      data.users.unshift({
        id: 'usr_' + randomUUID(),
        email,
        username: 'user1447',
        phone: '',
        fullName: 'Administrator',
        passwordHash,
        role: 'admin',
        grade: 11,
        region: 'Toshkent',
        district: '',
        school: 'NextOlymp',
        score: 100,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      console.log(`Administrator [${email}] created in store.json.`);
    }
    await writeFile(storePath, JSON.stringify(data, null, 2), 'utf8');
  }
} else if (action === 'migrate') {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL required in .env for PostgreSQL migration');
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(73001001)');
    await client.query(await readFile(new URL('../server/migrations/002_runtime_records.sql', import.meta.url), 'utf8'));
    console.log('Runtime PostgreSQL schema migrated. Existing tables preserved.');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
} else {
  throw new Error('Use: migrate or admin');
}
