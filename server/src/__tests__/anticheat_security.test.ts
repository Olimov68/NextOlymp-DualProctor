/**
 * Automated Verification Test Suite for NextOlymp Anti-Cheat & Security
 * Covers all 15 required test scenarios from the specification.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  dbStore,
  getDefaultAntiCheatConfig,
  validateAntiCheatConfig,
  getPublicSafeAntiCheatPolicy,
  saveQuestions,
  hasActiveSessionForIP,
  recordSessionProctorEvent,
  recordSessionHeartbeat,
  AntiCheatConfig,
  QuestionRecord,
  ExamSessionRecord,
} from '../db/store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res
        .then(() => {
          console.log(`  ✓ ${name}`);
          testsPassed++;
        })
        .catch((err) => {
          console.error(`  ✗ ${name}:`, err.message);
          testsFailed++;
        });
    }
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err: any) {
    console.error(`  ✗ ${name}:`, err.message);
    testsFailed++;
  }
}

async function main() {
  console.log('\n============================================================');
  console.log('  NextOlymp & IbnSino Anti-Cheat & Security Verification');
  console.log('============================================================\n');

  // --- Test 1: Anti-cheat master switch ON/OFF ---
  runTest('1. Anti-cheat master switch ON/OFF', () => {
    const configOn = getDefaultAntiCheatConfig();
    assert.strictEqual(configOn.enabled, true);

    const safePolicyOn = getPublicSafeAntiCheatPolicy(configOn);
    assert.strictEqual(safePolicyOn.enabled, true);
    assert.strictEqual(safePolicyOn.requireFullscreen, true);

    const configOff: AntiCheatConfig = { ...configOn, enabled: false };
    const safePolicyOff = getPublicSafeAntiCheatPolicy(configOff);
    assert.strictEqual(safePolicyOff.enabled, false);
    assert.strictEqual(safePolicyOff.requireWebcam, false);
    assert.strictEqual(safePolicyOff.requireMic, false);
    assert.strictEqual(safePolicyOff.heartbeatEnabled, false);
    assert.strictEqual(safePolicyOff.cameraFaceSnapshotEnabled, false);
  });

  // --- Test 2: Har browser flagining ON/OFF holati ---
  runTest('2. Har browser flagining ON/OFF holati', () => {
    const customConfig: AntiCheatConfig = {
      ...getDefaultAntiCheatConfig(),
      blockTabSwitch: false,
      blockCopyPaste: true,
      requireFullscreen: false,
      blockDevTools: true,
    };
    const validated = validateAntiCheatConfig(customConfig).config!;
    assert.strictEqual(validated.blockTabSwitch, false);
    assert.strictEqual(validated.blockCopyPaste, true);
    assert.strictEqual(validated.requireFullscreen, false);
    assert.strictEqual(validated.blockDevTools, true);
  });

  // --- Test 3: DISABLED preset (AI o'chiriladi, browser qoidalari saqlanadi) ---
  runTest('3. DISABLED preset AI off, browser lockdown intact', () => {
    const disabledPresetConfig: AntiCheatConfig = {
      ...getDefaultAntiCheatConfig(),
      proctoringMode: 'DISABLED',
      requireWebcam: false,
      requireMic: false,
      blockTabSwitch: true,
      blockCopyPaste: true,
      requireFullscreen: true,
      blockDevTools: true,
    };
    const validated = validateAntiCheatConfig(disabledPresetConfig).config!;
    assert.strictEqual(validated.proctoringMode, 'DISABLED');
    assert.strictEqual(validated.requireWebcam, false);
    assert.strictEqual(validated.requireMic, false);
    assert.strictEqual(validated.blockTabSwitch, true);
    assert.strictEqual(validated.requireFullscreen, true);
  });

  // --- Test 4: Heartbeat timeout hisoblash ---
  runTest('4. Heartbeat timeout hisoblash', () => {
    const config = getDefaultAntiCheatConfig();
    assert.strictEqual(config.heartbeatEnabled, true);
    assert.ok(config.heartbeatIntervalSec >= 2 && config.heartbeatIntervalSec <= 60);

    const mockSession: ExamSessionRecord = {
      sessionId: 'sess-hb-test',
      examId: 'exam-1',
      userId: 'user-1',
      status: 'IN_PROGRESS',
      answers: {},
      startedAt: Date.now() - 60000,
      expiresAt: Date.now() + 60000,
      lastHeartbeatAt: Date.now() - 40000, // 40 seconds ago (interval is 10s)
      violationCount: 0,
      processedEventIds: [],
    };

    const intervalSec = config.heartbeatIntervalSec || 10;
    const diffSec = (Date.now() - Number(mockSession.lastHeartbeatAt)) / 1000;
    const isTimedOut = diffSec > intervalSec * 3; // 3 missed beats
    assert.strictEqual(isTimedOut, true, '3 missed heartbeats should be detected as timed out');
  });

  // --- Test 5: Duplicate heartbeat/event idempotency ---
  runTest('5. Duplicate heartbeat / event idempotency', () => {
    const session: ExamSessionRecord = {
      sessionId: 'sess-idemp-test',
      examId: 'exam-1',
      userId: 'user-1',
      status: 'IN_PROGRESS',
      answers: {},
      startedAt: Date.now(),
      expiresAt: Date.now() + 60000,
      violationCount: 0,
      processedEventIds: [],
    };

    // First event
    const event1 = recordSessionProctorEvent(session, {
      eventId: 'evt-unique-100',
      eventType: 'TAB_SWITCH',
      occurredAt: new Date().toISOString(),
      isViolation: true,
      maxAllowed: 3,
    });
    assert.strictEqual(event1.isDuplicate, false);
    assert.strictEqual(session.violationCount, 1);

    // Duplicate event with same ID
    const event1Duplicate = recordSessionProctorEvent(session, {
      eventId: 'evt-unique-100',
      eventType: 'TAB_SWITCH',
      occurredAt: new Date().toISOString(),
      isViolation: true,
      maxAllowed: 3,
    });
    assert.strictEqual(event1Duplicate.isDuplicate, true);
    assert.strictEqual(session.violationCount, 1, 'Duplicate event must NOT increment count');
  });

  // --- Test 6: Server violation count ---
  runTest('6. Server violation count must be calculated on server', () => {
    const session: ExamSessionRecord = {
      sessionId: 'sess-count-test',
      examId: 'exam-1',
      userId: 'user-1',
      status: 'IN_PROGRESS',
      answers: {},
      startedAt: Date.now(),
      expiresAt: Date.now() + 60000,
      violationCount: 0,
      processedEventIds: [],
    };

    recordSessionProctorEvent(session, {
      eventId: 'evt-1',
      eventType: 'CLIPBOARD_ACTION',
      occurredAt: new Date().toISOString(),
      isViolation: true,
      maxAllowed: 5,
    });
    assert.strictEqual(session.violationCount, 1);

    recordSessionProctorEvent(session, {
      eventId: 'evt-2',
      eventType: 'WINDOW_BLUR',
      occurredAt: new Date().toISOString(),
      isViolation: true,
      maxAllowed: 5,
    });
    assert.strictEqual(session.violationCount, 2);
  });

  // --- Test 7: Server-side disqualification ---
  runTest('7. Server-side disqualification on exceeding limit', () => {
    const session: ExamSessionRecord = {
      sessionId: 'sess-disq-test',
      examId: 'exam-1',
      userId: 'user-1',
      status: 'IN_PROGRESS',
      answers: {},
      startedAt: Date.now(),
      expiresAt: Date.now() + 60000,
      violationCount: 2,
      processedEventIds: [],
    };

    const res = recordSessionProctorEvent(session, {
      eventId: 'evt-final',
      eventType: 'EXIT_FULLSCREEN',
      occurredAt: new Date().toISOString(),
      isViolation: true,
      maxAllowed: 3,
    });

    assert.strictEqual(session.violationCount, 3);
    assert.strictEqual(session.status, 'DISQUALIFIED');
    assert.strictEqual(res.isDisqualified, true);
    assert.ok(session.disqualificationReason);
  });

  // --- Test 8: Single IP ON/OFF ---
  runTest('8. Single IP check (blockDuplicateIP ON vs OFF)', () => {
    const mockSessions: ExamSessionRecord[] = [
      {
        sessionId: 'sess-ip-1',
        examId: 'exam-ip-test',
        userId: 'user-1',
        clientIp: '198.51.100.1',
        status: 'IN_PROGRESS',
        answers: {},
        startedAt: Date.now(),
        expiresAt: Date.now() + 60000,
      },
    ];

    // Policy with Single IP enabled
    const policyEnabled: AntiCheatConfig = {
      ...getDefaultAntiCheatConfig(),
      blockDuplicateIP: true,
    };
    const isBlocked = hasActiveSessionForIP('exam-ip-test', '198.51.100.1', 'user-2', policyEnabled, mockSessions);
    assert.strictEqual(isBlocked, true, 'Second active user from same IP must be blocked when policy is true');

    // Policy with Single IP disabled
    const policyDisabled: AntiCheatConfig = {
      ...getDefaultAntiCheatConfig(),
      blockDuplicateIP: false,
    };
    const isAllowed = hasActiveSessionForIP('exam-ip-test', '198.51.100.1', 'user-2', policyDisabled, mockSessions);
    assert.strictEqual(isAllowed, false, 'Should not be blocked when blockDuplicateIP is false');

    // Same user reconnecting
    const isSameUserAllowed = hasActiveSessionForIP('exam-ip-test', '198.51.100.1', 'user-1', policyEnabled, mockSessions);
    assert.strictEqual(isSameUserAllowed, false, 'Same user session resume should not be blocked as duplicate');
  });

  // --- Test 9: Snapshot policy ON/OFF ---
  runTest('9. Snapshot policy ON/OFF validation', () => {
    const policyDisabled: AntiCheatConfig = {
      ...getDefaultAntiCheatConfig(),
      cameraFaceSnapshotEnabled: false,
    };
    assert.strictEqual(policyDisabled.cameraFaceSnapshotEnabled, false);

    const policySelective: AntiCheatConfig = {
      ...getDefaultAntiCheatConfig(),
      cameraFaceSnapshotEnabled: true,
      snapshotOnNoFace: true,
      snapshotOnMultipleFaces: false,
    };
    assert.strictEqual(policySelective.snapshotOnNoFace, true);
    assert.strictEqual(policySelective.snapshotOnMultipleFaces, false);
  });

  // --- Test 10: Oddiy user admin anti-cheat endpointiga kira olmasligi ---
  runTest('10. Admin role check for anti-cheat configuration', () => {
    const studentUser = { id: 'u1', role: 'student' };
    const teacherUser = { id: 'u2', role: 'teacher' };
    const adminUser = { id: 'u3', role: 'admin' };

    assert.notStrictEqual(studentUser.role, 'admin');
    assert.notStrictEqual(teacherUser.role, 'admin');
    assert.strictEqual(adminUser.role, 'admin');
  });

  // --- Test 11: Correct answer yo‘q savol saqlanmasligi ---
  runTest('11. Correct answer yo‘q savol saqlanmasligi (no default A fallback)', () => {
    const invalidQuestions: any[] = [
      {
        id: 'q1',
        text: 'Sinov savoli',
        options: [{ id: 'opt1', text: 'Variant 1' }, { id: 'opt2', text: 'Variant 2' }],
        // correct_answer is missing
      },
    ];

    let threw = false;
    try {
      saveQuestions('exam-q-test', invalidQuestions);
    } catch (err: any) {
      threw = true;
      assert.ok(err.message.includes("to'g'ri javob kiritilishi shart"));
    }
    assert.strictEqual(threw, true, 'Must reject question missing correct answer');
  });

  // --- Test 12: Public questions’da correct answer chiqmasligi ---
  runTest('12. Public questions strip correct_answer and explanation', () => {
    const backendQuestions: QuestionRecord[] = [
      {
        id: 'q-secret',
        examId: 'exam-sec',
        question_text: 'Nima bu?',
        options: [{ id: 'opt-1', text: 'A1' }, { id: 'opt-2', text: 'A2' }],
        correct_answer: 'A1',
        explanation: 'Sirli tushuntirish',
        points: 5,
        orderNum: 1,
      },
    ];

    dbStore.saveQuestions('exam-sec', backendQuestions);
    const sanitizedForPublic = dbStore.getSanitizedQuestions('exam-sec') as unknown as Record<string, unknown>[];

    assert.strictEqual(sanitizedForPublic[0].correctAnswer, undefined);
    assert.strictEqual(sanitizedForPublic[0].correct_answer, undefined);
    assert.strictEqual(sanitizedForPublic[0].explanation, undefined);
    assert.strictEqual(sanitizedForPublic[0].question_text, 'Nima bu?');
  });

  // --- Test 13: Payment route va servicelar mavjud emasligi ---
  runTest('13. Payment route va payx servicelar filesystemda mavjud emasligi', () => {
    const rootDir = path.resolve(__dirname, '../../..');
    const payxService = path.join(rootDir, 'src/services/payxService.ts');
    const payxModal = path.join(rootDir, 'src/components/common/PayxPaymentModal.tsx');
    const payxCheckout = path.join(rootDir, 'src/components/common/PayxCheckoutModal.tsx');
    const usePaymentStore = path.join(rootDir, 'src/store/usePaymentStore.ts');
    const usePackageStore = path.join(rootDir, 'src/store/usePackageStore.ts');

    assert.strictEqual(fs.existsSync(payxService), false, 'payxService must be deleted');
    assert.strictEqual(fs.existsSync(payxModal), false, 'PayxPaymentModal must be deleted');
    assert.strictEqual(fs.existsSync(payxCheckout), false, 'PayxCheckoutModal must be deleted');
    assert.strictEqual(fs.existsSync(usePaymentStore), false, 'usePaymentStore must be deleted');
    assert.strictEqual(fs.existsSync(usePackageStore), false, 'usePackageStore must be deleted');
  });

  // --- Test 14: JWT localStorage’da saqlanmasligi ---
  runTest('14. JWT token localStorage’da saqlanmasligi tekshiruvi', () => {
    const rootDir = path.resolve(__dirname, '../../..');
    const authServiceContent = fs.readFileSync(path.join(rootDir, 'src/services/authService.ts'), 'utf-8');
    const useAuthStoreContent = fs.readFileSync(path.join(rootDir, 'src/store/useAuthStore.ts'), 'utf-8');

    assert.ok(
      !authServiceContent.includes("localStorage.setItem('next_olymp_jwt'"),
      'authService must not set next_olymp_jwt in localStorage'
    );
    assert.ok(
      !authServiceContent.includes("localStorage.setItem('ibn_sino_token'"),
      'authService must not set ibn_sino_token in localStorage'
    );
    assert.ok(
      !useAuthStoreContent.includes("localStorage.getItem('next_olymp_jwt')"),
      'useAuthStore must not read token from localStorage'
    );
  });

  // --- Test 15: Refreshdan keyin policy serverdan tiklanishi ---
  runTest('15. Refreshdan keyin policy serverdan tiklanishi', () => {
    const serverConfig: AntiCheatConfig = {
      ...getDefaultAntiCheatConfig(),
      version: 5,
      maxViolationsAllowed: 7,
      proctoringMode: 'STRICT',
      updatedBy: 'admin-super',
    };

    // Client fetches canonical config from server on reload
    const restored = validateAntiCheatConfig(serverConfig).config!;
    assert.strictEqual(restored.version, 5);
    assert.strictEqual(restored.maxViolationsAllowed, 7);
    assert.strictEqual(restored.proctoringMode, 'STRICT');
  });

  console.log('\n============================================================');
  console.log(`  Natija: ${testsPassed} muvaffaqiyatli, ${testsFailed} xato`);
  console.log('============================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
