import fs from 'fs';
import path from 'path';

// Load .env if present using native Node.js 20+ feature or custom parser
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  try {
    if (typeof (process as any).loadEnvFile === 'function') {
      (process as any).loadEnvFile(envPath);
    } else {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const [k, ...v] = line.split('=');
        if (k && v.length) {
          process.env[k.trim()] = v.join('=').trim();
        }
      });
    }
  } catch {}
}

export const PORT = Number(process.env.PORT) || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'ibn_sino_super_secret_jwt_key_2026_x92!';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

export const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://ibnsino.uz',
  'https://www.ibnsino.uz',
];
