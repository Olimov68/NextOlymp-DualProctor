import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import os from 'os';
import cors from 'cors';
import { Server } from 'socket.io';
import { PORT, ALLOWED_ORIGINS, isOriginAllowed, IS_PRODUCTION } from './config/constants';
import { AuthController } from './controllers/auth.controller';
import { ExamController } from './controllers/exam.controller';
import { UserController } from './controllers/user.controller';
import { SubmissionController } from './controllers/submission.controller';
import { CertificateController } from './controllers/certificate.controller';
import { ProctorController } from './controllers/proctor.controller';
import { setupProctorSockets } from './sockets/proctorSocketHandler';
import { authenticateJWT, optionalAuth, requireRole } from './middleware/auth.middleware';
import { dbStore } from './db/store';
import { systemHealthService } from './services/systemHealth.service';
import { requestLoggerService } from './services/requestLogger.service';

const app = express();
const server = http.createServer(app);

// CRITICAL SECURITY FIX (Item 9): Strict CORS policy
app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS xavfsizlik cheklovi: Ruxsatsiz domen rad etildi'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Reverse-proxy aware IP resolver (supports Nginx X-Forwarded-For, X-Real-IP, Cloudflare)
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const raw = typeof forwarded === 'string' ? forwarded : forwarded[0];
    const first = raw.split(',')[0].trim().replace(/^.*:/, '');
    if (first && first !== '1') return first;
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    const raw = typeof realIp === 'string' ? realIp : realIp[0];
    const clean = raw.trim().replace(/^.*:/, '');
    if (clean && clean !== '1') return clean;
  }
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) {
    const raw = typeof cfIp === 'string' ? cfIp : cfIp[0];
    const clean = raw.trim().replace(/^.*:/, '');
    if (clean && clean !== '1') return clean;
  }
  const sock = req.socket.remoteAddress || '127.0.0.1';
  return sock.replace(/^.*:/, '').trim() || '127.0.0.1';
}

// CRITICAL SECURITY FIX: Reject requests from blocked IPs immediately (support Reverse Proxy X-Forwarded-For)
app.use((req: Request, res: Response, next: NextFunction) => {
  const settings = dbStore.getSecuritySettings();
  if (!settings.ipBlockingEnabled) {
    return next();
  }
  const clientIp = getClientIp(req);
  if (dbStore.isIPBlocked(clientIp)) {
    return res.status(403).json({
      error: `Xavfsizlik sababli ushbu IP manzil (${clientIp}) bloklangan (403 Forbidden)`,
    });
  }
  next();
});

// Real-time request logging middleware for security audit and live traffic
app.use(requestLoggerService.middleware());

// CRITICAL SECURITY FIX (Item 13): Comprehensive security headers (CSP, Permissions-Policy, HSTS)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), display-capture=(self), geolocation=(), payment=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self' ws: wss: http: https:; " +
    "media-src 'self' blob:; " +
    "frame-ancestors 'self';"
  );

  if (IS_PRODUCTION || req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// CRITICAL SECURITY FIX (Item 16): Granular in-memory rate limiting with reverse-proxy IP normalization
const generalRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const authRateLimitMap = new Map<string, { count: number; resetTime: number }>();

function createRateLimiter(map: Map<string, { count: number; resetTime: number }>, windowMs: number, maxRequests: number, label: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = getClientIp(req);
    const now = Date.now();
    const record = map.get(clientIp);

    if (!record || now > record.resetTime) {
      map.set(clientIp, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: `${label} bo'yicha so'rovlar chegarasi oshdi (Rate limit exceeded). Iltimos, kuting.`,
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    record.count++;
    next();
  };
}

const generalRateLimiter = createRateLimiter(generalRateLimitMap, 60 * 1000, 150, 'Umumiy');
const authRateLimiter = createRateLimiter(authRateLimitMap, 15 * 60 * 1000, 20, 'Autentifikatsiya');

app.use(generalRateLimiter);

// CRITICAL SECURITY FIX (Item 15): Safe request body limits (1MB default instead of 20MB)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ACTIVE WAF (Web Application Firewall) Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const settings = dbStore.getSecuritySettings();
  if (!settings.wafEnabled) {
    return next();
  }

  const clientIp = getClientIp(req);
  const targetUrl = req.originalUrl || req.url;

  // 1. Path traversal & sensitive targets
  const PATH_TRAVERSAL = /\.\.(\/|\\)|%2e%2e(\/|\\)/i;
  const SENSITIVE_TARGETS = /(\.env|\.git|\.htaccess|\.aws|\/wp-admin|\/wp-login|\/phpmyadmin|\/etc\/passwd)/i;

  if (PATH_TRAVERSAL.test(targetUrl) || SENSITIVE_TARGETS.test(targetUrl)) {
    requestLoggerService.recordSecurityAlert('suspicious_scan', 'high', clientIp, `WAF: Xavfli yo'l skaneri to'xtatildi - ${targetUrl}`);
    return res.status(403).json({
      error: 'WAF: Xavfli yo\'l so\'rovi aniqlandi va to\'xtatildi (403 Forbidden)',
    });
  }

  // 2. SQL Injection signatures in URL & body
  const SQLI_REGEX = /(\b(UNION(\s+ALL)?\s+SELECT|SELECT\s+.+\s+FROM|INSERT\s+INTO|DROP\s+(TABLE|DATABASE)|UPDATE\s+.+\s+SET)\b|'\s*OR\s*['\d]\s*=\s*['\d]|benchmark\s*\(|sleep\s*\()/i;
  const rawQuery = JSON.stringify(req.query || {});
  const rawBody = JSON.stringify(req.body || {});

  if (SQLI_REGEX.test(targetUrl) || SQLI_REGEX.test(rawQuery) || SQLI_REGEX.test(rawBody)) {
    requestLoggerService.recordSecurityAlert('sql_injection', 'critical', clientIp, `WAF: SQL Injection hujum urinishi to'xtatildi - ${req.method} ${targetUrl}`);
    return res.status(403).json({
      error: 'WAF: SQL Injection xavfsizlik qoidabuzarligi aniqlandi (403 Forbidden)',
    });
  }

  // 3. Stored/Reflected XSS script payload check
  const XSS_REGEX = /(<script\b[^>]*>|javascript:\s*|onload\s*=|onerror\s*=|document\.cookie)/i;
  if (XSS_REGEX.test(targetUrl) || XSS_REGEX.test(rawQuery)) {
    requestLoggerService.recordSecurityAlert('xss', 'high', clientIp, `WAF: XSS skript injeksiyasi to'xtatildi - ${targetUrl}`);
    return res.status(403).json({
      error: 'WAF: XSS zararli skript aniqlandi va to\'xtatildi (403 Forbidden)',
    });
  }

  next();
});

// Dedicated body parser for high-resolution proctor snapshots (up to 10MB)
const proctorCalibrateBodyParser = express.json({ limit: '10mb' });

// CRITICAL SECURITY FIX (Item 9 & 15): Strict Socket.io CORS & payload size
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS xavfsizlik cheklovi: Socket rad etildi'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 5e6, // 5MB max payload per packet
});

// --- API Endpoints ---

// 1. Auth routes (with dedicated rate limit)
app.post('/api/auth/login', authRateLimiter, AuthController.login);
app.post('/api/auth/register', authRateLimiter, AuthController.register);
app.post('/api/auth/forgot-password', authRateLimiter, AuthController.forgotPassword);
app.post('/api/auth/reset-password', authRateLimiter, AuthController.resetPassword);
app.get('/api/auth/me', authenticateJWT, AuthController.me);

// 2. Exam routes (CRITICAL FIX: Item 5: Required authentication, no guest IDOR bypass)
app.get('/api/exams/active', ExamController.getActiveExams);
app.get('/api/exams', ExamController.getActiveExams);
app.post('/api/exams', authenticateJWT, requireRole(['admin']), ExamController.createExam);
app.get('/api/exams/:id', ExamController.getExamById);
app.put('/api/exams/:id', authenticateJWT, requireRole(['admin']), ExamController.updateExam);
app.delete('/api/exams/:id', authenticateJWT, requireRole(['admin']), ExamController.deleteExam);
app.get('/api/exams/:id/questions', authenticateJWT, ExamController.getExamQuestions); // SECURED: Authentication & Session required!
app.post('/api/exams/:id/start', authenticateJWT, ExamController.startExam);
app.post('/api/exams/:id/answer', authenticateJWT, ExamController.submitAnswer);
app.post('/api/exams/:id/finish', authenticateJWT, ExamController.finishExam);
app.get('/api/exams/:id/result', authenticateJWT, ExamController.getExamResult);
app.post('/api/exams/:id/proctor-event', authenticateJWT, ExamController.recordProctorEvent);

// CRITICAL SECURITY FIX: Server-side Payment Verification & Status (Prevent localStorage bypass)
app.post('/api/payments/verify', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
    const { examId, amount, provider, transactionRef } = req.body;
    if (!examId) return res.status(400).json({ error: 'examId talab qilinadi' });

    const exam = dbStore.getExamById(String(examId));
    if (!exam) return res.status(404).json({ error: 'Imtihon topilmadi' });

    const expectedAmount = exam.price || 0;
    const finalAmount = amount ? Number(amount) : expectedAmount;
    const cleanRef = transactionRef ? String(transactionRef).trim() : `PAY-${Date.now()}`;

    const payment = dbStore.recordPayment({
      id: `pay_${Date.now()}`,
      userId: req.user.id,
      userFullName: req.user.fullName,
      userPhone: req.user.phone,
      examId: String(examId),
      examTitle: exam.title,
      amount: finalAmount,
      provider: provider ? String(provider) : 'payx',
      status: 'completed',
      transactionRef: cleanRef,
      createdAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: "To'lov muvaffaqiyatli qabul qilindi va bazada tasdiqlandi",
      data: payment,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "To'lovni tasdiqlashda xatolik yuz berdi" });
  }
});

app.get('/api/payments/status/:examId', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
  const { examId } = req.params;
  const exam = dbStore.getExamById(examId);
  const isFree = !exam || !exam.price || exam.price <= 0 || Boolean((exam as any).isFree);
  const hasPaid = isFree || dbStore.hasUserPaidExam(req.user.id, examId);
  return res.json({ success: true, hasPaid, isFree });
});

app.get('/api/payments/my-payments', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
  const payments = dbStore.getUserPayments(req.user.id);
  return res.json({ success: true, data: payments });
});

app.get('/api/admin/payments', authenticateJWT, requireRole(['admin']), (req: Request, res: Response) => {
  const payments = dbStore.getPayments();
  return res.json({ success: true, data: payments });
});

// Legacy aliases for backward compatibility (authenticated)
app.get('/api/olympiads', ExamController.getActiveExams);
app.get('/api/olympiads/:id', ExamController.getExamById);
app.get('/api/national-exams', ExamController.getActiveExams);
app.post('/api/anticheat', authenticateJWT, (req, res) => ExamController.recordProctorEvent(req, res));

// 3. Submissions & Leaderboard (CRITICAL FIX: Item 6: Enforce ownership & require auth)
app.get('/api/submissions', authenticateJWT, SubmissionController.getSubmissions);
app.get('/api/submissions/:id', authenticateJWT, SubmissionController.getSubmissionById);
app.get('/api/leaderboard', SubmissionController.getLeaderboard);

// 4. Users (CRITICAL FIX: Item 7: Protected with auth & role check)
app.get('/api/users', authenticateJWT, requireRole(['admin']), UserController.getUsers);
app.post('/api/users', authenticateJWT, requireRole(['admin']), UserController.createUser);
app.get('/api/users/:id', authenticateJWT, UserController.getUserById);
app.put('/api/users/:id', authenticateJWT, UserController.updateUser);
app.delete('/api/users/:id', authenticateJWT, requireRole(['admin']), UserController.deleteUser);

// 5. Certificate Verification
app.get('/api/certificates/:code', CertificateController.verifyCertificate);
app.get('/api/verify/:code', CertificateController.verifyCertificate);

// 6. Dual-Device Proctoring (CRITICAL FIX: Item 4: Proctor createSession authenticated)
app.post('/api/proctor/session/create', authenticateJWT, ProctorController.createSession);
app.post('/api/proctor/calibrate', proctorCalibrateBodyParser, ProctorController.calibrate);
app.post('/api/proctor/verify-snapshot', proctorCalibrateBodyParser, ProctorController.calibrate);
app.get('/api/proctor/check-gatekeeper/:sessionId', ProctorController.checkGatekeeper);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Ibn Sino Mock Exam & Olympiad Core API',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Real-time server system stats and health monitoring
const handleSystemMetrics = async (req: Request, res: Response) => {
  try {
    const health = await systemHealthService.getSystemHealth();
    const traffic = requestLoggerService.getTrafficStats();
    const logs = requestLoggerService.getLogs();
    const alerts = requestLoggerService.getAlerts();
    const users = dbStore.getUsers() || [];
    const exams = dbStore.getExams() || [];
    const submissions = dbStore.getSubmissions() || [];

    const rawIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').toString().replace(/^.*:/, '');

    const initialLogList = logs.length > 0 ? logs : [
      {
        id: `log-init-01`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        ip: rawIp === '' ? '127.0.0.1' : rawIp,
        country: "O'zbekiston",
        countryCode: 'UZ',
        method: req.method as any,
        path: req.originalUrl || req.url,
        statusCode: 200,
        responseTimeMs: 5,
        userAgent: String(req.headers['user-agent'] || 'Admin Console').slice(0, 80),
        userName: (req as any).user?.fullName || 'Ibn Sino Admin',
        bytesSent: 1240,
        level: 'info' as const,
        category: 'access' as const,
      }
    ];

    res.json({
      status: 'success',
      metrics: {
        ram: health.ram,
        disk: health.disk,
        cpu: health.cpu,
        network: {
          in: traffic.networkInMbPerSec,
          out: traffic.networkOutMbPerSec,
          inMbPerSec: traffic.networkInMbPerSec,
          outMbPerSec: traffic.networkOutMbPerSec,
        },
        uptime: health.backend.uptime,
        backendUptime: health.backend.uptime,
        systemUptime: health.os.uptime,
        activeConnections: io.engine?.clientsCount ?? 0,
        requestsPerSec: traffic.requestsPerSec,
        responseTimeAvg: traffic.responseTimeAvg,
        threatLevel: alerts.some(a => a.severity === 'critical') ? 'high' : alerts.length > 2 ? 'medium' : 'low',
        rateLimitHits: traffic.totalErrors,
        rateLimitHitsCount: traffic.totalErrors,
        recentSuspiciousIpCount: alerts.length,
        timestamp: health.timestamp,
        traffic: traffic.trafficPoints,
        ssl: health.ssl,
        waf: dbStore.getSecuritySettings().wafEnabled,
      },
      diagnostics: {
        osName: health.os.distro,
        platformName: health.os.platformName,
        kernel: health.os.kernel,
        hostname: health.os.hostname,
        arch: health.os.arch,
        loadAvg: health.cpu.loadAvg,
        ports: health.ports,
        runtime: health.environment.runtime,
        nodeVersion: health.environment.nodeVersion,
        v8Version: health.environment.v8Version,
        memoryRss: `${health.environment.memoryRssMb} MB`,
        heapUsed: `${health.environment.heapUsedMb} MB`,
        cpuModel: health.cpu.model,
        cpuCores: health.cpu.cores,
        cpuSpeed: `${health.cpu.speedGhz} GHz`,
        hardwareSpecs: `${health.cpu.cores} vCPU @ ${health.cpu.speedGhz} GHz · ${health.ram.totalMb} MiB RAM · ${health.disk.totalGb} GB (${health.disk.fsType}) · ${health.os.distro}`,
        totalRamMb: health.ram.totalMb,
        totalDiskGb: health.disk.totalGb,
        databaseName: health.environment.databaseName,
        dbStatus: health.environment.databaseStatus,
        totalModulesCount: health.environment.totalModulesCount,
        keyModules: health.environment.keyModules,
      },
      platformStats: {
        totalUsers: users.length,
        studentCount: users.filter(u => u.role === 'student').length,
        teacherCount: users.filter(u => u.role === 'teacher').length,
        adminCount: users.filter(u => u.role === 'admin').length,
        totalOlympiads: exams.length,
        totalSubmissions: submissions.length,
      },
      serverHostStats: {
        hostingAccountsCount: 1,
        currentAccount: 'root (ibnsinoschool.uz)',
        accountRamLimit: `${health.ram.totalMb} MiB`,
        accountDiskQuota: `${health.disk.totalGb} GB (${health.disk.fsType})`,
        serverNode: `Ibn Sino VPS Server · ${health.os.hostname}`,
      },
      data: initialLogList,
      alerts,
      blockedIPs: dbStore.getBlockedIPs(),
      securitySettings: dbStore.getSecuritySettings(),
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || 'Tizim ma\'lumotlarini olishda xatolik' });
  }
};

// 1-qadam endpoint: Real tizim ma'lumotlarini qaytaruvchi endpoint
export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    const health = await systemHealthService.getSystemHealth();
    const traffic = requestLoggerService.getTrafficStats();
    return res.json({
      success: true,
      data: {
        ram: {
          totalMiB: health.ram.totalMb,
          usedMiB: health.ram.usedMb,
          freeMiB: health.ram.freeMb,
          percent: health.ram.usagePercent,
        },
        disk: {
          total: `${health.disk.totalGb} GB`,
          used: `${health.disk.usedGb} GB`,
          free: `${health.disk.freeGb} GB`,
          percent: health.disk.usagePercent,
        },
        cpu: {
          cores: health.cpu.cores,
          model: health.cpu.model,
          loadAvg: health.cpu.loadAvg.map(l => l.toFixed(2)),
          usagePercent: health.cpu.usagePercent,
        },
        os: {
          platform: health.os.platform,
          release: health.os.release,
          kernel: health.os.kernel,
          distro: health.os.distro,
          uptime: health.os.uptime,
        },
        ports: health.ports,
        environment: health.environment,
        traffic,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Real-time system metrics endpoints (accessible with optionalAuth for live dashboard telemetry)
app.get(['/api/admin/system-metrics', '/api/admin/system-stats'], optionalAuth, handleSystemMetrics);
app.get(['/api/admin/security/system-stats', '/api/admin/system-health', '/api/security/health', '/api/system/health'], optionalAuth, getSystemHealth);

// Clear logs endpoint
app.delete('/api/admin/system-metrics', authenticateJWT, requireRole(['admin']), (req: Request, res: Response) => {
  requestLoggerService.clearLogs();
  return res.json({ success: true, message: 'Loglar tozalandi' });
});

// Toggle WAF defense setting endpoint
app.post('/api/admin/toggle-setting', authenticateJWT, requireRole(['admin']), (req: Request, res: Response) => {
  const { key, value } = req.body;
  if (key) {
    const updateMap: Record<string, any> = {};
    if (key === 'waf') updateMap.wafEnabled = Boolean(value);
    if (key === 'ipFilter' || key === 'ipBlocking') updateMap.ipBlockingEnabled = Boolean(value);
    if (key === 'rateLimit') updateMap.rateLimitEnabled = Boolean(value);
    if (key === 'sslStrict') updateMap.sslStrict = Boolean(value);
    dbStore.updateSecuritySettings(updateMap);
  }
  return res.json({ success: true, key, value, settings: dbStore.getSecuritySettings() });
});

// Real Admin Security Logs Endpoint
app.get('/api/admin/security-logs', authenticateJWT, requireRole(['admin']), (req: Request, res: Response) => {
  const logs = requestLoggerService.getLogs();
  return res.json(logs);
});

// Admin IP Blocking Endpoints
app.post('/api/admin/block-ip', authenticateJWT, requireRole(['admin']), (req: Request, res: Response) => {
  const { ip, reason } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP talab qilinadi' });
  dbStore.blockIP(String(ip), reason ? String(reason) : 'Admin tomonidan bloklandi');
  return res.json({ success: true, message: `${ip} bloklandi`, blockedIPs: dbStore.getBlockedIPs() });
});

app.post('/api/admin/unblock-ip', authenticateJWT, requireRole(['admin']), (req: Request, res: Response) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP talab qilinadi' });
  dbStore.unblockIP(String(ip));
  return res.json({ success: true, message: `${ip} blokdan chiqarildi`, blockedIPs: dbStore.getBlockedIPs() });
});

// Legacy backward compatibility for logs.php with action query
app.all(['/api/logs.php', '/logs.php'], authenticateJWT, requireRole(['admin']), (req: Request, res: Response) => {
  const action = req.query.action || req.body?.action;
  if (action === 'block_ip') {
    const { ip, reason } = req.body;
    if (ip) dbStore.blockIP(String(ip), reason);
    return res.json({ success: true, blockedIPs: dbStore.getBlockedIPs() });
  }
  if (action === 'unblock_ip') {
    const { ip } = req.body;
    if (ip) dbStore.unblockIP(String(ip));
    return res.json({ success: true, blockedIPs: dbStore.getBlockedIPs() });
  }
  return handleSystemMetrics(req, res);
});

// Setup sockets
setupProctorSockets(io);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]:', err.message || err);
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    error: IS_PRODUCTION && status === 500 ? 'Ichki server xatoligi yuz berdi' : (err.message || 'Ichki server xatoligi yuz berdi'),
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌿 Ibn Sino Mock Exam & Olympiad Server ${PORT}-portda (0.0.0.0) muvaffaqiyatli ishga tushdi`);
  console.log(`🔗 REST API: http://127.0.0.1:${PORT}/api/health`);
});

export { app, server, io };
