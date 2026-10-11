import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import { app } from '../server';
import { JWT_SECRET } from '../config/constants';
import { dbStore, getDefaultAntiCheatConfig } from '../db/store';
import { decodeSnapshot } from '../security/snapshotImage';
import { safeSnapshotPath } from '../services/snapshotRetention';
import { systemHealthService } from '../services/systemHealth.service';
import { NotificationProvider } from '../services/notificationProvider';
import { heartbeatWorker } from '../services/heartbeatWorker';

const origin = { Origin: 'http://localhost:5173', 'X-Forwarded-For': '198.51.100.21' };
const studentId = 'usr-student-01', adminId = 'usr-admin-01';
const cookie = (id: string) => 'token=' + jwt.sign({ id }, JWT_SECRET, { expiresIn: '1h' });
let count = 0;
async function check(name: string, fn: () => Promise<void>) {
  await fn(); count++; console.log('PASS hardening: ' + name);
}
async function main() {
  await check('Origin spoofing and X-Requested-With alone cannot bypass CSRF', async () => {
    for (const headers of [{ 'X-Requested-With': 'XMLHttpRequest' }, { Origin: 'http://localhost.evil.test' }]) {
      const response = await request(app).post('/api/auth/logout').set(headers);
      assert.ok([403, 500].includes(response.status));
      assert.notEqual(response.status, 200);
    }
  });
  await check('Malformed cookies are rejected without crashing', async () => {
    const response = await request(app).get('/api/auth/me').set('Cookie', 'token=%zz');
    assert.equal(response.status, 400);
  });
  await check('Neither student nor admin may mass-assign identity/password hash', async () => {
    const before = { ...dbStore.getUserById(studentId)! };
    for (const actor of [studentId, adminId]) {
      const result = await request(app).put('/api/users/' + studentId).set(origin)
        .set('Cookie', cookie(actor)).send({ id: 'forged', passwordHash: 'forged', authVersion: 999 });
      assert.equal(result.status, 200);
      const after = dbStore.getUserById(studentId)!;
      assert.equal(after.id, before.id); assert.equal(after.passwordHash, before.passwordHash);
      assert.equal(after.authVersion, before.authVersion);
    }
  });
  await check('Only a real completed submission can verify a certificate', async () => {
    const result = await request(app).get('/api/certificates/IS-2026-MED-NOT-A-REAL-CODE');
    assert.equal(result.status, 404);
    assert.equal((await request(app).get('/api/certificates')).status, 401);
  });
  await check('Unsupported security toggles and audio biometrics reject enable requests', async () => {
    const toggle = await request(app).post('/api/admin/toggle-setting').set(origin)
      .set('Cookie', cookie(adminId)).send({ key: 'ddosProtection', value: true });
    assert.equal(toggle.status, 400);
    const policy = await request(app).put('/api/admin/exams/IBN-MATH-102/anti-cheat').set(origin)
      .set('Cookie', cookie(adminId)).send(getDefaultAntiCheatConfig({ requireVoiceBiometrics: true }));
    assert.equal(policy.status, 400);
  });
  await check('Legacy GET mutation endpoint is gone', async () => {
    const response = await request(app).get('/logs.php?action=block_ip').set('Cookie', cookie(adminId));
    assert.equal(response.status, 404);
  });
  await check('Snapshot decoder rejects truncated/mismatched/oversized images and paths', async () => {
    await assert.rejects(decodeSnapshot('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYA=='));
    await assert.rejects(decodeSnapshot('data:image/jpeg;base64,' + Buffer.alloc(1048577).toString('base64')));
    const jpeg = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#fff' } }).jpeg().toBuffer();
    await assert.rejects(decodeSnapshot('data:image/webp;base64,' + jpeg.toString('base64')));
    const cleaned = await decodeSnapshot('data:image/jpeg;base64,' + jpeg.toString('base64'));
    assert.equal((await sharp(cleaned).metadata()).format, 'jpeg');
    assert.throws(() => safeSnapshotPath('../secret.env'));
  });
  await check('Registration is persisted and repeated registration is idempotent', async () => {
    const exam = dbStore.getExamById('IBN-MATH-102')!;
    dbStore.saveExam({ ...exam, status: 'active', isAlwaysOpen: true, targetGrades: [] });
    const register = () => request(app).post('/api/exams/IBN-MATH-102/registration')
      .set(origin).set('Cookie', cookie(studentId)).send({});
    assert.equal((await register()).status, 200); assert.equal((await register()).status, 200);
    assert.equal(dbStore.getExamById(exam.id)?.registeredUserIds?.filter(id => id === studentId).length, 1);
    const result = await request(app).get('/api/exams/IBN-MATH-102/registration').set('Cookie', cookie(studentId));
    assert.equal(result.body.registered, true);
    const publicExam = await request(app).get('/api/exams/IBN-MATH-102');
    assert.equal(publicExam.body.data.registeredUserIds, undefined);
  });
  await check('Proctor pairing code works exactly once and issues only secondary role', async () => {
    const exam = dbStore.getExamById('IBN-MATH-102')!;
    dbStore.saveExam({ ...exam, startTime: new Date(Date.now() - 1000).toISOString(),
      endTime: new Date(Date.now() + 3600_000).toISOString() });
    const created = await request(app).post('/api/proctor/session/create').set(origin)
      .set('Cookie', cookie(studentId)).send({ examId: exam.id });
    assert.equal(created.status, 201);
    const pair = () => request(app).post('/api/proctor/session/pair').set(origin)
      .send({ sessionId: created.body.sessionId, pairingCode: created.body.pairingCode });
    const paired = await pair();
    assert.equal(paired.status, 200);
    assert.equal((jwt.verify(paired.body.token, JWT_SECRET) as jwt.JwtPayload).deviceRole, 'secondary');
    assert.equal((await pair()).status, 403);
    const ordinary = await request(app).get('/api/proctor/check-gatekeeper/' + created.body.sessionId)
      .set('Authorization', 'Bearer ' + jwt.sign({ sessionId: created.body.sessionId, examId: exam.id, studentId }, JWT_SECRET));
    assert.equal(ordinary.status, 403);
  });
  let lifecycleExam = '', lifecycleSession = '', questionId = '';
  await check('Create/start/questions use server IDs and never expose the correct answer', async () => {
    const created = await request(app).post('/api/exams').set(origin).set('Cookie', cookie(adminId)).send({
      id: 'IBN-MATH-102', title: 'Lifecycle safety test', isAlwaysOpen: true, targetGrades: [],
      antiCheatConfig: getDefaultAntiCheatConfig({ enabled: false }),
      questions: [{ id: 'one', text: '2 + 2 = ?', options: ['3', '4'], correctAnswer: '4', points: 10 }],
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    lifecycleExam = created.body.data.id;
    assert.notEqual(lifecycleExam, 'IBN-MATH-102');
    assert.equal((await request(app).get('/api/exams/' + lifecycleExam + '/questions').set('Cookie', cookie(studentId))).status, 403);
    const started = await request(app).post('/api/exams/' + lifecycleExam + '/start')
      .set(origin).set('Cookie', cookie(studentId)).send({});
    assert.equal(started.status, 200, JSON.stringify(started.body));
    lifecycleSession = started.body.sessionId;
    const questions = await request(app).get('/api/exams/' + lifecycleExam + '/questions').set('Cookie', cookie(studentId));
    assert.equal(questions.status, 200);
    questionId = questions.body.questions[0].id;
    assert.equal(questions.body.questions[0].correct_answer, undefined);
    assert.equal(questions.body.questions[0].correctAnswer, undefined);
    assert.equal(dbStore.getRawQuestions(lifecycleExam)[0].correct_answer, 'B');
  });
  await check('Answer validation rejects foreign questions and unknown options without partial writes', async () => {
    const answer = (questionId: string, selectedOption: string) => request(app)
      .post('/api/exams/' + lifecycleExam + '/answer').set(origin).set('Cookie', cookie(studentId))
      .send({ sessionId: lifecycleSession, questionId, selectedOption });
    assert.equal((await answer('other-exam-question', 'A')).status, 400);
    assert.equal((await answer(questionId, 'NONEXISTENT')).status, 400);
    assert.equal((await answer(questionId, 'B')).status, 200);
    const mixed = await request(app).post('/api/exams/' + lifecycleExam + '/finish')
      .set(origin).set('Cookie', cookie(studentId)).send({ sessionId: lifecycleSession, answers: { [questionId]: 'A', foreign: 'B' } });
    assert.equal(mixed.status, 400);
    assert.equal(dbStore.getSession(lifecycleSession)?.answers[questionId], 'B');
    const change = await request(app).put('/api/exams/' + lifecycleExam).set(origin).set('Cookie', cookie(adminId)).send({ questions: [] });
    assert.equal(change.status, 409);
  });
  await check('Server expiry grades saved answers; late payload cannot change score; finish is idempotent', async () => {
    const session = dbStore.getSession(lifecycleSession)!;
    session.expiresAt = Date.now() - 1; dbStore.addSession(session);
    const late = await request(app).post('/api/exams/' + lifecycleExam + '/answer')
      .set(origin).set('Cookie', cookie(studentId)).send({ sessionId: lifecycleSession, questionId, selectedOption: 'A' });
    assert.equal(late.status, 400);
    await heartbeatWorker.sweepHeartbeats();
    const finish = () => request(app).post('/api/exams/' + lifecycleExam + '/finish')
      .set(origin).set('Cookie', cookie(studentId)).send({ sessionId: lifecycleSession, answers: { [questionId]: 'A' }, score: 99999 });
    const first = await finish(), second = await finish();
    assert.equal(first.status, 200, JSON.stringify(first.body));
    assert.equal(first.body.data.score, 10);
    assert.equal(first.body.data.id, second.body.data.id);
    assert.equal(dbStore.getSubmissions(studentId).filter(s => s.examId === lifecycleExam).length, 1);
  });
  await check('Missing delivery providers never report OTP sent', async () => {
    assert.equal((await NotificationProvider.sendOtp('nobody@example.test', '123456')).sent, false);
    assert.equal((await NotificationProvider.sendOtp('998900000000', '123456')).sent, false);
  });
  await check('Logout revokes the copied token as well as the browser cookie', async () => {
    // The following auth test runs after exam lifecycle checks.
    const token = cookie(studentId);
    assert.equal((await request(app).post('/api/auth/logout').set(origin).set('Cookie', token)).status, 200);
    assert.equal((await request(app).get('/api/auth/me').set('Cookie', token)).status, 401);
  });
  await check('Unconfigured SSL is unknown; host/process uptime are measured separately', async () => {
    delete process.env.TLS_CERT_PATH;
    const metrics = await systemHealthService.getSystemHealth();
    assert.equal(metrics.ssl.valid, null);
    assert.ok(metrics.os.uptimeSeconds >= 0);
    assert.ok(Math.abs(metrics.backend.uptimeSeconds - process.uptime()) < 5);
  });
  console.log(`Hardening HTTP/image tests: ${count} passed`);
}
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
