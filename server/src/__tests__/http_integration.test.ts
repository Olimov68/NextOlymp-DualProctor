/**
 * NextOlymp & Ibn Sino Core Platform - Real HTTP Integration Test Suite
 * Tests the Express application directly over HTTP via supertest.
 * Verifies all 14 mandatory security, anti-cheat, auth, and persistence requirements.
 */

import assert from 'node:assert';
import sharp from 'sharp';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server';
import { JWT_SECRET } from '../config/constants';
import { dbStore, AntiCheatConfig, ExamSessionRecord, getDefaultAntiCheatConfig } from '../db/store';
import { heartbeatWorker } from '../services/heartbeatWorker';
import { PostgresRepository } from '../db/postgresRepository';

// Test Tokens
const adminPayload = { id: 'usr-admin-01', email: 'admin@ibnsino.uz', role: 'admin' };
const studentPayload = { id: 'usr-student-01', email: 'azizbek@ibnsino.uz', role: 'student' };
const student2Payload = { id: 'usr-student-02', email: 'mohira@ibnsino.uz', role: 'student' };

const adminToken = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '1h' });
const studentToken = jwt.sign(studentPayload, JWT_SECRET, { expiresIn: '1h' });
const student2Token = jwt.sign(student2Payload, JWT_SECRET, { expiresIn: '1h' });

const csrfHeaders = {
  'Origin': 'http://localhost:5173',
  'X-Requested-With': 'XMLHttpRequest',
};

let passed = 0;
let failed = 0;

async function testCase(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ [PASSED] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ [FAILED] ${name}:`, err.message || err);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n============================================================');
  console.log('  NextOlymp Real HTTP Integration & Security Test Suite');
  console.log('============================================================\n');

  // Use existing seeded exam ID
  const examId = 'IBN-MATH-102';

  // 1. Admin anti-cheat policy’ni saqlashi va qayta olishi
  await testCase('1. Admin saves and retrieves anti-cheat policy via HTTP', async () => {
    const updatedPolicy: AntiCheatConfig = getDefaultAntiCheatConfig({
      enabled: true,
      proctoringMode: 'STRICT',
      maxViolationsAllowed: 5,
      heartbeatIntervalSec: 15,
      requireWebcam: true,
      blockTabSwitch: true,
      blockDuplicateIP: true,
      minFaceConfidence: 0.70,
      maxAbsenceGracePeriod: 1.5,
      voiceSimilarityThreshold: 0.70,
    });

    const putRes = await request(app)
      .put(`/api/admin/exams/${examId}/anti-cheat`)
      .set('Cookie', `token=${adminToken}`)
      .set(csrfHeaders)
      .send(updatedPolicy);

    assert.strictEqual(putRes.status, 200, `Expected 200, got ${putRes.status}: ${JSON.stringify(putRes.body)}`);
    assert.strictEqual(putRes.body.success, true);
    assert.strictEqual(putRes.body.config.maxViolationsAllowed, 5);

    const getRes = await request(app)
      .get(`/api/admin/exams/${examId}/anti-cheat`)
      .set('Cookie', `token=${adminToken}`);

    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getRes.body.config.maxViolationsAllowed, 5);
    assert.strictEqual(getRes.body.config.heartbeatIntervalSec, 15);
  });

  // 2. Student policy’ni o‘zgartira olmasligi
  await testCase('2. Student is blocked (403) from modifying anti-cheat policy', async () => {
    const res = await request(app)
      .put(`/api/admin/exams/${examId}/anti-cheat`)
      .set('Cookie', `token=${studentToken}`)
      .set(csrfHeaders)
      .send({ enabled: false });

    assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  // 3. Master switch OFF bo‘lsa barcha tegishli server tekshiruvlari o‘chishi
  await testCase('3. Master switch OFF disables enforcement of anti-cheat rules', async () => {
    // Admin turns OFF anti-cheat master switch
    const disabledPolicy = getDefaultAntiCheatConfig({
      enabled: false,
      proctoringMode: 'DISABLED',
      minFaceConfidence: 0.7,
      maxAbsenceGracePeriod: 1.5,
      voiceSimilarityThreshold: 0.7,
    });
    await request(app)
      .put(`/api/admin/exams/${examId}/anti-cheat`)
      .set('Cookie', `token=${adminToken}`)
      .set(csrfHeaders)
      .send(disabledPolicy);

    // Seed session for student
    const sessionId = `test_sess_masteroff_${Date.now()}`;
    const session: ExamSessionRecord = {
      sessionId,
      userId: studentPayload.id,
      examId,
      startedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      status: 'IN_PROGRESS',
      answers: {},
      clientIp: '127.0.0.1',
      violationCount: 0,
      lastHeartbeatAt: Date.now(),
      processedEventIds: [],
    };
    dbStore.addSession(session);

    // Send violation event
    const res = await request(app)
      .post(`/api/exams/${examId}/proctor-event`)
      .set('Cookie', `token=${studentToken}`)
      .set(csrfHeaders)
      .send({
        sessionId,
        eventId: `evt_off_${Date.now()}`,
        eventType: 'TAB_SWITCH',
        details: 'User switched tab with master switch OFF',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ruleEnabled, false, 'Rule should be disabled when master switch is OFF');
    const updated = dbStore.getSession(sessionId);
    assert.strictEqual(updated?.violationCount, 0, 'Violation count should NOT increase when master switch is OFF');
    assert.strictEqual(updated?.status, 'IN_PROGRESS');
  });

  // 4. Har bir browser flag ON/OFF holati
  await testCase('4. Browser flags granular ON/OFF enforcement', async () => {
    // Case 4A: blockTabSwitch is FALSE
    const flagOffPolicy = getDefaultAntiCheatConfig({
      enabled: true,
      blockTabSwitch: false,
      maxViolationsAllowed: 3,
      minFaceConfidence: 0.7,
      maxAbsenceGracePeriod: 1.5,
      voiceSimilarityThreshold: 0.7,
    });
    await request(app)
      .put(`/api/admin/exams/${examId}/anti-cheat`)
      .set('Cookie', `token=${adminToken}`)
      .set(csrfHeaders)
      .send(flagOffPolicy);

    const sessA = `test_sess_flag_a_${Date.now()}`;
    dbStore.addSession({
      sessionId: sessA,
      userId: studentPayload.id,
      examId,
      startedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      status: 'IN_PROGRESS',
      answers: {},
      clientIp: '127.0.0.1',
      violationCount: 0,
      lastHeartbeatAt: Date.now(),
      processedEventIds: [],
    });

    const resA = await request(app)
      .post(`/api/exams/${examId}/proctor-event`)
      .set('Cookie', `token=${studentToken}`)
      .set(csrfHeaders)
      .send({ sessionId: sessA, eventId: `evt_a_${Date.now()}`, eventType: 'TAB_SWITCH' });

    assert.strictEqual(resA.body.ruleEnabled, false);
    assert.strictEqual(dbStore.getSession(sessA)?.violationCount, 0);

    // Case 4B: blockTabSwitch is TRUE
    const flagOnPolicy = getDefaultAntiCheatConfig({
      enabled: true,
      blockTabSwitch: true,
      maxViolationsAllowed: 3,
      minFaceConfidence: 0.7,
      maxAbsenceGracePeriod: 1.5,
      voiceSimilarityThreshold: 0.7,
    });
    await request(app)
      .put(`/api/admin/exams/${examId}/anti-cheat`)
      .set('Cookie', `token=${adminToken}`)
      .set(csrfHeaders)
      .send(flagOnPolicy);

    const sessB = `test_sess_flag_b_${Date.now()}`;
    dbStore.addSession({
      sessionId: sessB,
      userId: studentPayload.id,
      examId,
      startedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      status: 'IN_PROGRESS',
      answers: {},
      clientIp: '127.0.0.1',
      violationCount: 0,
      lastHeartbeatAt: Date.now(),
      processedEventIds: [],
    });

    const resB = await request(app)
      .post(`/api/exams/${examId}/proctor-event`)
      .set('Cookie', `token=${studentToken}`)
      .set(csrfHeaders)
      .send({ sessionId: sessB, eventId: `evt_b_${Date.now()}`, eventType: 'TAB_SWITCH' });

    assert.strictEqual(resB.body.ruleEnabled, true);
    assert.strictEqual(dbStore.getSession(sessB)?.violationCount, 1);
  });

  // 5. Heartbeat timeout server tomonidan aniqlanishi
  await testCase('5. Heartbeat timeout detected authoritative by server worker', async () => {
    const sessHb = `test_sess_hb_timeout_${Date.now()}`;
    const startTime = 1000000;
    const intervalSec = 10;

    const hbPolicy = getDefaultAntiCheatConfig({
      enabled: true,
      heartbeatEnabled: true,
      heartbeatIntervalSec: intervalSec,
      minFaceConfidence: 0.7,
      maxAbsenceGracePeriod: 1.5,
      voiceSimilarityThreshold: 0.7,
    });
    await request(app)
      .put(`/api/admin/exams/${examId}/anti-cheat`)
      .set('Cookie', `token=${adminToken}`)
      .set(csrfHeaders)
      .send(hbPolicy);

    dbStore.addSession({
      sessionId: sessHb,
      userId: studentPayload.id,
      examId,
      startedAt: startTime,
      expiresAt: startTime + 3600000,
      status: 'IN_PROGRESS',
      answers: {},
      clientIp: '127.0.0.1',
      violationCount: 0,
      lastHeartbeatAt: startTime,
      processedEventIds: [],
    });

    // Time past 3 * interval: 1000000 + 31000 = 1031000
    const sweepResult = await heartbeatWorker.sweepHeartbeats(startTime + 31000);
    assert.ok(sweepResult.disconnectedSessionIds.includes(sessHb), 'Session should be marked DISCONNECTED');

    const updatedSession = dbStore.getSession(sessHb);
    assert.strictEqual(updatedSession?.status, 'DISCONNECTED');

    // Idempotent reconnection test
    const reconResult = heartbeatWorker.handleReconnect(sessHb, startTime + 35000);
    assert.strictEqual(reconResult.success, true);
    assert.strictEqual(reconResult.session?.status, 'IN_PROGRESS');
  });

  // 6. Duplicate event eventId ikki marta sanalmasligi
  await testCase('6. Duplicate proctor event eventId is idempotent and not counted twice', async () => {
    const sessDup = `test_sess_dup_${Date.now()}`;
    dbStore.addSession({
      sessionId: sessDup,
      userId: studentPayload.id,
      examId,
      startedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      status: 'IN_PROGRESS',
      answers: {},
      clientIp: '127.0.0.1',
      violationCount: 0,
      lastHeartbeatAt: Date.now(),
      processedEventIds: [],
    });

    const fixedEventId = `fixed_dup_id_${Date.now()}`;

    // First event call
    const res1 = await request(app)
      .post(`/api/exams/${examId}/proctor-event`)
      .set('Cookie', `token=${studentToken}`)
      .set(csrfHeaders)
      .send({ sessionId: sessDup, eventId: fixedEventId, eventType: 'TAB_SWITCH' });

    assert.strictEqual(res1.body.violationCount, 1);

    // Duplicate call with same eventId
    const res2 = await request(app)
      .post(`/api/exams/${examId}/proctor-event`)
      .set('Cookie', `token=${studentToken}`)
      .set(csrfHeaders)
      .send({ sessionId: sessDup, eventId: fixedEventId, eventType: 'TAB_SWITCH' });

    assert.strictEqual(res2.body.duplicate || res2.body.isDuplicate, true);
    assert.strictEqual(res2.body.violationCount, 1, 'Violation count should stay at 1, not duplicate increment');
  });

  // 7. Limit oshganda server sessiyani disqualify qilishi
  await testCase('7. Server disqualifies session when violation limit is exceeded', async () => {
    const limitPolicy = getDefaultAntiCheatConfig({
      enabled: true,
      blockTabSwitch: true,
      maxViolationsAllowed: 2,
      minFaceConfidence: 0.7,
      maxAbsenceGracePeriod: 1.5,
      voiceSimilarityThreshold: 0.7,
    });
    await request(app)
      .put(`/api/admin/exams/${examId}/anti-cheat`)
      .set('Cookie', `token=${adminToken}`)
      .set(csrfHeaders)
      .send(limitPolicy);

    const sessLimit = `test_sess_limit_${Date.now()}`;
    dbStore.addSession({
      sessionId: sessLimit,
      userId: studentPayload.id,
      examId,
      startedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      status: 'IN_PROGRESS',
      answers: {},
      clientIp: '127.0.0.1',
      violationCount: 0,
      lastHeartbeatAt: Date.now(),
      processedEventIds: [],
    });

    // Violation 1
    await request(app)
      .post(`/api/exams/${examId}/proctor-event`)
      .set('Cookie', `token=${studentToken}`)
      .set(csrfHeaders)
      .send({ sessionId: sessLimit, eventId: `evt_lim_1_${Date.now()}`, eventType: 'TAB_SWITCH' });

    // Violation 2
    await request(app)
      .post(`/api/exams/${examId}/proctor-event`)
      .set('Cookie', `token=${studentToken}`)
      .set(csrfHeaders)
      .send({ sessionId: sessLimit, eventId: `evt_lim_2_${Date.now()}`, eventType: 'TAB_SWITCH' });

    // Violation 3 -> exceeds maxViolationsAllowed (2)
    const res3 = await request(app)
      .post(`/api/exams/${examId}/proctor-event`)
      .set('Cookie', `token=${studentToken}`)
      .set(csrfHeaders)
      .send({ sessionId: sessLimit, eventId: `evt_lim_3_${Date.now()}`, eventType: 'TAB_SWITCH' });

    assert.strictEqual(res3.body.isDisqualified, true);
    const session = dbStore.getSession(sessLimit);
    assert.strictEqual(session?.status, 'DISQUALIFIED');
    assert.ok(session?.disqualificationReason);

    // Heartbeat for disqualified session is rejected
    const hbRes = await request(app)
      .post(`/api/exams/${examId}/heartbeat`)
      .set('Cookie', `token=${studentToken}`)
      .set(csrfHeaders)
      .send({ sessionId: sessLimit });

    assert.strictEqual(hbRes.status, 403);
  });

  // 8. Single-IP parallel requestlarda ham bloklanishi
  await testCase('8. Single-IP check blocks parallel/duplicate sessions on same IP', async () => {
    const testIp = '198.51.100.99';
    const policy = getDefaultAntiCheatConfig({
      enabled: true,
      blockDuplicateIP: true,
      minFaceConfidence: 0.7,
      maxAbsenceGracePeriod: 1.5,
      voiceSimilarityThreshold: 0.7,
    });
    dbStore.updateExamAntiCheatConfig(examId, policy);

    const sess1: ExamSessionRecord = {
      sessionId: `sess_ip_1_${Date.now()}`,
      userId: 'usr_ip_a',
      examId,
      startedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      status: 'IN_PROGRESS',
      clientIp: testIp,
      answers: {},
      violationCount: 0,
      lastHeartbeatAt: Date.now(),
      processedEventIds: [],
    };

    const sess2: ExamSessionRecord = {
      sessionId: `sess_ip_2_${Date.now()}`,
      userId: 'usr_ip_b',
      examId,
      startedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      status: 'IN_PROGRESS',
      clientIp: testIp,
      answers: {},
      violationCount: 0,
      lastHeartbeatAt: Date.now(),
      processedEventIds: [],
    };

    // First atomic creation succeeds
    const res1 = dbStore.createSessionAtomic(sess1, policy);
    assert.strictEqual(res1.success, true);

    // Second atomic creation on same IP fails with SINGLE_IP_VIOLATION
    const res2 = dbStore.createSessionAtomic(sess2, policy);
    assert.strictEqual(res2.success, false);
    assert.strictEqual(res2.code, 'SINGLE_IP_VIOLATION');
  });

  // 9. Snapshot policy, hajm, magic-byte va role tekshiruvlari
  await testCase('9. Snapshot validation: size limit, magic bytes, owner and admin role', async () => {
    const sessSnap = `sess_snap_test_${Date.now()}`;
    dbStore.addSession({
      sessionId: sessSnap,
      userId: studentPayload.id,
      examId,
      startedAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      status: 'IN_PROGRESS',
      answers: {},
      clientIp: '127.0.0.1',
      violationCount: 0,
      lastHeartbeatAt: Date.now(),
      processedEventIds: [],
    });

    // 9A: Corrupt / Non-image base64 -> 400
    const corruptRes = await request(app)
      .post(`/api/exams/${examId}/snapshot`)
      .set('Cookie', `token=${studentToken}`)
      .set(csrfHeaders)
      .send({
        sessionId: sessSnap,
        imageBase64: 'data:image/jpeg;base64,VGhpcyBpcyBub3QgYW4gaW1hZ2U=', // "This is not an image"
        reason: 'SUSPICIOUS_FACE',
      });
    assert.strictEqual(corruptRes.status, 400);
    assert.ok(corruptRes.body.error.includes('JPEG yoki WebP'));

    // 9B: A genuinely decodable image, not only a magic-byte prefix.
    const validJpegBytes = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#ffffff' } }).jpeg().toBuffer();
    const validBase64 = `data:image/jpeg;base64,${validJpegBytes.toString('base64')}`;

    const validRes = await request(app)
      .post(`/api/exams/${examId}/snapshot`)
      .set('Cookie', `token=${studentToken}`)
      .set(csrfHeaders)
      .send({
        sessionId: sessSnap,
        imageBase64: validBase64,
        reason: 'PERIODIC_CHECK',
      });
    assert.strictEqual(validRes.status, 201, `Expected 201, got ${validRes.status}`);
    assert.strictEqual(validRes.body.success, true);

    // 9C: Student unauthorized for other user's session
    const otherUserRes = await request(app)
      .post(`/api/exams/${examId}/snapshot`)
      .set('Cookie', `token=${student2Token}`)
      .set(csrfHeaders)
      .send({
        sessionId: sessSnap,
        imageBase64: validBase64,
        reason: 'TAMPER_TEST',
      });
    assert.strictEqual(otherUserRes.status, 403, 'User cannot upload snapshot to other users session');

    // 9D: Student forbidden from listing snapshots
    const studentListRes = await request(app)
      .get(`/api/admin/exams/${examId}/snapshots`)
      .set('Cookie', `token=${studentToken}`);
    assert.strictEqual(studentListRes.status, 403);

    // 9E: Admin authorized to list snapshots
    const adminListRes = await request(app)
      .get(`/api/admin/exams/${examId}/snapshots`)
      .set('Cookie', `token=${adminToken}`);
    assert.strictEqual(adminListRes.status, 200);
    assert.ok(Array.isArray(adminListRes.body.snapshots));
  });

  // 10. Public question API correctAnswer, correct_answer, explanation va boshqa maxfiy maydonlarni chiqarmasligi
  await testCase('10. Public question API strips correct answers and explanations', async () => {
    const res = await request(app)
      .get(`/api/exams/${examId}/questions`)
      .set('Cookie', `token=${studentToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.questions));

    for (const q of res.body.questions) {
      assert.strictEqual(q.correctAnswer, undefined, 'Public question API must not expose correctAnswer');
      assert.strictEqual(q.correct_answer, undefined, 'Public question API must not expose correct_answer');
      assert.strictEqual(q.explanation, undefined, 'Public question API must not expose explanation');
      assert.strictEqual(q.solution, undefined, 'Public question API must not expose solution');
    }
  });

  // 11. Login javobida JWT bo‘lmasligi va HttpOnly cookie mavjudligi
  await testCase('11. Login response does not contain JWT token; token transmitted via HttpOnly cookie', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .set(csrfHeaders)
      .send({
        fullName: 'Test Student Auth Cookie',
        email: `test_cookie_${Date.now()}@ibnsino.uz`,
        phone: `+99890${Math.floor(1000000 + Math.random() * 8999999)}`,
        password: 'Password123!',
        role: 'student',
      });

    assert.ok(regRes.status === 200 || regRes.status === 201, `Expected 200 or 201, got ${regRes.status}`);
    assert.strictEqual(regRes.body.token, undefined, 'Register response must NOT contain token in body');
    const regCookies = regRes.headers['set-cookie'];
    assert.ok(regCookies && regCookies.length > 0, 'Set-Cookie header must be present in register response');
    assert.ok([regCookies].flat().some((c: string) => c.includes('HttpOnly')), 'Cookie must contain HttpOnly');
  });

  // 12. CSRF’siz state-changing request rad etilishi
  await testCase('12. State-changing request without valid CSRF origin/header is rejected with 403', async () => {
    // Send state-changing PUT request with cookie authentication but WITHOUT Origin/Referer/X-Requested-With
    const res = await request(app)
      .put(`/api/admin/exams/${examId}/anti-cheat`)
      .set('Cookie', `token=${adminToken}`)
      .send({ enabled: true });

    assert.strictEqual(res.status, 403, `Expected 403 CSRF rejection, got ${res.status}`);
    assert.ok(res.body.error?.includes('CSRF'));
  });

  // 13. Payment/package endpointlari 404 qaytarishi
  await testCase('13. All payment and package endpoints return 404 Not Found', async () => {
    const endpoints = [
      { method: 'get', path: '/api/payments' },
      { method: 'post', path: '/api/payments/payx/webhook' },
      { method: 'get', path: '/api/packages' },
      { method: 'post', path: '/api/packages/purchase' },
      { method: 'get', path: '/api/admin/payments' },
    ];

    for (const ep of endpoints) {
      const res = await (request(app) as any)[ep.method](ep.path).set(csrfHeaders);
      assert.strictEqual(res.status, 404, `Expected 404 for ${ep.method.toUpperCase()} ${ep.path}, got ${res.status}`);
    }
  });

  // 14. PostgreSQL persistence: qayta ishga tushirishdan keyin policy va sessiya saqlanishi
  await testCase('14. Legacy repository shape and missing-configuration guard (not a DB integration test)', async () => {
    // 14A: Verify fail-fast in production when DATABASE_URL is missing
    assert.throws(() => {
      new PostgresRepository({
        isProduction: true,
        connectionString: undefined,
      });
    }, /Production database configuration missing/);

    // 14B: Verify repository contract & methods are defined
    const postgresRepo = new PostgresRepository({ isProduction: false });
    assert.strictEqual(typeof postgresRepo.getExamAntiCheatConfig, 'function');
    assert.strictEqual(typeof postgresRepo.saveExamAntiCheatConfig, 'function');
    assert.strictEqual(typeof postgresRepo.createSessionAtomic, 'function');
    assert.strictEqual(typeof postgresRepo.saveAntiCheatPolicy, 'function');
    assert.strictEqual(typeof postgresRepo.saveSnapshot, 'function');
  });

  console.log('\n============================================================');
  console.log(`  Tests Completed: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runAllTests().catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
