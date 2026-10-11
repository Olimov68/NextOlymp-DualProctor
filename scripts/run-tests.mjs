import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

// Tests must never read or mutate a developer/production database or send OTPs.
const directory = mkdtempSync(join(tmpdir(), 'ibnsino-tests-'));
const env = { ...process.env, NODE_ENV: 'test', DATABASE_URL: '',
  JWT_SECRET: randomBytes(48).toString('hex'), ALLOW_DEV_OTP: 'false',
  SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '', SMS_API_KEY: '', ESKIZ_TOKEN: '',
  GEMINI_API_KEY: '', DEEPSEEK_API_KEY: '', GEMINI_VISION_MODEL: '',
  INITIAL_ADMIN_PASSWORD: randomBytes(24).toString('hex'),
  INITIAL_STUDENT_PASSWORD: randomBytes(24).toString('hex') };
try {
  for (const file of process.argv.slice(2)) {
    const testDirectory = mkdtempSync(join(directory, 'suite-'));
    const result = spawnSync(process.execPath, ['--import', 'tsx', resolve(file)], {
      env: { ...env, DATA_DIR: testDirectory, SNAPSHOT_DIR: join(testDirectory, 'snapshots') },
      stdio: 'inherit', timeout: 120_000,
    });
    if (result.error) console.error(result.error.message);
    if (result.status !== 0) { process.exitCode = result.status || 1; break; }
  }
} finally {
  // The only deletion target is the fresh test directory allocated above.
  rmSync(directory, { recursive: true, force: true });
}
