

export type LogLevel = 'info' | 'warning' | 'error' | 'critical';
export type LogSource = 'access' | 'action' | 'security' | 'ddos';

export interface AccessLog {
  id: string;
  timestamp: string;
  ip: string;
  country: string;
  countryCode: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'PATCH';
  path: string;
  statusCode: number;
  responseTimeMs: number;
  userAgent: string;
  userId?: string;
  userName?: string;
  bytesSent: number;
  referer?: string;
  level: LogLevel;
}

export interface ActionLog {
  id: string;
  timestamp: string;
  ip: string;
  userId: string;
  userName: string;
  role: 'admin' | 'student' | 'teacher';
  action: string;
  resource: string;
  detail: string;
  success: boolean;
  level: LogLevel;
}

export interface TrafficDataPoint {
  time: string;
  requests: number;
  bandwidth: number; 
  errors: number;
  blocked: number;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  type: 'ddos' | 'brute_force' | 'sql_injection' | 'xss' | 'suspicious_scan' | 'rate_limit' | 'geo_block' | 'bot';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  country: string;
  countryCode: string;
  description: string;
  requestCount: number;
  timeWindowSec: number;
  status: 'active' | 'blocked' | 'investigating' | 'resolved';
  aiAnalysis?: string;
}

export interface BlockedIP {
  ip: string;
  country: string;
  countryCode: string;
  reason: string;
  blockedAt: string;
  expiresAt?: string;
  requestCount: number;
  permanent: boolean;
}

export const initialAccessLogs: AccessLog[] = [
  {
    id: 'acc-101',
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    ip: '84.54.70.12',
    country: "O'zbekiston",
    countryCode: 'UZ',
    method: 'GET',
    path: '/api/v1/system/health',
    statusCode: 200,
    responseTimeMs: 8,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    userId: 'U-ADM-001',
    userName: 'Asilbek Olimov',
    bytesSent: 1240,
    level: 'info',
  },
  {
    id: 'acc-102',
    timestamp: new Date(Date.now() - 15000).toISOString().replace('T', ' ').slice(0, 19),
    ip: '84.54.70.12',
    country: "O'zbekiston",
    countryCode: 'UZ',
    method: 'GET',
    path: '/student/leaderboard',
    statusCode: 200,
    responseTimeMs: 14,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    userId: 'U-ADM-001',
    userName: 'Asilbek Olimov',
    bytesSent: 4520,
    level: 'info',
  },
  {
    id: 'acc-103',
    timestamp: new Date(Date.now() - 45000).toISOString().replace('T', ' ').slice(0, 19),
    ip: '213.230.108.45',
    country: "O'zbekiston",
    countryCode: 'UZ',
    method: 'POST',
    path: '/api/v1/auth/login',
    statusCode: 200,
    responseTimeMs: 24,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    userId: 'U-STU-042',
    userName: 'Madina Rashidova',
    bytesSent: 2840,
    level: 'info',
  },
  {
    id: 'acc-104',
    timestamp: new Date(Date.now() - 120000).toISOString().replace('T', ' ').slice(0, 19),
    ip: '185.220.101.5',
    country: 'Germaniya',
    countryCode: 'DE',
    method: 'GET',
    path: '/wp-admin/setup-config.php',
    statusCode: 403,
    responseTimeMs: 2,
    userAgent: 'Go-http-client/1.1',
    bytesSent: 340,
    level: 'warning',
  },
  {
    id: 'acc-105',
    timestamp: new Date(Date.now() - 180000).toISOString().replace('T', ' ').slice(0, 19),
    ip: '84.54.70.12',
    country: "O'zbekiston",
    countryCode: 'UZ',
    method: 'POST',
    path: '/api/v1/anti-cheat/telemetry',
    statusCode: 200,
    responseTimeMs: 11,
    userAgent: 'IbnSino-ExamGuard/3.2',
    userId: 'U-ADM-001',
    userName: 'Asilbek Olimov',
    bytesSent: 820,
    level: 'info',
  },
  {
    id: 'acc-106',
    timestamp: new Date(Date.now() - 300000).toISOString().replace('T', ' ').slice(0, 19),
    ip: '194.87.142.88',
    country: 'Rossiya',
    countryCode: 'RU',
    method: 'POST',
    path: '/api/v1/auth/login',
    statusCode: 401,
    responseTimeMs: 4,
    userAgent: 'Python-requests/2.28.1',
    bytesSent: 240,
    level: 'error',
  }
];

export const initialActionLogs: ActionLog[] = [
  {
    id: 'act-101',
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    ip: '84.54.70.12',
    userId: 'U-ADM-001',
    userName: 'Asilbek Olimov',
    role: 'admin',
    action: 'SYSTEM_BOOT',
    resource: 'system/core',
    detail: "Ibn Sino Kiberxavfsizlik va WAF himoya moduli ishga tushirildi",
    success: true,
    level: 'info',
  },
  {
    id: 'act-102',
    timestamp: new Date(Date.now() - 60000).toISOString().replace('T', ' ').slice(0, 16),
    ip: '84.54.70.12',
    userId: 'U-ADM-001',
    userName: 'Asilbek Olimov',
    role: 'admin',
    action: 'SSL_VERIFY',
    resource: 'security/ssl',
    detail: 'Let\'s Encrypt SSL sertifikati (ibnsino.uz:443) muvaffaqiyatli tekshirildi',
    success: true,
    level: 'info',
  }
];

export const initialTrafficData: TrafficDataPoint[] = [
  { time: '19:40', requests: 42, bandwidth: 120, errors: 0, blocked: 0 },
  { time: '19:45', requests: 68, bandwidth: 210, errors: 0, blocked: 0 },
  { time: '19:50', requests: 95, bandwidth: 340, errors: 1, blocked: 0 },
  { time: '19:55', requests: 124, bandwidth: 480, errors: 0, blocked: 1 },
  { time: '20:00', requests: 160, bandwidth: 620, errors: 0, blocked: 0 },
  { time: '20:05', requests: 185, bandwidth: 740, errors: 0, blocked: 0 },
  { time: '20:10', requests: 210, bandwidth: 890, errors: 1, blocked: 1 },
  { time: '20:15', requests: 195, bandwidth: 820, errors: 0, blocked: 0 },
  { time: '20:20', requests: 230, bandwidth: 960, errors: 0, blocked: 0 },
  { time: '20:25', requests: 250, bandwidth: 1040, errors: 0, blocked: 0 },
  { time: '20:30', requests: 275, bandwidth: 1120, errors: 1, blocked: 0 },
  { time: '20:35', requests: 290, bandwidth: 1210, errors: 0, blocked: 0 },
];

export const initialSecurityAlerts: SecurityAlert[] = [
  {
    id: 'alt-101',
    timestamp: new Date(Date.now() - 180000).toISOString().replace('T', ' ').slice(0, 19),
    type: 'suspicious_scan',
    severity: 'medium',
    ip: '185.220.101.5',
    country: 'Germaniya',
    countryCode: 'DE',
    description: "Noma'lum skanerlash /wp-admin urinishi aniqlandi va WAF orqali to'sib qo'yildi (403)",
    requestCount: 14,
    timeWindowSec: 30,
    status: 'blocked',
    aiAnalysis: 'Botnet skaner shabloni aniqlandi. IP avtomatik bloklandi.',
  }
];

export const initialBlockedIPs: BlockedIP[] = [
  {
    ip: '185.220.101.5',
    country: 'Germaniya',
    countryCode: 'DE',
    reason: "Avtomatik bot / xavfli skanerlash urinishi",
    blockedAt: new Date(Date.now() - 180000).toISOString().replace('T', ' ').slice(0, 16),
    expiresAt: '24 soat',
    requestCount: 14,
    permanent: false,
  }
];

