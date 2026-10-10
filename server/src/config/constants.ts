import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Load .env if present from project root or server folder
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server', '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    try {
      if (typeof (process as any).loadEnvFile === 'function') {
        (process as any).loadEnvFile(envPath);
      } else {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [k, ...v] = trimmed.split('=');
            if (k && v.length) {
              process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
            }
          }
        });
      }
    } catch {}
  }
}

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const PORT = Number(process.env.PORT) || 5000;

// Safe JWT Secret initialization
const LEAKED_SECRETS = ['ibn_sino_super_secret_jwt_key_2026_x92!', 'secret', 'default_secret'];
const configuredJwtSecret = process.env.JWT_SECRET?.trim();

export const JWT_SECRET = configuredJwtSecret && !LEAKED_SECRETS.includes(configuredJwtSecret) && configuredJwtSecret.length >= 16
  ? configuredJwtSecret
  : '8f5a43b7e61d49209581c7e997a3bf2361d7637841893c87023c914efbe887d1';

if (!configuredJwtSecret || configuredJwtSecret.length < 16) {
  console.warn(
    '[SECURITY NOTICE] JWT_SECRET is not set in .env. A secure cryptographic secret is active.'
  );
}

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

// Base production allowed origins
const BASE_PROD_ORIGINS = [
  'https://ibnsino.uz',
  'https://www.ibnsino.uz',
  'https://ibnsinoschool.uz',
  'https://www.ibnsinoschool.uz',
];

// Base development allowed origins
const BASE_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

const envAllowed = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : [];

export const ALLOWED_ORIGINS = [
  ...BASE_PROD_ORIGINS,
  ...(IS_PRODUCTION ? [] : BASE_DEV_ORIGINS),
  ...envAllowed,
];

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true; // allow same-origin / server-to-server requests
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  if (!IS_PRODUCTION) {
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.')
    ) {
      return true;
    }
  }

  return false;
}

