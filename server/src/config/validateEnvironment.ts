export function validateEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  try {
    const integer = (name: string, fallback: number, min: number, max: number) => {
      const value = Number(env[name] ?? fallback);
      if (!Number.isInteger(value) || value < min || value > max) {
        console.warn(`[config] ${name} is invalid, fallback used`);
      }
    };
    integer('PORT', 5000, 1, 65535);
    integer('SNAPSHOT_RETENTION_DAYS', 30, 1, 365);
    integer('SMTP_PORT', 587, 1, 65535);
  } catch (err: any) {
    console.warn('[config] Environment notice:', err?.message);
  }
}
