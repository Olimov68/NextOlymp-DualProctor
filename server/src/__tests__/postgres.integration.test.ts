import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import type { Pool } from 'pg';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server';
import { JWT_SECRET } from '../config/constants';
import { databaseTransaction, setTestDatabase } from '../db/transactionStore';
import { dbStore, getDefaultAntiCheatConfig, type UserRecord, type ExamRecord } from '../db/store';

// Real PostgreSQL engine (WASM), executing the same schema and repository SQL.
// Serialized connections reproduce the pool's per-transaction ownership.
const directory = path.join(process.env.DATA_DIR!, 'postgres');
let pg = new PGlite(directory);
let queue = Promise.resolve();
const pool = {
  async connect() {
    const previous = queue;
    let release!: () => void;
    queue = new Promise<void>(resolve => { release = resolve; });
    await previous;
    return { query: (sql: string, params?: unknown[]) => pg.query(sql, params), release };
  },
} as unknown as Pool;

async function main() {
  await pg.exec(await fs.readFile('server/migrations/002_runtime_records.sql', 'utf8'));
  setTestDatabase(pool);
  const now = Date.now();
  const user = (id: string): UserRecord => ({ id, fullName: id, email: `${id}@example.test`, phone: '',
    passwordHash: 'not-used-in-this-test', role: 'student', status: 'active', grade: 9,
    region: '', district: '', school: '', score: 0, createdAt: new Date(now).toISOString() });
  const exam: ExamRecord = { id: 'exam-pg', title: 'PostgreSQL integration', subject: 'Math', category: 'test',
    format: 'online', description: '', image: '', startTime: new Date(now - 60_000).toISOString(),
    endTime: new Date(now + 3600_000).toISOString(), durationMinutes: 30, price: 0, status: 'active',
    maxScore: 10, totalQuestions: 0, registeredCount: 0, organizer: 'Test', createdAt: new Date(now).toISOString(),
    antiCheatConfig: getDefaultAntiCheatConfig({ blockDuplicateIP: true }) };
  await databaseTransaction(async () => {
    dbStore.createUser(user('pg-one'));
    dbStore.createUser(user('pg-two'));
    dbStore.saveExam(exam);
    dbStore.saveQuestions(exam.id, [{ id: 'pg-q', examId: exam.id, question_text: '1+1?', options: [{ id: 'A', text: '2' }, { id: 'B', text: '3' }], correct_answer: 'A', points: 1, orderNum: 1, explanation: 'Addition' }]);
  });
  const token = (id: string) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '1h' });
  const headers = { Origin: 'http://localhost:5173', 'X-Forwarded-For': '198.51.100.80' };
  const responses = await Promise.all(['pg-one', 'pg-two'].map(id => request(app)
    .post('/api/exams/exam-pg/start').set(headers).set('Cookie', `token=${token(id)}`).send({})));
  assert.equal(responses.filter(r => r.status >= 200 && r.status < 300).length, 1, JSON.stringify(responses.map(r => r.body)));
  assert.equal(responses.filter(r => r.status === 403 || r.status === 409).length, 1);
  console.log('PASS PostgreSQL: parallel Single-IP HTTP requests commit exactly one session');

  await assert.rejects(databaseTransaction(async () => {
    dbStore.saveExam({ ...exam, title: 'MUST ROLL BACK' });
    throw new Error('force rollback');
  }));
  await databaseTransaction(async () => assert.equal(dbStore.getExamById('exam-pg')?.title, exam.title));
  console.log('PASS PostgreSQL: rollback leaves persisted data unchanged');

  await assert.rejects(databaseTransaction(async () => {
    dbStore.saveQuestions('missing-exam', [{ id: 'bad-fk', examId: 'missing-exam', question_text: 'q',
      options: [{ id: 'A', text: 'a' }], correct_answer: 'A', points: 1, orderNum: 1, explanation: '' }]);
  }));
  console.log('PASS PostgreSQL: foreign key rejects orphan questions');

  await databaseTransaction(async () => {
    dbStore.saveExam({ ...exam, id: 'practice-pg', kind: 'level_test', practiceEnabled: true, status: 'yopiq' });
    dbStore.saveQuestions('practice-pg', [{ id: 'practice-q', examId: 'practice-pg', question_text: '2+2?', options: [], correct_answer: '4', points: 1, orderNum: 1, explanation: '' }]);
  });
  const practiceIds: string[] = [];
  for (let i = 0; i < 2; i++) {
    const start = await request(app).post('/api/exams/practice-pg/start').set(headers).set('Cookie', `token=${token('pg-one')}`).send({ mode: 'practice' });
    assert.equal(start.status, 200, JSON.stringify(start.body));
    const sessionId = start.body.sessionId;
    const answer = await request(app).post('/api/exams/practice-pg/answer').set(headers).set('Cookie', `token=${token('pg-one')}`).send({ sessionId, questionId: 'practice-q', selectedOption: '4' });
    assert.equal(answer.status, 200);
    const end = await request(app).post('/api/exams/practice-pg/finish').set(headers).set('Cookie', `token=${token('pg-one')}`).send({ sessionId });
    assert.equal(end.status, 200, JSON.stringify(end.body));
    assert.equal(end.body.data.score, 1); practiceIds.push(end.body.data.id);
  }
  assert.notEqual(practiceIds[0], practiceIds[1]);
  console.log('PASS PostgreSQL: repeated practice attempts commit separately without certificate codes');

  await pg.close();
  pg = new PGlite(directory);
  await databaseTransaction(async () => {
    assert.equal(dbStore.getExamById('exam-pg')?.antiCheatConfig?.blockDuplicateIP, true);
    assert.equal(dbStore.getSessions().length, 3);
    const practice = dbStore.getSubmissions('pg-one').filter(s => s.mode === 'practice');
    assert.equal(practice.length, 2);
    assert.ok(practice.every(s => !s.verificationCode && s.score === 1));
  });
  console.log('PASS PostgreSQL: policy and session survive database restart');
  setTestDatabase(null);
  await pg.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => process.exit(process.exitCode || 0));
