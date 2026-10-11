import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server';
import { JWT_SECRET } from '../config/constants';
import { dbStore, getDefaultAntiCheatConfig } from '../db/store';
import { estimateRasch, type RaschConfig } from '../services/assessment';
import { heartbeatWorker } from '../services/heartbeatWorker';
import { normalizeQuestions } from '../security/examValidation';

const headers = { Origin: 'http://localhost:5173', 'X-Forwarded-For': '198.51.100.44' };
const cookie = (id = 'usr-student-01') => 'token=' + jwt.sign({ id }, JWT_SECRET, { expiresIn: '1h' });
const admin = 'usr-admin-01';
const post = (url: string, body: object = {}, user?: string) => request(app).post('/api' + url).set(headers).set('Cookie', cookie(user)).send(body);
const put = (id: string, body: object, user = admin) => request(app).put('/api/exams/' + id).set(headers).set('Cookie', cookie(user)).send(body);
const get = (url: string, user?: string) => request(app).get('/api' + url).set('Cookie', cookie(user));
let count = 0;
async function check(name: string, fn: () => void | Promise<void>) { await fn(); count++; console.log('PASS assessment: ' + name); }
async function create(kind: string, extra: object = {}) {
  const result = await post('/exams', { kind, title: 'Assessment test', subject: 'Matematika', status: 'yopiq',
    practiceEnabled: true, sourceYear: 2025, startTime: new Date(Date.now() - 7200_000).toISOString(),
    endTime: new Date(Date.now() - 3600_000).toISOString(), durationMinutes: 10,
    antiCheatConfig: getDefaultAntiCheatConfig({ enabled: false }), questions: [
      { id: '1', content: '1+1?', options: ['2', '3'], correctAnswer: 'A', points: 1, explanation: 'Addition' },
      { id: '2', content: '2+2?', options: [], correctAnswer: '4', points: 1 },
    ], ...extra }, admin);
  assert.equal(result.status, 201, JSON.stringify(result.body)); return result.body.data.id as string;
}
async function main() {
  let level = '', national = '', sessionId = '', firstResult = '';
  await check('All three kinds use authenticated admin CRUD and persist classification', async () => {
    level = await create('level_test'); national = await create('national_certificate'); await create('olympiad');
    const list = await get('/exams?kind=level_test');
    assert.equal(list.body.data.length, 1); assert.equal(list.body.data[0].sourceYear, 2025);
    assert.equal((await post('/exams', { title: 'Forbidden' })).status, 403);
    assert.equal((await put(level, { practiceEnabled: false }, 'usr-student-01')).status, 403);
    assert.equal((await put(level, { kind: 'unknown' })).status, 400);
    assert.equal((await put(level, { practiceEnabled: 'true' })).status, 400);
  });
  await check('Live competition never exposes practice answers, even with practice flag enabled', async () => {
    const live = await create('olympiad', { endTime: new Date(Date.now() + 3600_000).toISOString(), status: 'active' });
    assert.equal((await post(`/exams/${live}/start`, { mode: 'practice' })).status, 409);
    assert.equal((await get(`/exams/${live}/questions`)).status, 403);
    assert.equal((await post(`/exams/${level}/start`, { mode: 'forged' })).status, 400);
    assert.equal((await post(`/exams/${level}/start`)).status, 400);
  });
  await check('Practice resumes the same server session and answers after a refresh', async () => {
    const start = await post(`/exams/${level}/start`, { mode: 'practice' });
    assert.equal(start.status, 200); sessionId = start.body.sessionId;
    const questions = await get(`/exams/${level}/questions?sessionId=${sessionId}`);
    assert.equal(questions.status, 200); assert.ok(questions.body.questions.every((q: object) => !('correct_answer' in q) && !('explanation' in q)));
    const answer = await post(`/exams/${level}/answer`, { sessionId, questionId: questions.body.questions[0].id, selectedOption: 'A' });
    assert.equal(answer.status, 200);
    const resumed = await post(`/exams/${level}/start`, { mode: 'practice' });
    assert.equal(resumed.body.sessionId, sessionId); assert.equal(Object.values(resumed.body.answers)[0], 'A');
    assert.equal((await get(`/exams/${level}/questions?sessionId=forged`)).status, 403);
  });
  await check('Practice has no proctor penalties and heartbeat disconnects; server deadline remains authoritative', async () => {
    assert.equal((await put(level, { antiCheatConfig: getDefaultAntiCheatConfig({ enabled: true, blockTabSwitch: true, heartbeatEnabled: true }) })).status, 200);
    const event = await post(`/exams/${level}/proctor-events`, { sessionId, eventId: 'practice-tab', eventType: 'TAB_SWITCH' });
    assert.equal(event.body.violationCount, 0); assert.equal(event.body.ruleEnabled, false);
    await heartbeatWorker.sweepHeartbeats(Date.now() + 60_000);
    assert.equal(dbStore.getSession(sessionId)?.status, 'IN_PROGRESS');
  });
  await check('Repeat finish is idempotent; a new practice attempt produces a distinct result', async () => {
    const end = await post(`/exams/${level}/finish`, { sessionId, score: 9999 });
    assert.equal(end.status, 200); firstResult = end.body.data.id;
    assert.equal(end.body.data.score, 1); assert.equal(end.body.data.verificationCode, '');
    assert.equal((await post(`/exams/${level}/finish`, { sessionId })).body.data.id, firstResult);
    const next = await post(`/exams/${level}/start`, { mode: 'practice' });
    assert.notEqual(next.body.sessionId, sessionId);
    const second = await post(`/exams/${level}/finish`, { sessionId: next.body.sessionId });
    assert.equal(second.status, 200); assert.notEqual(second.body.data.id, firstResult); assert.equal(second.body.data.score, 0);
    assert.equal((await post(`/exams/${level}/finish`, { sessionId })).body.data.id, firstResult);
    assert.equal((await get(`/leaderboard?exam_id=${level}`)).body.data.length, 0);
    const certs = await get('/certificates'); assert.ok(!JSON.stringify(certs.body).includes(firstResult));
  });
  await check('History locks question, grading and schedule mutations; disabling practice blocks new starts', async () => {
    assert.equal((await put(level, { questions: [] })).status, 409);
    assert.equal((await put(level, { kind: 'olympiad' })).status, 409);
    assert.equal((await put(level, { endTime: new Date(Date.now() + 86400_000).toISOString() })).status, 409);
    assert.equal((await put(level, { practiceEnabled: false })).status, 200);
    assert.equal((await post(`/exams/${level}/start`, { mode: 'practice' })).status, 409);
  });
  await check('Another student cannot read results/questions or mutate a practice session', async () => {
    dbStore.createUser({ ...dbStore.getUserById('usr-student-01')!, id: 'assessment-other', email: 'assessment-other@example.test', phone: '' });
    assert.equal((await get('/submissions/' + firstResult, 'assessment-other')).status, 403);
    assert.equal((await get(`/exams/${level}/questions?sessionId=${sessionId}`, 'assessment-other')).status, 403);
    assert.equal((await post(`/exams/${level}/answer`, { sessionId, questionId: 'forged', selectedOption: 'A' }, 'assessment-other')).status, 403);
    assert.equal((await post(`/exams/${level}/finish`, { sessionId }, 'assessment-other')).status, 403);
  });
  await check('Practice expiry rejects late answers but worker still persists the saved result', async () => {
    const id = await create('level_test');
    const start = await post(`/exams/${id}/start`, { mode: 'practice' });
    const session = dbStore.getSession(start.body.sessionId)!;
    session.expiresAt = Date.now() - 1; dbStore.addSession(session);
    assert.equal((await post(`/exams/${id}/answer`, { sessionId: session.sessionId, questionId: 'forged', selectedOption: 'A' })).status, 400);
    await heartbeatWorker.sweepHeartbeats();
    const saved = dbStore.getSubmissionBySession(session.sessionId)!;
    assert.equal(saved.mode, 'practice'); assert.equal(saved.score, 0); assert.equal(saved.verificationCode, '');
    assert.equal((await post(`/exams/${id}/finish`, { sessionId: session.sessionId })).body.data.id, saved.id);
  });
  await check('No guessed Rasch score or official certificate without calibration', async () => {
    const start = await post(`/exams/${national}/start`, { mode: 'practice' });
    const end = await post(`/exams/${national}/finish`, { sessionId: start.body.sessionId });
    assert.equal(end.status, 200); assert.equal(end.body.data.rasch.status, 'pending_calibration');
    assert.equal(end.body.data.raschTheta, null); assert.equal(end.body.data.verificationCode, '');
  });
  await check('Calibrated national result uses 1PL EAP on server; parameters stay admin-only', async () => {
    const id = await create('national_certificate');
    const qs = (await get(`/exams/${id}/questions`, admin)).body.questions as Array<{ id: string }>;
    const config: RaschConfig = { version: 'fixture-v1', source: 'Synthetic fixture, not official', model: '1PL', estimator: 'EAP',
      priorMean: 0, priorSd: 1, itemDifficulties: Object.fromEntries(qs.map(q => [q.id, 0])) };
    assert.equal((await put(id, { raschConfig: config })).status, 200);
    assert.equal((await get(`/exams/${id}`)).body.data.raschConfig, undefined);
    assert.equal((await get(`/admin/exams/${id}`)).status, 403);
    assert.equal((await get(`/admin/exams/${id}`, admin)).body.data.raschConfig.version, 'fixture-v1');
    assert.equal((await put(id, { raschConfig: { ...config, itemDifficulties: {} } })).status, 400);
    const start = await post(`/exams/${id}/start`, { mode: 'practice' });
    await post(`/exams/${id}/answer`, { sessionId: start.body.sessionId, questionId: qs[0].id, selectedOption: 'A' });
    const end = await post(`/exams/${id}/finish`, { sessionId: start.body.sessionId });
    assert.equal(end.body.data.rasch.status, 'estimated'); assert.ok(Math.abs(end.body.data.rasch.theta) < 1e-8);
    assert.equal(end.body.data.rasch.officialEquivalent, false);
  });
  await check('EAP is symmetric, finite at extremes, depends on calibration and validates invalid inputs', () => {
    const config: RaschConfig = { version: 'test', source: 'Unit fixture', model: '1PL', estimator: 'EAP', priorMean: 0, priorSd: 1, itemDifficulties: { q1: 0, q2: 0 } };
    const responses = [true, false].map((isCorrect, i) => ({ questionId: `q${i + 1}`, isCorrect }));
    assert.ok(Math.abs(estimateRasch(responses, config).theta!) < 1e-8);
    const high = estimateRasch(responses.map(r => ({ ...r, isCorrect: true })), config);
    const low = estimateRasch(responses.map(r => ({ ...r, isCorrect: false })), config);
    assert.ok(high.theta! > 0 && high.posteriorSd! > 0); assert.ok(Math.abs(high.theta! + low.theta!) < 1e-8);
    const harder = estimateRasch(responses, { ...config, itemDifficulties: { q1: 2, q2: 2 } });
    assert.ok(harder.theta! > 0);
    assert.equal(estimateRasch(responses, { ...config, priorSd: 0 }).status, 'pending_calibration');
  });
  await check('Question explanation and safe images round-trip; unsupported executable media rejects', () => {
    const q = { content: 'Diagram', options: ['yes', 'no'], correctAnswer: 'A', points: 1, explanation: 'A reason',
      imageUrl: 'https://example.test/diagram.png', optionImages: ['https://example.test/choice.webp', ''] };
    const normalized = normalizeQuestions('media-test', [q])[0];
    assert.equal(normalized.explanation, 'A reason'); assert.equal(normalized.imageUrl, q.imageUrl);
    assert.equal(normalized.options[0].imageUrl, q.optionImages[0]);
    for (const imageUrl of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'http://example.test/image.png']) {
      assert.throws(() => normalizeQuestions('media-test', [{ ...q, imageUrl }]));
    }
    assert.throws(() => normalizeQuestions('media-test', [{ ...q, correctAnswer: '' }]));
  });
  console.log(`Assessment: ${count} checks passed`);
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => process.exit(process.exitCode || 0));
