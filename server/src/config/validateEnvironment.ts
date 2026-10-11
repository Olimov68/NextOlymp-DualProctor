export function validateEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const integer = (name: string, fallback: number, min: number, max: number) => {
    const value = Number(env[name] ?? fallback);
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(name + ' is invalid');
  };
  integer('PORT', 5000, 1, 65535);
  integer('SNAPSHOT_RETENTION_DAYS', 30, 1, 365);
  integer('SMTP_PORT', 587, 1, 65535);
  if (env.DB_SSL && !['true', 'false'].includes(env.DB_SSL)) throw new Error('DB_SSL is invalid');
  if (env.NODE_ENV !== 'production') return;
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL required');
  const url = new URL(env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('PostgreSQL required');
  if (!env.ALLOWED_ORIGINS) throw new Error('Explicit production ALLOWED_ORIGINS required');
  for (const item of env.ALLOWED_ORIGINS.split(',')) {
    const origin = new URL(item.trim());
    if (origin.protocol !== 'https:' || origin.origin !== item.trim()) throw new Error('Production origins must be exact HTTPS origins');
  }
  for (const name of ['DATABASE_URL', 'JWT_SECRET', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'ESKIZ_TOKEN', 'SMS_API_KEY', 'GEMINI_API_KEY']) {
    if (env[name] && /replace[_ -]?me|change[_ -]?me|example\.(com|test)|REPLACE_WITH|HOST:5432/i.test(env[name]!))
      throw new Error(name + ' contains a placeholder');
  }
}
