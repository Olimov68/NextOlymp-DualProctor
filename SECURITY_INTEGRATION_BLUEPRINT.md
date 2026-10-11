# IbnSinoSchool xavfsizlik integratsiyasi — kodli topshiriq

> Bu fayl loyiha ustida ishlaydigan keyingi AI/dasturchi uchun yagona topshiriq va kod manbasi.
> Avval `agents.md` to'liq o'qilsin. Quyidagi kodlar mavjud arxitekturaga moslashtirilsin; mavjud
> foydalanuvchi o'zgarishlari o'chirilmasin va bir xil metod/fayl ikkinchi marta yaratilmasin.

## Yakuniy maqsad

Quyidagi holatlarning barchasi real ishlashi kerak:

- frontend va server alohida TypeScript tekshiruvidan o'tadi;
- production ma'lumotlari PostgreSQL'da saqlanadi;
- cookie autentifikatsiyasi JWT'ni JavaScript va JSON javobidan yashiradi;
- state-changing so'rovlar CSRF/Origin himoyasiga ega;
- SMTP/SMS provayder hech narsa yubormasdan `sent: true` qaytarmaydi;
- heartbeat to'xtasa server sessiyani `DISCONNECTED` qiladi;
- Single-IP parallel so'rovlarda ham atomik ishlaydi;
- snapshot haqiqiy JPEG/WebP, 1 MiB dan oshmagan va retention siyosatiga ega;
- anti-cheat sozlamalari serverdan olinadi va serverda saqlanadi;
- payment/package kodi runtime'dan butunlay olib tashlanadi;
- testlar haqiqiy HTTP endpointlarni tekshiradi;
- `npm audit` natijasida `high=0`, `critical=0` bo'ladi yoki qolgan advisory aniq hujjatlashtiriladi.

## Qat'iy bajarish qoidalari

1. Bu fayldagi kodni ko'r-ko'rona yangi parallel tizim sifatida qo'shmang. Avval mavjud controller,
   store, route, DTO va middleware'larni o'qing, so'ng ular ichiga integratsiya qiling.
2. `server/src/db/store.ts` ichidagi takroriy `saveSnapshot` va `hasActiveSessionForIP`
   implementatsiyalarini birlashtiring. Bitta vazifa uchun bitta canonical metod qolsin.
3. `npm install --legacy-peer-deps`, `npm audit fix --force`, `any`, `@ts-ignore`, testni skip qilish
   yoki lint qoidasini o'chirish orqali muammoni yashirmang.
4. Production funksiyasida mock, random, hardcoded success yoki `catch(console.warn)` bo'lmasin.
5. Har bir bosqichdan keyin tegishli testni o'tkazing; hammasini birdan qayta yozmang.

---

## 1. Server TypeScript tekshiruvi

### Yangi fayl: `server/tsconfig.json`

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "allowImportingTsExtensions": false,
    "noEmit": true,
    "isolatedModules": false,
    "types": ["node"],
    "baseUrl": "..",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

NodeNext importlarida kerak bo'lsa lokal importlar `.js` suffixiga o'tkazilsin. Agar mavjud server
arxitekturasi bundler resolution talab qilsa, alohida asoslangan qaror bilan sozlansin, lekin server
baribir to'liq type-check qilinishi shart.

### `package.json` scriptlari

Mavjud scriptlarni quyidagi mazmunga moslang:

```json
{
  "scripts": {
    "typecheck:frontend": "tsc -p tsconfig.json --noEmit",
    "typecheck:server": "tsc -p server/tsconfig.json --noEmit",
    "typecheck": "npm run typecheck:frontend && npm run typecheck:server",
    "build": "npm run typecheck && vite build && node scripts/generate-routes.js",
    "test": "vitest run",
    "test:integration": "vitest run server/src/__tests__/integration",
    "verify": "npm run typecheck && npm run lint && npm test && npm audit --package-lock-only --ignore-scripts"
  }
}
```

Test runner sifatida Vitest tanlansa:

```text
npm install -D vitest supertest @types/supertest
```

---

## 2. Canonical anti-cheat modeli va validatsiyasi

### Yangi yoki mavjud faylga birlashtirish: `server/src/security/antiCheatPolicy.ts`

```ts
export type ProctoringMode = 'STRICT' | 'STANDARD' | 'RELAXED' | 'DISABLED';

export interface AntiCheatConfig {
  enabled: boolean;
  proctoringMode: ProctoringMode;
  requireBothEyesVisible: boolean;
  strictFaceCheck: boolean;
  trackGazeDirection: boolean;
  minFaceConfidence: number;
  maxAbsenceGracePeriod: number;
  maxViolationsAllowed: number;
  requireVoiceBiometrics: boolean;
  detectUnknownSpeakers: boolean;
  detectMultipleSpeakers: boolean;
  voiceSimilarityThreshold: number;
  blockDuplicateIP: boolean;
  heartbeatEnabled: boolean;
  heartbeatIntervalSec: number;
  cameraFaceSnapshotEnabled: boolean;
  snapshotOnMultipleFaces: boolean;
  snapshotOnNoFace: boolean;
  blockTabSwitch: boolean;
  blockCopyPaste: boolean;
  requireFullscreen: boolean;
  blockDevTools: boolean;
  version: number;
  updatedAt?: string;
  updatedBy?: string;
}

export const PRESETS: Record<ProctoringMode, Partial<AntiCheatConfig>> = {
  STRICT: {
    requireBothEyesVisible: true,
    strictFaceCheck: true,
    trackGazeDirection: true,
    minFaceConfidence: 0.7,
    maxAbsenceGracePeriod: 1.5,
    maxViolationsAllowed: 3,
  },
  STANDARD: {
    requireBothEyesVisible: true,
    strictFaceCheck: true,
    trackGazeDirection: false,
    minFaceConfidence: 0.65,
    maxAbsenceGracePeriod: 3,
    maxViolationsAllowed: 4,
  },
  RELAXED: {
    requireBothEyesVisible: false,
    strictFaceCheck: false,
    trackGazeDirection: false,
    minFaceConfidence: 0.5,
    maxAbsenceGracePeriod: 5,
    maxViolationsAllowed: 5,
  },
  DISABLED: {
    requireBothEyesVisible: false,
    strictFaceCheck: false,
    trackGazeDirection: false,
    requireVoiceBiometrics: false,
    detectUnknownSpeakers: false,
    detectMultipleSpeakers: false,
  },
};

export const DEFAULT_ANTI_CHEAT_CONFIG: AntiCheatConfig = {
  enabled: true,
  proctoringMode: 'STANDARD',
  requireBothEyesVisible: true,
  strictFaceCheck: true,
  trackGazeDirection: false,
  minFaceConfidence: 0.65,
  maxAbsenceGracePeriod: 3,
  maxViolationsAllowed: 4,
  requireVoiceBiometrics: false,
  detectUnknownSpeakers: false,
  detectMultipleSpeakers: false,
  voiceSimilarityThreshold: 0.75,
  blockDuplicateIP: true,
  heartbeatEnabled: true,
  heartbeatIntervalSec: 10,
  cameraFaceSnapshotEnabled: true,
  snapshotOnMultipleFaces: true,
  snapshotOnNoFace: true,
  blockTabSwitch: true,
  blockCopyPaste: true,
  requireFullscreen: true,
  blockDevTools: true,
  version: 1,
};

const BOOLEAN_KEYS: ReadonlyArray<keyof AntiCheatConfig> = [
  'enabled',
  'requireBothEyesVisible',
  'strictFaceCheck',
  'trackGazeDirection',
  'requireVoiceBiometrics',
  'detectUnknownSpeakers',
  'detectMultipleSpeakers',
  'blockDuplicateIP',
  'heartbeatEnabled',
  'cameraFaceSnapshotEnabled',
  'snapshotOnMultipleFaces',
  'snapshotOnNoFace',
  'blockTabSwitch',
  'blockCopyPaste',
  'requireFullscreen',
  'blockDevTools',
];

export class PolicyValidationError extends Error {
  constructor(public readonly details: string[]) {
    super('Anti-cheat policy noto\'g\'ri');
  }
}

function numberInRange(
  value: unknown,
  key: string,
  min: number,
  max: number,
  errors: string[],
): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    errors.push(`${key} ${min}..${max} oralig'ida bo'lishi shart`);
  }
  return parsed;
}

export function validateAntiCheatConfig(
  input: unknown,
  previous: AntiCheatConfig = DEFAULT_ANTI_CHEAT_CONFIG,
): AntiCheatConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new PolicyValidationError(['Policy object bo\'lishi shart']);
  }

  const body = input as Record<string, unknown>;
  const errors: string[] = [];
  const allowedKeys = new Set<keyof AntiCheatConfig>([
    ...BOOLEAN_KEYS,
    'proctoringMode',
    'minFaceConfidence',
    'maxAbsenceGracePeriod',
    'maxViolationsAllowed',
    'voiceSimilarityThreshold',
    'heartbeatIntervalSec',
    'version',
  ]);

  for (const key of Object.keys(body)) {
    if (!allowedKeys.has(key as keyof AntiCheatConfig)) {
      errors.push(`Noma'lum maydon: ${key}`);
    }
  }

  for (const key of BOOLEAN_KEYS) {
    if (key in body && typeof body[key] !== 'boolean') {
      errors.push(`${String(key)} boolean bo'lishi shart`);
    }
  }

  const mode = body.proctoringMode ?? previous.proctoringMode;
  if (!['STRICT', 'STANDARD', 'RELAXED', 'DISABLED'].includes(String(mode))) {
    errors.push('proctoringMode noto\'g\'ri');
  }

  const result: AntiCheatConfig = {
    ...previous,
    ...Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedKeys.has(key as keyof AntiCheatConfig)),
    ),
    proctoringMode: mode as ProctoringMode,
    minFaceConfidence: numberInRange(
      body.minFaceConfidence ?? previous.minFaceConfidence,
      'minFaceConfidence',
      0.5,
      0.95,
      errors,
    ),
    maxAbsenceGracePeriod: numberInRange(
      body.maxAbsenceGracePeriod ?? previous.maxAbsenceGracePeriod,
      'maxAbsenceGracePeriod',
      1,
      10,
      errors,
    ),
    maxViolationsAllowed: Math.round(numberInRange(
      body.maxViolationsAllowed ?? previous.maxViolationsAllowed,
      'maxViolationsAllowed',
      1,
      20,
      errors,
    )),
    voiceSimilarityThreshold: numberInRange(
      body.voiceSimilarityThreshold ?? previous.voiceSimilarityThreshold,
      'voiceSimilarityThreshold',
      0.5,
      0.95,
      errors,
    ),
    heartbeatIntervalSec: Math.round(numberInRange(
      body.heartbeatIntervalSec ?? previous.heartbeatIntervalSec,
      'heartbeatIntervalSec',
      2,
      60,
      errors,
    )),
    version: previous.version + 1,
  };

  if (errors.length > 0) throw new PolicyValidationError(errors);
  return result;
}

export function applyPreset(
  current: AntiCheatConfig,
  mode: ProctoringMode,
): AntiCheatConfig {
  return validateAntiCheatConfig({ ...current, ...PRESETS[mode], proctoringMode: mode }, current);
}

export function toParticipantPolicy(config: AntiCheatConfig): AntiCheatConfig {
  const { updatedBy: _updatedBy, ...safe } = config;
  return safe;
}
```

Muhim: `false` va `0` qiymatlari yo'qolmasligi uchun `||` emas, `??` ishlatilsin.

---

## 3. Cookie autentifikatsiyasi va Origin/CSRF himoyasi

### Yangi yoki mavjud faylga birlashtirish: `server/src/security/httpSecurity.ts`

```ts
import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';
const authCookieName = 'ibnsino_session';
const csrfCookieName = 'ibnsino_csrf';

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(authCookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(authCookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  });
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').flatMap((item) => {
      const index = item.indexOf('=');
      if (index < 1) return [];
      const key = item.slice(0, index).trim();
      const value = decodeURIComponent(item.slice(index + 1).trim());
      return [[key, value]];
    }),
  );
}

export function getAuthToken(req: Request): string | undefined {
  return parseCookies(req.headers.cookie)[authCookieName];
}

export function issueCsrfToken(_req: Request, res: Response): Response {
  const token = crypto.randomBytes(32).toString('base64url');
  res.cookie(csrfCookieName, token, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 2 * 60 * 60 * 1000,
    path: '/',
  });
  return res.status(200).json({ csrfToken: token });
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const allowed = new Set(
    String(process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
  const origin = req.get('origin');

  if (isProduction && (!origin || !allowed.has(origin))) {
    res.status(403).json({ error: 'Ishonchsiz so\'rov manbasi' });
    return;
  }

  next();
}

export function requireCsrf(req: Request, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[csrfCookieName];
  const headerToken = req.get('x-csrf-token');

  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    res.status(403).json({ error: 'CSRF token noto\'g\'ri yoki mavjud emas' });
    return;
  }

  next();
}
```

Integratsiya talablari:

```ts
// server bootstrap
app.use(requireTrustedOrigin);
app.get('/api/auth/csrf', issueCsrfToken);

// Login/register kabi endpointlarda trusted-origin va rate-limit bo'lsin.
// Cookie-auth bilan ishlaydigan state-changing /api route'larda requireCsrf bo'lsin.
```

Login/register/OTP controller javobi quyidagi shaklda bo'lsin. `token` JSON'ga qaytmasin:

```ts
setAuthCookie(res, token);
return res.status(200).json({
  success: true,
  user: userSafe,
});
```

Frontend API client:

```ts
let csrfToken: string | null = null;

async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const response = await fetch('/api/auth/csrf', { credentials: 'include' });
  if (!response.ok) throw new Error('CSRF token olinmadi');
  const data = await response.json() as { csrfToken: string };
  csrfToken = data.csrfToken;
  return csrfToken;
}

export async function secureFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = String(init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers.set('x-csrf-token', await ensureCsrfToken());
  }
  return fetch(input, { ...init, headers, credentials: 'include' });
}
```

JWT localStorage/sessionStorage'da saqlanmasin. User profili ham authorization manbasi bo'lmasin;
`GET /api/auth/me` server sessiyasidan olinadi.

---

## 4. Real SMTP va Eskiz SMS provider

Kerakli paketlar:

```text
npm install nodemailer
npm install -D @types/nodemailer
```

### Almashtirish: `server/src/services/notificationProvider.ts`

```ts
import nodemailer from 'nodemailer';

export interface SendOtpResult {
  sent: boolean;
  channel: 'email' | 'sms';
  providerId?: string;
  error?: string;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} sozlanmagan`);
  return value;
}

function normalizeUzPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const normalized = digits.startsWith('998') ? digits : `998${digits}`;
  if (!/^998\d{9}$/.test(normalized)) throw new Error('Telefon formati noto\'g\'ri');
  return normalized;
}

export class NotificationProvider {
  public static async sendOtp(to: string, code: string): Promise<SendOtpResult> {
    if (!/^\d{6}$/.test(code)) {
      return { sent: false, channel: to.includes('@') ? 'email' : 'sms', error: 'OTP formati noto\'g\'ri' };
    }

    return to.includes('@') ? this.sendEmailOtp(to, code) : this.sendSmsOtp(to, code);
  }

  private static async sendEmailOtp(to: string, code: string): Promise<SendOtpResult> {
    try {
      const transporter = nodemailer.createTransport({
        host: required('SMTP_HOST'),
        port: Number(process.env.SMTP_PORT ?? 465),
        secure: String(process.env.SMTP_SECURE ?? 'true') === 'true',
        auth: {
          user: required('SMTP_USER'),
          pass: required('SMTP_PASS'),
        },
        connectionTimeout: 8_000,
        greetingTimeout: 8_000,
        socketTimeout: 12_000,
        tls: { minVersion: 'TLSv1.2' },
      });

      const info = await transporter.sendMail({
        from: required('SMTP_FROM'),
        to,
        subject: 'IbnSinoSchool tasdiqlash kodi',
        text: `Tasdiqlash kodingiz: ${code}. Kod 10 daqiqa amal qiladi.`,
      });

      if (!info.messageId) throw new Error('SMTP messageId qaytarmadi');
      return { sent: true, channel: 'email', providerId: info.messageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email yuborilmadi';
      return { sent: false, channel: 'email', error: message };
    }
  }

  private static async sendSmsOtp(to: string, code: string): Promise<SendOtpResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const body = new URLSearchParams({
        mobile_phone: normalizeUzPhone(to),
        message: `IbnSinoSchool tasdiqlash kodi: ${code}. Kod 10 daqiqa amal qiladi.`,
        from: process.env.ESKIZ_FROM?.trim() || '4546',
      });

      let response: Response;
      try {
        response = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${required('ESKIZ_TOKEN')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      const payload = await response.json().catch(() => null) as null | {
        id?: string | number;
        message?: string;
        status?: string;
      };
      if (!response.ok || !payload?.id) {
        throw new Error(payload?.message || `SMS provider HTTP ${response.status}`);
      }

      return { sent: true, channel: 'sms', providerId: String(payload.id) };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SMS yuborilmadi';
      return { sent: false, channel: 'sms', error: message };
    }
  }
}
```

Controller qoidasi:

```ts
const delivery = await NotificationProvider.sendOtp(destination, otpCode);
if (!delivery.sent) {
  // OTP'ni usable holatga o'tkazmang; kerak bo'lsa hash yozuvini bekor qiling.
  return res.status(503).json({ error: 'Tasdiqlash kodi yuborilmadi' });
}
return res.status(202).json({ success: true, channel: delivery.channel });
```

OTP kodi, SMTP paroli va Eskiz tokenini log yoki API response'ga chiqarmang.

---

## 5. PostgreSQL ulanishi va production fail-fast

Kerakli paketlar:

```text
npm install pg
npm install -D @types/pg
```

### `server/src/db/pool.ts`

```ts
import { Pool, type PoolClient, type QueryResultRow } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL?.trim();

if (isProduction && !connectionString) {
  throw new Error('Production uchun DATABASE_URL majburiy');
}

export const pool = connectionString
  ? new Pool({
      connectionString,
      max: Number(process.env.DB_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    })
  : null;

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  if (!pool) throw new Error('PostgreSQL ulanmagan');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<T | undefined> {
  if (!pool) throw new Error('PostgreSQL ulanmagan');
  const result = await pool.query<T>(text, values);
  return result.rows[0];
}
```

Production controllerlar JSON store'ni to'g'ridan-to'g'ri chaqirmasin. `ExamRepository` interfeysi
yaratilib, productionda PostgreSQL implementation, testda test repository ishlatilsin.

### Atomik Single-IP session yaratish

Repository metodining asosiy qismi:

```ts
import type { PoolClient } from 'pg';
import { withTransaction } from './pool.js';

interface CreateSessionInput {
  sessionId: string;
  examId: string;
  userId: string;
  clientIp: string;
  expiresAt: Date;
  blockDuplicateIP: boolean;
}

export async function createExamSessionAtomic(input: CreateSessionInput) {
  return withTransaction(async (client: PoolClient) => {
    const lockKey = `${input.examId}:${input.clientIp}`;
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [lockKey]);

    if (input.blockDuplicateIP) {
      const duplicate = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT 1
             FROM exam_sessions
            WHERE exam_id = $1
              AND client_ip = $2::inet
              AND user_id <> $3
              AND status = 'IN_PROGRESS'
              AND expires_at > NOW()
         ) AS exists`,
        [input.examId, input.clientIp, input.userId],
      );

      if (duplicate.rows[0]?.exists) {
        const error = new Error('Bu IP manzilda boshqa faol ishtirokchi mavjud');
        Object.assign(error, { status: 409, code: 'DUPLICATE_IP' });
        throw error;
      }
    }

    const created = await client.query(
      `INSERT INTO exam_sessions
        (id, exam_id, user_id, client_ip, status, started_at, last_heartbeat_at, expires_at)
       VALUES ($1, $2, $3, $4::inet, 'IN_PROGRESS', NOW(), NOW(), $5)
       RETURNING *`,
      [input.sessionId, input.examId, input.userId, input.clientIp, input.expiresAt],
    );
    return created.rows[0];
  });
}
```

`trust proxy` faqat ma'lum reverse-proxy hoplari uchun sozlanadi. Foydalanuvchi yuborgan tasodifiy
`X-Forwarded-For`ga ishonmang.

---

## 6. Server-side heartbeat timeout worker

### `server/src/services/heartbeatMonitor.ts`

```ts
import type { PoolClient } from 'pg';
import { withTransaction } from '../db/pool.js';

const WORKER_LOCK_ID = 73_001_001;

export interface HeartbeatMonitorHandle {
  stop(): void;
}

async function expireStaleSessions(): Promise<number> {
  return withTransaction(async (client: PoolClient) => {
    const lock = await client.query<{ locked: boolean }>(
      'SELECT pg_try_advisory_xact_lock($1) AS locked',
      [WORKER_LOCK_ID],
    );
    if (!lock.rows[0]?.locked) return 0;

    const expired = await client.query<{ id: string; exam_id: string; user_id: string }>(
      `WITH stale AS (
         SELECT s.id
           FROM exam_sessions s
           JOIN exams e ON e.id = s.exam_id
          WHERE s.status = 'IN_PROGRESS'
            AND COALESCE((e.anti_cheat_config->>'enabled')::boolean, TRUE) = TRUE
            AND COALESCE((e.anti_cheat_config->>'heartbeatEnabled')::boolean, TRUE) = TRUE
            AND s.last_heartbeat_at < NOW() -
                make_interval(secs => 3 * COALESCE(
                  (e.anti_cheat_config->>'heartbeatIntervalSec')::integer,
                  10
                ))
          FOR UPDATE OF s SKIP LOCKED
       ), updated AS (
         UPDATE exam_sessions s
            SET status = 'DISCONNECTED',
                disconnected_at = NOW(),
                disconnection_reason = 'HEARTBEAT_TIMEOUT'
           FROM stale
          WHERE s.id = stale.id
         RETURNING s.id, s.exam_id, s.user_id
       )
       INSERT INTO proctor_events
         (session_id, exam_id, user_id, event_id, event_type, occurred_at, details)
       SELECT id, exam_id, user_id,
              'heartbeat-timeout-' || id,
              'HEARTBEAT_TIMEOUT', NOW(),
              jsonb_build_object('source', 'server')
         FROM updated
       ON CONFLICT (event_id) DO NOTHING
       RETURNING session_id AS id, exam_id, user_id`,
    );

    return expired.rowCount ?? 0;
  });
}

export function startHeartbeatMonitor(intervalMs = 5_000): HeartbeatMonitorHandle {
  let running = false;
  const timer = setInterval(() => {
    if (running) return;
    running = true;
    void expireStaleSessions()
      .catch((error) => {
        // Markaziy loggerga secretlarsiz yozilsin.
        console.error('[heartbeat-monitor]', error instanceof Error ? error.message : 'unknown error');
      })
      .finally(() => {
        running = false;
      });
  }, intervalMs);
  timer.unref();

  return { stop: () => clearInterval(timer) };
}
```

Heartbeat endpoint client time'iga ishonmasin:

```sql
UPDATE exam_sessions
   SET last_heartbeat_at = NOW()
 WHERE id = $1
   AND user_id = $2
   AND status = 'IN_PROGRESS'
RETURNING status;
```

App shutdown'da worker `stop()` qilinsin. Testlarda fake timer yoki to'g'ridan-to'g'ri worker
funksiyasi ishlatilsin.

---

## 7. Snapshot dekoderi, magic-byte tekshiruvi va xavfsiz yozish

### `server/src/security/snapshotFile.ts`

```ts
import crypto from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MAX_SNAPSHOT_BYTES = 1024 * 1024;
const DATA_URL = /^data:image\/(jpeg|jpg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

export class SnapshotValidationError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

function isJpeg(data: Buffer): boolean {
  return data.length >= 4 && data[0] === 0xff && data[1] === 0xd8 &&
    data[data.length - 2] === 0xff && data[data.length - 1] === 0xd9;
}

function isWebp(data: Buffer): boolean {
  return data.length >= 12 &&
    data.subarray(0, 4).toString('ascii') === 'RIFF' &&
    data.subarray(8, 12).toString('ascii') === 'WEBP';
}

export function decodeSnapshot(dataUrl: unknown): {
  buffer: Buffer;
  mimeType: 'image/jpeg' | 'image/webp';
  extension: 'jpg' | 'webp';
} {
  if (typeof dataUrl !== 'string') throw new SnapshotValidationError('Rasm talab qilinadi');
  const match = DATA_URL.exec(dataUrl);
  if (!match) throw new SnapshotValidationError('Faqat JPEG yoki WebP base64 rasm ruxsat etiladi');

  const estimatedBytes = Math.floor(match[2].length * 0.75);
  if (estimatedBytes > MAX_SNAPSHOT_BYTES + 3) {
    throw new SnapshotValidationError('Rasm 1 MiB dan oshmasligi kerak', 413);
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0 || buffer.length > MAX_SNAPSHOT_BYTES) {
    throw new SnapshotValidationError('Rasm hajmi noto\'g\'ri', buffer.length > MAX_SNAPSHOT_BYTES ? 413 : 400);
  }

  const normalizedInput = match[2].replace(/=+$/, '');
  const normalizedDecoded = buffer.toString('base64').replace(/=+$/, '');
  if (normalizedInput !== normalizedDecoded) {
    throw new SnapshotValidationError('Base64 ma\'lumoti buzilgan');
  }

  if (isJpeg(buffer)) return { buffer, mimeType: 'image/jpeg', extension: 'jpg' };
  if (isWebp(buffer)) return { buffer, mimeType: 'image/webp', extension: 'webp' };
  throw new SnapshotValidationError('Rasm signaturasi JPEG yoki WebP emas');
}

export async function persistSnapshot(dataUrl: unknown): Promise<{
  storageKey: string;
  fileSize: number;
  mimeType: 'image/jpeg' | 'image/webp';
}> {
  const decoded = decodeSnapshot(dataUrl);
  const directory = path.resolve(process.env.SNAPSHOT_DIR || 'server/data/snapshots');
  await mkdir(directory, { recursive: true, mode: 0o700 });

  const storageKey = `${crypto.randomUUID()}.${decoded.extension}`;
  const absolutePath = path.join(directory, storageKey);
  await writeFile(absolutePath, decoded.buffer, { flag: 'wx', mode: 0o600 });
  return { storageKey, fileSize: decoded.buffer.length, mimeType: decoded.mimeType };
}
```

Database'da absolute path emas, faqat server yaratgan `storageKey` saqlansin. Fayl berilganda
`path.resolve(snapshotDir, storageKey)` natijasi snapshot directory ichida ekanligi tekshirilsin.

Retention uchun kunlik job:

```ts
import { unlink } from 'node:fs/promises';

// Transactionda muddati o'tgan metadata'larni RETURNING storage_key bilan o'chir.
// Commitdan keyin har bir storage_key uchun unlink bajar.
// ENOENT idempotent holat, boshqa xatolar retry queue'ga yoziladi.
```

Maksimal saqlash muddati `SNAPSHOT_RETENTION_DAYS`, standart 30 kun bo'lsin. Biometrik ma'lumot
uchun rozilik va admin audit log majburiy.

---

## 8. Proktor hodisasini serverda hisoblash

Klient `violationCount`, `severity` yoki `isDisqualified` qarorini yubormasin. Request faqat:

```ts
interface ProctorEventRequest {
  eventId: string;
  eventType: string;
  occurredAt: string;
  details?: Record<string, unknown>;
}
```

Transaction ichidagi algoritm:

```ts
await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [sessionId]);

const session = await client.query(
  `SELECT s.*, e.anti_cheat_config
     FROM exam_sessions s
     JOIN exams e ON e.id = s.exam_id
    WHERE s.id = $1 AND s.user_id = $2
    FOR UPDATE`,
  [sessionId, authenticatedUserId],
);

// 1. Session IN_PROGRESS bo'lmasa rad et.
// 2. eventType shu policy flagida yoqilganligini server xaritasi orqali tekshir.
// 3. eventId UNIQUE bo'lsin; ON CONFLICT DO NOTHING duplicate eventni qayta sanamasin.
// 4. Faqat yangi violation bo'lsa sessions.violation_count ni +1 qil.
// 5. serverdagi maxViolationsAllowed ga yetganda status='DISQUALIFIED' qil.
// 6. Yangilangan count/statusni response'da qaytar.
```

Event-to-policy xaritasi bitta joyda bo'lsin:

```ts
const EVENT_FLAG: Readonly<Record<string, keyof AntiCheatConfig>> = {
  TAB_HIDDEN: 'blockTabSwitch',
  WINDOW_BLUR: 'blockTabSwitch',
  COPY: 'blockCopyPaste',
  CUT: 'blockCopyPaste',
  PASTE: 'blockCopyPaste',
  CONTEXT_MENU: 'blockCopyPaste',
  FULLSCREEN_EXIT: 'requireFullscreen',
  DEVTOOLS_KEY: 'blockDevTools',
  NO_FACE: 'strictFaceCheck',
  GAZE_AWAY: 'trackGazeDirection',
  UNKNOWN_SPEAKER: 'detectUnknownSpeakers',
  MULTIPLE_SPEAKERS: 'detectMultipleSpeakers',
};
```

Noma'lum event turi `400` bilan rad etilsin. `enabled=false` bo'lsa anti-cheat hodisasi violation
sifatida yozilmasin.

---

## 9. Frontend anti-cheat init/destroy

`ExamGuard` yoki mos service quyidagi prinsipda ishlasin:

```ts
export function startEnabledGuards(policy: AntiCheatConfig) {
  const cleanups: Array<() => void> = [];

  if (!policy.enabled) return () => undefined;

  if (policy.blockTabSwitch) cleanups.push(startTabVisibilityGuard());
  if (policy.blockCopyPaste) cleanups.push(startCopyPasteGuard());
  if (policy.requireFullscreen) cleanups.push(startFullscreenGuard());
  if (policy.blockDevTools) cleanups.push(startDevToolsKeyMonitor());
  if (policy.heartbeatEnabled) {
    cleanups.push(startHeartbeat({ intervalMs: policy.heartbeatIntervalSec * 1000 }));
  }

  const aiEnabled = policy.proctoringMode !== 'DISABLED';
  if (aiEnabled && (
    policy.requireBothEyesVisible ||
    policy.strictFaceCheck ||
    policy.trackGazeDirection ||
    policy.cameraFaceSnapshotEnabled
  )) {
    cleanups.push(startCameraProctoring(policy));
  }

  if (aiEnabled && (
    policy.requireVoiceBiometrics ||
    policy.detectUnknownSpeakers ||
    policy.detectMultipleSpeakers
  )) {
    cleanups.push(startAudioProctoring(policy));
  }

  return () => {
    for (const cleanup of cleanups.reverse()) cleanup();
  };
}
```

Browser ichidan F12, DevTools, Alt+Tab yoki screenshotni 100% bloklash mumkinligi haqida noto'g'ri
da'vo qilinmasin. Listenerlar dalil yuboradi; haqiqiy himoya server-side session, question secrecy va
server-side grading hisoblanadi.

---

## 10. Anti-cheat editor dirty-state

`hasUnsavedChanges={false}` hardcode qiymatini olib tashlang.

### `src/utils/stableJson.ts`

```ts
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !['updatedAt', 'updatedBy'].includes(key))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalize(nested)]),
    );
  }
  return value;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(normalize(value));
}
```

Editor parent componentidagi namuna:

```tsx
const [savedPolicy, setSavedPolicy] = useState<AntiCheatConfig | null>(null);
const [draftPolicy, setDraftPolicy] = useState<AntiCheatConfig | null>(null);
const [isSaving, setIsSaving] = useState(false);
const [saveError, setSaveError] = useState<string | null>(null);

const hasUnsavedChanges = useMemo(
  () => Boolean(savedPolicy && draftPolicy && stableJson(savedPolicy) !== stableJson(draftPolicy)),
  [savedPolicy, draftPolicy],
);

useEffect(() => {
  let cancelled = false;
  void antiCheatApi.get(examId).then((serverPolicy) => {
    if (cancelled) return;
    setSavedPolicy(serverPolicy);
    setDraftPolicy(serverPolicy);
  }).catch((error) => {
    if (!cancelled) setSaveError(toUserMessage(error));
  });
  return () => { cancelled = true; };
}, [examId]);

async function savePolicy() {
  if (!draftPolicy || !hasUnsavedChanges || isSaving) return;
  setIsSaving(true);
  setSaveError(null);
  try {
    const canonical = await antiCheatApi.update(examId, draftPolicy);
    setSavedPolicy(canonical);
    setDraftPolicy(canonical);
  } catch (error) {
    setSaveError(toUserMessage(error));
  } finally {
    setIsSaving(false);
  }
}
```

`AntiCheatSettingsEditor`ga real `hasUnsavedChanges`, `isSaving`, `error` va `onSave` uzatilsin.
API xatosida draft yo'qolmasin va muvaffaqiyat toast'i ko'rsatilmasin.

---

## 11. To'lov va paketlarni to'liq olib tashlash

Quyidagi kalitlar type, data, component, store, service, route va eksportlardan olib tashlansin:

```text
paidCount
totalRevenue
paymentMethods
freeForPackageId
paymentType
paymentStatus
PayX
packages
```

Faqat browser security headeridagi `payment=()` qolishi mumkin. Olimpiada bepul ekanligi uchun
soxta `paymentStatus='paid'` qo'shmang; payment gate va payment maydonining o'zi bo'lmasin.

Tekshirilishi shart bo'lgan fayllar:

```text
src/components/ega/OlympiadFullEditor.tsx
src/components/ega/NationalExamFullEditor.tsx
src/store/useOlympiadStore.ts
src/store/useNationalExamStore.ts
src/data/initialOlympiads.ts
src/data/initialNationalExams.ts
src/services/submissionService.ts
src/pages/ega/EgaBaholashPage.tsx
server/src/controllers/exam.controller.ts
```

Global qidiruv natijasini yakuniy hisobotga kiriting.

---

## 12. Haqiqiy Express integratsion testlar

Server bootstrap'i testlanadigan bo'lsin:

```ts
// server/src/app.ts
export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  // middleware va route'larni dependency injection bilan ulang.
  return app;
}

// server/src/server.ts faqat listen va worker startup qiladi.
```

### Namuna: `server/src/__tests__/integration/security.integration.test.ts`

```ts
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';

describe('security integration', () => {
  const repository = createTestRepository();
  const app = createApp({ repository, now: () => new Date('2026-01-01T00:00:00Z') });

  beforeEach(async () => {
    await repository.reset();
  });

  it('login JWTni JSONda qaytarmaydi va HttpOnly cookie beradi', async () => {
    await repository.seedUser({ email: 'admin@example.test', password: 'StrongPass123', role: 'admin' });
    const response = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'http://localhost:5173')
      .send({ identifier: 'admin@example.test', password: 'StrongPass123' })
      .expect(200);

    expect(response.body.token).toBeUndefined();
    expect(response.headers['set-cookie']?.join(';')).toMatch(/HttpOnly/i);
  });

  it("student admin policy endpointini o'zgartira olmaydi", async () => {
    const student = await loginAs(app, repository, 'student');
    await request(app)
      .put('/api/admin/exams/exam-1/anti-cheat')
      .set('Cookie', student.cookies)
      .set('Origin', 'http://localhost:5173')
      .set('x-csrf-token', student.csrfToken)
      .send({ enabled: false })
      .expect(403);
  });

  it("snapshot nomi JPEG bo'lsa ham noto'g'ri magic-byte ni rad etadi", async () => {
    const student = await loginAs(app, repository, 'student');
    await repository.seedActiveSession({ id: 'session-1', examId: 'exam-1', userId: student.userId });
    const fake = `data:image/jpeg;base64,${Buffer.from('not an image').toString('base64')}`;

    await request(app)
      .post('/api/exams/exam-1/snapshots')
      .set('Cookie', student.cookies)
      .set('Origin', 'http://localhost:5173')
      .set('x-csrf-token', student.csrfToken)
      .send({ sessionId: 'session-1', eventType: 'NO_FACE', imageBase64: fake })
      .expect(400);
  });

  it('duplicate eventId violationni ikkinchi marta sanamaydi', async () => {
    const student = await loginAs(app, repository, 'student');
    await repository.seedActiveSession({ id: 'session-1', examId: 'exam-1', userId: student.userId });
    const event = { eventId: 'event-1', eventType: 'TAB_HIDDEN', occurredAt: new Date().toISOString() };

    await postProctorEvent(app, student, 'session-1', event).expect(200);
    const duplicate = await postProctorEvent(app, student, 'session-1', event).expect(200);
    expect(duplicate.body.isDuplicate).toBe(true);
    expect(duplicate.body.violationCount).toBe(1);
  });
});
```

`createTestRepository`, `loginAs` va `postProctorEvent` test helperlari real endpointga so'rov
yuborishi kerak; testning o'zi production algoritmini qayta yozib, o'zini tekshirmasin.

Majburiy test matritsasi:

1. Admin policy GET/PUT va refresh/persistence.
2. Student policy PUT uchun 403.
3. `enabled=false` bo'lsa event/snapshot/heartbeat anti-cheat ta'siri yo'q.
4. Har bir browser flag ON/OFF.
5. `DISABLED` presetda AI off, browser qoidalari mustaqil.
6. Heartbeat timeout server tomonidan `DISCONNECTED` qiladi.
7. Duplicate event idempotent.
8. Limitda server diskvalifikatsiya qiladi.
9. Single-IP uchun ikki parallel request: bittasi 201, bittasi 409.
10. Snapshot policy, ownership, admin access, 1 MiB va magic-byte.
11. Public question javobida answer key/explanation yo'q.
12. Cookie HttpOnly; JSON/localStorage'da JWT yo'q.
13. CSRF/Origin bo'lmagan mutation 403.
14. Payment/package endpointlar 404.

---

## 13. Dependency auditni tuzatish

Hozirgi auditda `braces`, `micromatch`, `fast-glob`, `globby`, `tailwindcss` va
`@typescript-eslint/*` zanjirida high advisorylar bor.

Talab:

1. `npm audit --package-lock-only --ignore-scripts --json` bilan boshlang.
2. `@typescript-eslint/parser` va `@typescript-eslint/eslint-plugin`ni bir xil qo'llab-quvvatlanadigan
   versiyaga yangilang.
3. Tailwind 4 talab qilinsa, rasmiy migratsiya bilan config/CSS/PostCSS'ni moslang; faqat override
   bilan advisoryni yashirmang.
4. `braces: ^3.0.3` override tuzatish emas, chunki advisory `<=3.0.3`ga taalluqli.
5. Har bir major update'dan keyin UI build va vizual smoke test qiling.
6. Yakunda high va critical sonlarini hisobotda aynan ko'rsating.

---

## 14. Environment schema

`.env.example`da faqat placeholderlar bo'lsin:

```dotenv
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
DB_SSL=false
DB_POOL_MAX=10
JWT_SECRET=REPLACE_WITH_AT_LEAST_32_RANDOM_BYTES
CORS_ORIGINS=http://localhost:5173
COOKIE_SECURE=false
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=replace_me
SMTP_PASS=replace_me
SMTP_FROM=no-reply@example.com
ESKIZ_TOKEN=replace_me
ESKIZ_FROM=4546
SNAPSHOT_DIR=server/data/snapshots
SNAPSHOT_RETENTION_DAYS=30
```

Production startup `replace_me`, `change_me`, `example`, qisqa JWT secret va yo'q `DATABASE_URL`ni
rad etsin. `.env` commit qilinmasin.

---

## 15. Ish tartibi

Keyingi AI quyidagi tartibda ishlasin:

1. `agents.md` va ushbu faylni to'liq o'qish.
2. `git status` orqali mavjud user o'zgarishlarini aniqlash va saqlash.
3. Server type-checkni qo'shish; takroriy metodlarni tozalash.
4. Repository interfeysi va PostgreSQL wiring.
5. Cookie/CSRF/rate-limit.
6. Real notification provider.
7. Heartbeat, Single-IP va proctor event transactionlari.
8. Snapshot validation/retention.
9. Frontend policy va dirty-state integratsiyasi.
10. Payment/package qoldiqlarini olib tashlash.
11. Integratsion testlar.
12. Dependency migration va audit.
13. Yakuniy build/lint/test/audit.

Bir bosqich muvaffaqiyatsiz bo'lsa keyingisiga o'tib “hammasi bajarildi” deb yozmang.

## 16. Definition of Done

Quyidagi buyruqlarning real exit code'i `0` bo'lmasa vazifa tugamagan:

```text
npm ci
npm run typecheck:frontend
npm run typecheck:server
npm run lint
npm test
npm run build
npm audit --package-lock-only --ignore-scripts
```

Qo'shimcha global tekshiruvlar:

```text
payment/package/payx kalitlari runtime kodda yo'q
localStorage/sessionStorage ichida JWT/token yo'q
auth JSON response ichida token yo'q
store ichida duplicate class method yo'q
production controller JSON store'ga bevosita bog'lanmagan
notification provider real provider javobisiz sent=true qaytarmaydi
```

Yakuniy hisobot:

- o'zgartirilgan fayllar va sabab;
- endpoint/method/request/response/auth contract;
- migration va rollback tartibi;
- testlar soni va aniq natijasi;
- audit high/critical soni;
- qo'lda tekshirilgan browser oqimlari;
- qolgan cheklov va bajarilmagan ishlar.

Taxmin, yarim tayyor adapter, mock yoki faqat fayl yaratish “bajarildi” hisoblanmaydi.
