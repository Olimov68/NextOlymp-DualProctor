// Isolated local smoke server. Never reads production .env or production JSON data.
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
const directory = await mkdtemp(path.join(os.tmpdir(), 'ibnsino-smoke-'));
Object.assign(process.env, { NODE_ENV: 'test', DATABASE_URL: '', DATA_DIR: directory,
  SNAPSHOT_DIR: path.join(directory, 'snapshots'), JWT_SECRET: randomBytes(48).toString('hex'),
  SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '', SMS_API_KEY: '', ESKIZ_TOKEN: '',
  GEMINI_API_KEY: '', DEEPSEEK_API_KEY: '', INITIAL_ADMIN_PASSWORD: randomBytes(32).toString('hex') });
if (process.argv.includes('--assessment')) {
  // Ephemeral loopback-only fixture. Never used by normal startup or deployment.
  process.env.INITIAL_ADMIN_PASSWORD = 'Local-assessment-preview-2026!';
  process.env.INITIAL_STUDENT_PASSWORD = 'Local-assessment-preview-2026!';
}
const { server, io } = await import('../server/src/server.ts');
if (process.argv.includes('--assessment')) {
  const { dbStore, getDefaultAntiCheatConfig } = await import('../server/src/db/store.ts');
  for (const kind of ['level_test', 'national_certificate']) {
    const id = 'preview-' + kind;
    dbStore.saveExam({ id, kind, title: kind === 'level_test' ? 'Sinov: matematika mashqi' : 'Sinov: milliy sertifikat', subject: 'Matematika',
      category: 'preview', format: 'online', description: 'Faqat vaqtinchalik UI tekshiruvi', image: '',
      startTime: new Date(Date.now() - 7200000).toISOString(), endTime: new Date(Date.now() - 3600000).toISOString(),
      durationMinutes: 10, price: 0, status: 'yopiq', maxScore: 2, totalQuestions: 2,
      registeredCount: 0, organizer: 'Preview', createdAt: new Date().toISOString(), sourceYear: 2025,
      practiceEnabled: true, antiCheatConfig: getDefaultAntiCheatConfig({ enabled: false }) });
    dbStore.saveQuestions(id, [
      { id: id + '-q1', examId: id, question_text: '2 + 2 = ?', options: [{ id: 'A', text: '4' }, { id: 'B', text: '5' }], correct_answer: 'A', points: 1, orderNum: 1, explanation: 'Ikki va ikki — to‘rt.' },
      { id: id + '-q2', examId: id, question_text: '3 × 3 = ?', options: [], correct_answer: '9', points: 1, orderNum: 2, explanation: 'Uch karra uch — to‘qqiz.' },
    ]);
  }
}
server.listen(5037, '127.0.0.1', () => console.log('Isolated smoke API at http://127.0.0.1:5037'));
async function stop() {
  io.close();
  server.close(async () => { await rm(directory, { recursive: true, force: true }); process.exit(0); });
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
