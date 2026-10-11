import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import '../config/constants';
import { databasePool, transactionContext, emptyDatabase } from './transactionStore';
import { eventEnabled } from '../security/eventPolicy';
import { estimateRasch, examKind, type ExamKind, type AttemptMode, type RaschConfig, type RaschResult } from '../services/assessment';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ProctoringPresetMode = 'STRICT' | 'STANDARD' | 'RELAXED' | 'DISABLED';

export interface AntiCheatConfig {
  requireDualDevice: boolean;
  enabled: boolean;
  proctoringMode: ProctoringPresetMode;

  requireWebcam: boolean;
  requireMic: boolean;
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

  blockTabSwitch: boolean;
  blockCopyPaste: boolean;
  requireFullscreen: boolean;
  blockDevTools: boolean;

  blockDuplicateIP: boolean;
  heartbeatEnabled: boolean;
  heartbeatIntervalSec: number;

  cameraFaceSnapshotEnabled: boolean;
  snapshotOnMultipleFaces: boolean;
  snapshotOnNoFace: boolean;

  updatedAt?: string;
  updatedBy?: string;
  version?: number;
}

export function getDefaultAntiCheatConfig(overrides?: Partial<AntiCheatConfig>): AntiCheatConfig {
  return {
    enabled: true,
    requireDualDevice: false,
    proctoringMode: 'STANDARD',
    requireWebcam: true,
    requireMic: true,
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
    blockTabSwitch: true,
    blockCopyPaste: true,
    requireFullscreen: true,
    blockDevTools: true,
    blockDuplicateIP: true,
    heartbeatEnabled: true,
    heartbeatIntervalSec: 10,
    cameraFaceSnapshotEnabled: true,
    snapshotOnMultipleFaces: true,
    snapshotOnNoFace: true,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
    version: 1,
    ...overrides,
  };
}

export function validateAntiCheatConfig(body: any): { valid: boolean; errors: string[]; config?: AntiCheatConfig } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, errors: ['Konfiguratsiya obyekti talab qilinadi'] };
  }

  const allowedKeys = new Set([
    'requireDualDevice',
    'enabled',
    'proctoringMode',
    'requireWebcam',
    'requireMic',
    'requireBothEyesVisible',
    'strictFaceCheck',
    'trackGazeDirection',
    'minFaceConfidence',
    'maxAbsenceGracePeriod',
    'maxViolationsAllowed',
    'requireVoiceBiometrics',
    'detectUnknownSpeakers',
    'detectMultipleSpeakers',
    'voiceSimilarityThreshold',
    'blockTabSwitch',
    'blockCopyPaste',
    'requireFullscreen',
    'blockDevTools',
    'blockDuplicateIP',
    'heartbeatEnabled',
    'heartbeatIntervalSec',
    'cameraFaceSnapshotEnabled',
    'snapshotOnMultipleFaces',
    'snapshotOnNoFace',
    'updatedAt',
    'updatedBy',
    'version'
  ]);

  const errors: string[] = [];
  for (const k of Object.keys(body)) {
    if (!allowedKeys.has(k)) {
      errors.push(`Noma'lum maydon qabul qilinmaydi: ${k}`);
    }
  }

  const allowedModes: ProctoringPresetMode[] = ['STRICT', 'STANDARD', 'RELAXED', 'DISABLED'];
  if (!allowedModes.includes(body.proctoringMode)) {
    errors.push(`proctoringMode qiymati STRICT, STANDARD, RELAXED yoki DISABLED bo'lishi shart`);
  }

  const minFaceConfidence = Number(body.minFaceConfidence);
  if (isNaN(minFaceConfidence) || minFaceConfidence < 0.5 || minFaceConfidence > 0.95) {
    errors.push('minFaceConfidence 0.5 va 0.95 oralig\'ida bo\'lishi shart');
  }

  const maxAbsenceGracePeriod = Number(body.maxAbsenceGracePeriod);
  if (isNaN(maxAbsenceGracePeriod) || maxAbsenceGracePeriod < 1 || maxAbsenceGracePeriod > 10) {
    errors.push('maxAbsenceGracePeriod 1 va 10 soniya oralig\'ida bo\'lishi shart');
  }

  const maxViolationsAllowed = Number(body.maxViolationsAllowed);
  if (isNaN(maxViolationsAllowed) || maxViolationsAllowed < 1 || maxViolationsAllowed > 20) {
    errors.push('maxViolationsAllowed 1 va 20 oralig\'ida bo\'lishi shart');
  }

  const voiceSimilarityThreshold = Number(body.voiceSimilarityThreshold);
  if (isNaN(voiceSimilarityThreshold) || voiceSimilarityThreshold < 0.5 || voiceSimilarityThreshold > 0.95) {
    errors.push('voiceSimilarityThreshold 0.5 va 0.95 oralig\'ida bo\'lishi shart');
  }

  const heartbeatIntervalSec = Number(body.heartbeatIntervalSec);
  if (isNaN(heartbeatIntervalSec) || heartbeatIntervalSec < 2 || heartbeatIntervalSec > 60) {
    errors.push('heartbeatIntervalSec 2 va 60 soniya oralig\'ida bo\'lishi shart');
  }

  const booleanKeys = [
    'requireDualDevice',
    'enabled',
    'requireWebcam',
    'requireMic',
    'requireBothEyesVisible',
    'strictFaceCheck',
    'trackGazeDirection',
    'requireVoiceBiometrics',
    'detectUnknownSpeakers',
    'detectMultipleSpeakers',
    'blockTabSwitch',
    'blockCopyPaste',
    'requireFullscreen',
    'blockDevTools',
    'blockDuplicateIP',
    'heartbeatEnabled',
    'cameraFaceSnapshotEnabled',
    'snapshotOnMultipleFaces',
    'snapshotOnNoFace'
  ];

  for (const bk of booleanKeys) {
    if (body[bk] !== undefined && typeof body[bk] !== 'boolean') {
      errors.push(`${bk} parametri mantiqiy (boolean) bo'lishi shart`);
    }
  }

  for (const key of ['requireVoiceBiometrics', 'detectUnknownSpeakers', 'detectMultipleSpeakers']) {
    if (body[key] === true) errors.push(key + ': tekshirilgan audio model ulanmagan; bu funksiya mavjud emas');
  }
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const validated: AntiCheatConfig = {
    requireDualDevice: body.requireDualDevice === true,
    enabled: Boolean(body.enabled),
    proctoringMode: body.proctoringMode,
    requireWebcam: Boolean(body.requireWebcam),
    requireMic: Boolean(body.requireMic),
    requireBothEyesVisible: Boolean(body.requireBothEyesVisible),
    strictFaceCheck: Boolean(body.strictFaceCheck),
    trackGazeDirection: Boolean(body.trackGazeDirection),
    minFaceConfidence: Math.round(minFaceConfidence * 100) / 100,
    maxAbsenceGracePeriod: Math.round(maxAbsenceGracePeriod * 10) / 10,
    maxViolationsAllowed: Math.round(maxViolationsAllowed),
    requireVoiceBiometrics: Boolean(body.requireVoiceBiometrics),
    detectUnknownSpeakers: Boolean(body.detectUnknownSpeakers),
    detectMultipleSpeakers: Boolean(body.detectMultipleSpeakers),
    voiceSimilarityThreshold: Math.round(voiceSimilarityThreshold * 100) / 100,
    blockTabSwitch: Boolean(body.blockTabSwitch),
    blockCopyPaste: Boolean(body.blockCopyPaste),
    requireFullscreen: Boolean(body.requireFullscreen),
    blockDevTools: Boolean(body.blockDevTools),
    blockDuplicateIP: Boolean(body.blockDuplicateIP),
    heartbeatEnabled: Boolean(body.heartbeatEnabled),
    heartbeatIntervalSec: Math.round(heartbeatIntervalSec),
    cameraFaceSnapshotEnabled: Boolean(body.cameraFaceSnapshotEnabled),
    snapshotOnMultipleFaces: Boolean(body.snapshotOnMultipleFaces),
    snapshotOnNoFace: Boolean(body.snapshotOnNoFace),
    updatedAt: new Date().toISOString(),
    updatedBy: String(body.updatedBy || 'admin'),
    version: Number(body.version) || 1,
  };

  return { valid: true, errors: [], config: validated };
}

export function getPublicSafeAntiCheatPolicy(config: AntiCheatConfig) {
  const { updatedAt, updatedBy, version, ...publicSafe } = config;
  if (!config.enabled) {
    return {
      ...publicSafe,
      enabled: false,
      requireDualDevice: false,
      requireWebcam: false,
      requireMic: false,
      requireBothEyesVisible: false,
      strictFaceCheck: false,
      trackGazeDirection: false,
      requireVoiceBiometrics: false,
      detectUnknownSpeakers: false,
      detectMultipleSpeakers: false,
      blockTabSwitch: false,
      blockCopyPaste: false,
      requireFullscreen: false,
      blockDevTools: false,
      heartbeatEnabled: false,
      cameraFaceSnapshotEnabled: false,
      snapshotOnMultipleFaces: false,
      snapshotOnNoFace: false,
    };
  }
  return publicSafe;
}

export interface SecuritySettings {
  wafEnabled: boolean;
  ipBlockingEnabled: boolean;
  rateLimitEnabled: boolean;
  sslStrict: boolean;
  sslExpiry?: string;
  sslValid?: boolean;
}

export interface UserRecord {
  authVersion?: number;
  id: string;
  fullName: string;
  phone: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'teacher' | 'admin';
  grade: number;
  region: string;
  district: string;
  school: string;
  score: number;
  status: string;
  isActive?: boolean;
  createdAt: string;
}

export interface QuestionRecord {
  imageUrl?: string;
  id: string;
  examId: string;
  question_text: string;
  options: Array<{ id: string; text: string; imageUrl?: string }>;
  correct_answer: string; // e.g. 'B' or 'opt-b' - SERVER ONLY!
  points: number;
  orderNum: number;
  explanation: string; // SERVER ONLY until exam finished!
}

export interface ExamRecord {
  kind?: ExamKind;
  practiceEnabled?: boolean;
  sourceYear?: number;
  raschConfig?: RaschConfig | null;
  registeredUserIds?: string[];
  id: string;
  title: string;
  subject: string;
  category: string;
  format: string;
  description: string;
  image: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  price: number;
  status: 'active' | 'upcoming' | 'completed' | 'ochiq' | 'yopiq';
  maxScore: number;
  totalQuestions: number;
  registeredCount: number;
  organizer: string;
  targetGrades?: number[];
  createdAt: string;
  antiCheatConfig?: AntiCheatConfig;
  certificateConfig?: any;
  isPinned?: boolean;
  isAlwaysOpen?: boolean;
  registrationStartDate?: string;
  registrationEndDate?: string;
}

export interface ExamSessionRecord {
  mode?: AttemptMode;
  sessionId: string;
  id?: string;
  userId: string;
  examId: string;
  startedAt: number;
  expiresAt: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'DISQUALIFIED' | 'DISCONNECTED';
  answers: Record<string, string>; // questionId -> selectedOption
  score?: number;
  percentage?: number;
  submittedAt?: string;
  clientIp?: string;
  violationCount?: number;
  lastHeartbeatAt?: number;
  disqualificationReason?: string;
  processedEventIds?: string[];
}

export interface SubmissionRecord {
  sessionId?: string;
  attempt?: string;
  mode?: AttemptMode;
  examKind?: ExamKind;
  rasch?: RaschResult;
  id: string;
  userId: string;
  userName: string;
  examId: string;
  examTitle: string;
  subject: string;
  score: number;
  maxScore: number;
  percentage: number;
  raschTheta: number | null;
  status: 'completed' | 'disqualified';
  timeSpentMinutes: number;
  submittedAt: string;
  certificateType: string;
  verificationCode: string;
  analysis?: any[];
}

export interface ProctorEventRecord {
  id: string;
  eventId?: string;
  sessionId?: string;
  userId: string;
  examId: string;
  eventType: string;
  details: string;
  severity: string;
  timestamp: string;
  ipAddress: string;
}

export interface SnapshotRecord {
  id: string;
  examId: string;
  sessionId: string;
  userId: string;
  eventType: string;
  reason?: string;
  filePath: string;
  fileSize: number;
  sizeBytes?: number;
  mimeType: string;
  createdAt: string;
}

export interface ProctorSessionRecord {
  authVersion?: number;
  primaryJti?: string;
  secondaryJti?: string;
  primarySocketId?: string;
  secondarySocketId?: string;
  pairingHash?: string;
  pairingExpiresAt?: number;
  sessionId: string;
  token: string;
  examId: string;
  studentId: string;
  status: string;
  calibrated: boolean;
  examStartTime: number;
  examEndTime: number;
  lastHeartbeat: number;
}

export interface SupportTicketRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: 'student' | 'teacher' | 'parent';
  userPhone: string;
  userEmail: string;
  subject: string;
  category: 'Olimpiada' | "To'lov" | 'Sertifikat' | 'Texnik muammo' | 'Boshqa';
  priority: 'yuqori' | 'orta' | 'past';
  status: 'yangi' | 'jarayonda' | 'hal_etildi' | 'yopildi';
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    sender: 'user' | 'admin';
    senderName: string;
    text: string;
    timestamp: string;
    attachments?: Array<{ name: string; size: string; type: string }>;
  }>;
}

export interface NotificationLogRecord {
  id: string;
  phone: string;
  userName: string;
  userId?: string;
  type: 'Bildirishnoma' | 'Parol' | 'Tasdiqlash' | 'Xavfsizlik ogohlantirishi' | 'Tranzaksiya' | 'Boshqa';
  message: string;
  region: string;
  status: 'Qabul qilindi' | 'Yuborilmadi' | 'Kutilmoqda';
  error?: string;
  sentAt: string;
  smsCount: number;
}

export interface DatabaseSchema {
  passwordResets?: Record<string, { codeHash: string; expiresAt: number; attempts: number; lastSentAt: number }>;
  users: UserRecord[];
  exams: ExamRecord[];
  questions: QuestionRecord[];
  sessions: ExamSessionRecord[];
  submissions: SubmissionRecord[];
  proctorEvents: ProctorEventRecord[];
  securityBlockedIps: Array<{ ip: string; reason: string; blockedAt: string }>;
  proctorSessions?: ProctorSessionRecord[];
  snapshots?: SnapshotRecord[];
  securitySettings?: SecuritySettings;
  supportTickets?: SupportTicketRecord[];
  notificationLogs?: NotificationLogRecord[];
}

const resolveDataDir = () => {
  if (process.env.DATA_DIR) return path.resolve(process.env.DATA_DIR);
  const candidates = [
    path.resolve(process.cwd(), 'server', 'data'),
    path.resolve(process.cwd(), 'data'),
    path.resolve(__dirname, '..', '..', 'data'),
    path.resolve(__dirname, '..', 'data'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return process.cwd().endsWith('server')
    ? path.resolve(process.cwd(), 'data')
    : path.resolve(process.cwd(), 'server', 'data');
};

const DATA_DIR = resolveDataDir();
const STORE_PATH = path.join(DATA_DIR, 'store.json');

class Store {
  private localData: DatabaseSchema;
  private get data(): DatabaseSchema {
    if (databasePool) {
      const work = transactionContext.getStore();
      if (!work) throw new Error('Database access requires a transaction');
      return work.data;
    }
    return this.localData;
  }

  constructor() {
    this.localData = databasePool ? emptyDatabase() : this.loadData();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    this.ensureDir();
    if (fs.existsSync(STORE_PATH)) {
      try {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const data: DatabaseSchema = JSON.parse(raw);
        if (!Array.isArray(data.proctorSessions)) {
          data.proctorSessions = [];
        }
        if (!Array.isArray(data.securityBlockedIps)) {
          data.securityBlockedIps = [];
        } else {
          // Prevent local reverse-proxy IP from ever being permanently locked
          data.securityBlockedIps = data.securityBlockedIps.filter(
            item => !['127.0.0.1', '::1', 'localhost', '0.0.0.0'].includes(item.ip.trim())
          );
        }
        if (!Array.isArray(data.snapshots)) {
          data.snapshots = [];
        }
        if (!Array.isArray(data.supportTickets)) data.supportTickets = [];
        if (!Array.isArray(data.notificationLogs)) data.notificationLogs = [];
        if (!data.securitySettings) {
          data.securitySettings = {
            wafEnabled: true,
            ipBlockingEnabled: true,
            rateLimitEnabled: true,
            sslStrict: true,
            sslValid: true,
            sslExpiry: '2026-12-31',
          };
        }
        
        // Auto-sanitize leaked passwords and real PII if present in store.json (Item 9)
        const KNOWN_INSECURE_HASHES = [
          '$2a$10$w0AKUQrXpxOSaPhvDSOf4OJ9vfiofDNDFIg0mWJVb92siLkI.XDx6',
          '$2a$10$hddDD4.o4fXH4shoJQVDJuZcNBFOlxc3wdT0HDfbOK.r/kuHHCpFC',
          '$2a$10$TWbn8ZC9Pxt9JCnsMEFAgO1cqLsBrjp7/S1p3P/8Hp9te.6/Uw5Ju',
          '$2a$10$5NC2i1zx2wAsTrRQHLRZuu6Aizq7GaRxvNtA31BZGF79MUvbrBSRS',
        ];
        const newAdminHash = bcrypt.hashSync(process.env.INITIAL_ADMIN_PASSWORD || (crypto.randomBytes(16).toString('hex') + 'A1!'), 10);
        const newStudentHash = bcrypt.hashSync(process.env.INITIAL_STUDENT_PASSWORD || (crypto.randomBytes(16).toString('hex') + 'S1!'), 10);

        let modified = false;
        if (Array.isArray(data.users)) {
          data.users = data.users.filter(u => {
            // Remove real student PII from repo data
            if (u.email === 'aoolimov68@gmail.com') {
              modified = true;
              return false;
            }
            return true;
          });

          for (const u of data.users) {
            if (KNOWN_INSECURE_HASHES.includes(u.passwordHash)) {
              u.passwordHash = u.role === 'admin' ? newAdminHash : newStudentHash;
              modified = true;
            }
          }
        }

        if (modified) {
          this.saveData(data);
        }

        return data;
      } catch (e) {
        console.error('Error reading store.json, falling back to initial data:', e);
      }
    }
    const EXAMPLE_PATH = process.env.NODE_ENV === 'test' ? '' : path.resolve(__dirname, '../../data/store.example.json');
    if (fs.existsSync(EXAMPLE_PATH)) {
      try {
        const raw = fs.readFileSync(EXAMPLE_PATH, 'utf-8');
        const data: DatabaseSchema = JSON.parse(raw);
        // Ensure example users do not use hardcoded insecure passwords
        const newAdminHash = bcrypt.hashSync(process.env.INITIAL_ADMIN_PASSWORD || (crypto.randomBytes(16).toString('hex') + 'A1!'), 10);
        const newStudentHash = bcrypt.hashSync(process.env.INITIAL_STUDENT_PASSWORD || (crypto.randomBytes(16).toString('hex') + 'S1!'), 10);
        if (Array.isArray(data.users)) {
          for (const u of data.users) {
            u.passwordHash = u.role === 'admin' ? newAdminHash : newStudentHash;
          }
        }
        this.saveData(data);
        return data;
      } catch {}
    }
    const initial = this.createInitialData();
    this.saveData(initial);
    return initial;
  }

  public saveData(dataToSave?: DatabaseSchema) {
    if (databasePool) {
      const work = transactionContext.getStore();
      if (!work) throw new Error('Database write requires a transaction');
      if (dataToSave) work.data = dataToSave;
      work.dirty = true;
      return;
    }
    this.ensureDir();
    const data = dataToSave || this.data;
    const tempPath = `${STORE_PATH}.tmp.${process.pid}.${Date.now()}`;
    try {
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, STORE_PATH);
    } catch (err) {
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch {}
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    }
  }

  private createInitialData(): DatabaseSchema {
    const adminPass = process.env.INITIAL_ADMIN_PASSWORD || (crypto.randomBytes(10).toString('hex') + 'A1!');
    const studentPass = process.env.INITIAL_STUDENT_PASSWORD || (crypto.randomBytes(10).toString('hex') + 'S1!');
    if (!process.env.INITIAL_ADMIN_PASSWORD) {
      console.warn('[SECURITY] Initial admin created with secure password. Set INITIAL_ADMIN_PASSWORD in .env for custom configuration.');
    }
    const adminPassHash = bcrypt.hashSync(adminPass, 12);
    const studentPassHash = bcrypt.hashSync(studentPass, 12);

    const users: UserRecord[] = [
      {
        id: 'usr-admin-01',
        fullName: 'Ibn Sino Bosh Admin',
        phone: '+998901112233',
        email: 'admin@ibnsino.uz',
        passwordHash: adminPassHash,
        role: 'admin',
        grade: 11,
        region: 'Toshkent shahri',
        district: 'Mirobod tumani',
        school: 'Ibn Sino Akademik Markazi',
        score: 100,
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-student-01',
        fullName: 'Azizbek Rahmonov',
        phone: '+998901234567',
        email: 'azizbek@ibnsino.uz',
        passwordHash: studentPassHash,
        role: 'student',
        grade: 10,
        region: 'Samarqand viloyati',
        district: 'Samarqand shahar',
        school: '1-sonli Ixtisoslashtirilgan Maktab',
        score: 84,
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-student-02',
        fullName: 'Mohira Karimova',
        phone: '+998912345678',
        email: 'mohira@ibnsino.uz',
        passwordHash: studentPassHash,
        role: 'student',
        grade: 11,
        region: 'Buxoro viloyati',
        district: 'G\'ijduvon tumani',
        school: 'Prezident Maktabi',
        score: 92,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
    ];

    const exams: ExamRecord[] = [
      {
        id: 'IBN-MED-101',
        title: 'Ibn Sino Nomidagi Tibbiyot va Fiziologiya Olimpiadasi',
        subject: 'Biologiya va Tibbiyot',
        category: 'biology',
        format: 'online',
        description: 'Inson anatomiyasi, biokimyo va Ibn Sino tibbiy merosi bo\'yicha saralash bosqichi.',
        image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 7).toISOString(),
        durationMinutes: 60,
        price: 0,
        status: 'active',
        maxScore: 100,
        totalQuestions: 10,
        registeredCount: 0,
        organizer: 'Ibn Sino Ilmiy Akademiyasi',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'IBN-MATH-102',
        title: 'Abu Ali ibn Sino Aniq Fanlar: Matematika & Mantiq',
        subject: 'Matematika',
        category: 'math',
        format: 'online',
        description: 'Yuqori sinf o\'quvchilari uchun mantiqiy, geometrik va algebraik masalalar kompleksi.',
        image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 10).toISOString(),
        durationMinutes: 60,
        price: 0,
        status: 'active',
        maxScore: 100,
        totalQuestions: 10,
        registeredCount: 0,
        organizer: 'Ibn Sino Fondi',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'IBN-CHEM-103',
        title: 'Ibn Sino Farmatsevtika va Kimyo Milliy Imtihoni',
        subject: 'Kimyo',
        category: 'chemistry',
        format: 'online',
        description: 'Organik kimyo, dori vositalari sintezi va molekulyar biologiya nazariyasi.',
        image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 5).toISOString(),
        durationMinutes: 45,
        price: 0,
        status: 'active',
        maxScore: 100,
        totalQuestions: 10,
        registeredCount: 0,
        organizer: 'O\'zbekiston Kimyogarlar Jamiyati',
        createdAt: new Date().toISOString(),
      }
    ];

    const questions: QuestionRecord[] = [
      // MED-101 questions
      {
        id: 'q-med-01',
        examId: 'IBN-MED-101',
        question_text: 'Abu Ali ibn Sino o\'zining "Tib qonunlari" asarida inson qon aylanishining dastlabki belgilarini qaysi a\'zo orqali tushuntirgan?',
        options: [
          { id: 'A', text: 'Yurak va tomirlarning puls urishi' },
          { id: 'B', text: 'Jigar va o\'t pufagi' },
          { id: 'C', text: 'Miya va asab tolalari' },
          { id: 'D', text: 'Buyrak va taloq' }
        ],
        correct_answer: 'A',
        points: 10,
        orderNum: 1,
        explanation: 'Ibn Sino puls orqali inson tanasining umumiy holatini va yurak-qon tomir faoliyatini aniqlashning 10 ta asosiy mezonini kashf qilgan.'
      },
      {
        id: 'q-med-02',
        examId: 'IBN-MED-101',
        question_text: 'Inson organizmida eritrotsitlar (qizil qon tanachalari) qayerda hosil bo\'ladi?',
        options: [
          { id: 'A', text: 'Jigarda' },
          { id: 'B', text: 'Qizil ilikda (suyak ko\'migi)' },
          { id: 'C', text: 'Taloqda' },
          { id: 'D', text: 'Ayrisimon bezda' }
        ],
        correct_answer: 'B',
        points: 10,
        orderNum: 2,
        explanation: 'Eritropoez jarayoni asosan qizil suyak ko\'migida sodir bo\'ladi va eritropoetin gormoni orqali boshqariladi.'
      },
      {
        id: 'q-med-03',
        examId: 'IBN-MED-101',
        question_text: 'Quyidagi qaysi vitamin qon ivishi jarayonida (protrombin sintezida) hal qiluvchi rol o\'ynaydi?',
        options: [
          { id: 'A', text: 'Vitamin C' },
          { id: 'B', text: 'Vitamin K' },
          { id: 'C', text: 'Vitamin D' },
          { id: 'D', text: 'Vitamin B12' }
        ],
        correct_answer: 'B',
        points: 10,
        orderNum: 3,
        explanation: 'Vitamin K jigarda qon ivish omillari (jumladan protrombin) sintezi uchun zarurdir.'
      },
      {
        id: 'q-med-04',
        examId: 'IBN-MED-101',
        question_text: 'Mitoz bo\'linishining qaysi fazasida xromosomalar ekvator tekisligida tiziladi?',
        options: [
          { id: 'A', text: 'Profaza' },
          { id: 'B', text: 'Metafaza' },
          { id: 'C', text: 'Anafaza' },
          { id: 'D', text: 'Telofaza' }
        ],
        correct_answer: 'B',
        points: 10,
        orderNum: 4,
        explanation: 'Metafaza bosqichida xromosomalar hujayra markazida ekvatorial plastinkani hosil qiladi.'
      },
      {
        id: 'q-med-05',
        examId: 'IBN-MED-101',
        question_text: 'Neyronlar orasidagi kimyoviy signallarni uzatuvchi oraliq bo\'shliq nima deb ataladi?',
        options: [
          { id: 'A', text: 'Akson' },
          { id: 'B', text: 'Sinaps' },
          { id: 'C', text: 'Dendrit' },
          { id: 'D', text: 'Miyelin qobiq' }
        ],
        correct_answer: 'B',
        points: 10,
        orderNum: 5,
        explanation: 'Sinaps — neyronlar yoki neyron va ta\'sir qiluvchi a\'zo orasidagi mediatorlar orqali impuls o\'tkazuvchi bog\'lanishdir.'
      },

      // MATH-102 questions
      {
        id: 'q-math-01',
        examId: 'IBN-MATH-102',
        question_text: 'Agar f(x) = 3x^2 - 4x + 5 bo\'lsa, f\'(2) hosilaning qiymatini toping.',
        options: [
          { id: 'A', text: '6' },
          { id: 'B', text: '8' },
          { id: 'C', text: '10' },
          { id: 'D', text: '12' }
        ],
        correct_answer: 'B',
        points: 10,
        orderNum: 1,
        explanation: 'f\'(x) = 6x - 4. x = 2 bo\'lganda: 6*(2) - 4 = 12 - 4 = 8.'
      },
      {
        id: 'q-math-02',
        examId: 'IBN-MATH-102',
        question_text: 'To\'g\'ri burchakli uchburchakning katetlari 5 sm va 12 sm bo\'lsa, gipotenuzasini toping.',
        options: [
          { id: 'A', text: '13 sm' },
          { id: 'B', text: '14 sm' },
          { id: 'C', text: '15 sm' },
          { id: 'D', text: '17 sm' }
        ],
        correct_answer: 'A',
        points: 10,
        orderNum: 2,
        explanation: 'c = sqrt(5^2 + 12^2) = sqrt(25 + 144) = sqrt(169) = 13 sm.'
      },
      {
        id: 'q-math-03',
        examId: 'IBN-MATH-102',
        question_text: 'Tenglamani yeching: 2^(x+1) + 2^x = 48.',
        options: [
          { id: 'A', text: 'x = 3' },
          { id: 'B', text: 'x = 4' },
          { id: 'C', text: 'x = 5' },
          { id: 'D', text: 'x = 6' }
        ],
        correct_answer: 'B',
        points: 10,
        orderNum: 3,
        explanation: '2*2^x + 2^x = 3*2^x = 48 => 2^x = 16 => x = 4.'
      },
      {
        id: 'q-math-04',
        examId: 'IBN-MATH-102',
        question_text: 'Quyidagi logarifmik ifodaning qiymatini hisoblang: log_2(32) + log_3(81).',
        options: [
          { id: 'A', text: '7' },
          { id: 'B', text: '8' },
          { id: 'C', text: '9' },
          { id: 'D', text: '10' }
        ],
        correct_answer: 'C',
        points: 10,
        orderNum: 4,
        explanation: 'log_2(32) = 5, log_3(81) = 4. 5 + 4 = 9.'
      },
      {
        id: 'q-math-05',
        examId: 'IBN-MATH-102',
        question_text: 'Arifmetik progressiyaning a_1 = 3, d = 4 bo\'lsa, uning dastlabki 10 ta hadi yig\'indisi (S_10) ni toping.',
        options: [
          { id: 'A', text: '190' },
          { id: 'B', text: '210' },
          { id: 'C', text: '230' },
          { id: 'D', text: '250' }
        ],
        correct_answer: 'B',
        points: 10,
        orderNum: 5,
        explanation: 'S_n = (n/2) * (2a_1 + (n-1)d) = 5 * (6 + 36) = 5 * 42 = 210.'
      }
    ];

    const submissions: SubmissionRecord[] = [
      {
        id: 'sub-sample-01',
        userId: 'usr-student-02',
        userName: 'Mohira Karimova',
        examId: 'IBN-MED-101',
        examTitle: 'Ibn Sino Nomidagi Tibbiyot va Fiziologiya Olimpiadasi',
        subject: 'Biologiya va Tibbiyot',
        score: 90,
        maxScore: 100,
        percentage: 90,
        raschTheta: 2.2,
        status: 'completed',
        timeSpentMinutes: 38,
        submittedAt: new Date(Date.now() - 7200000).toISOString(),
        certificateType: 'I darajali Diplom',
        verificationCode: 'IS-2026-MED-8921',
      }
    ];

    return {
      users,
      exams,
      questions,
      sessions: [],
      submissions,
      proctorEvents: [],
      securityBlockedIps: [],
      proctorSessions: [],
    };
  }

  // --- Exam & Questions ---
  public getPasswordReset(email: string) { return this.data.passwordResets?.[email]; }
  public setPasswordReset(email: string, value: NonNullable<DatabaseSchema['passwordResets']>[string]) {
    (this.data.passwordResets ??= {})[email] = value;
    this.saveData();
  }
  public deletePasswordReset(email: string) {
    if (this.data.passwordResets) delete this.data.passwordResets[email];
    this.saveData();
  }
  public getExams(): ExamRecord[] {
    return this.data.exams;
  }

  public getExamById(id: string): ExamRecord | undefined {
    return this.data.exams.find(e => e.id === id || e.id.toLowerCase() === id.toLowerCase());
  }

  /**
   * CRITICAL SECURITY REQUIREMENT:
   * Returns question items with stripped correct_answer and explanation!
   * The client only receives the question text and options!
   */
  public getSanitizedQuestions(examId: string) {
    const list = this.data.questions.filter(q => q.examId === examId || examId === 'all');
    return list.map(q => ({
      id: q.id,
      examId: q.examId,
      question_text: q.question_text,
      content: q.question_text,
      imageUrl: q.imageUrl,
      options: q.options,
      points: q.points,
      orderNum: q.orderNum,
    }));
  }

  public getRawQuestions(examId: string): QuestionRecord[] {
    return this.data.questions.filter(q => q.examId === examId || examId === 'all');
  }

  public saveExam(exam: ExamRecord) {
    const idx = this.data.exams.findIndex(e => e.id === exam.id);
    if (idx >= 0) {
      this.data.exams[idx] = exam;
    } else {
      this.data.exams.unshift(exam);
    }
    this.saveData();
  }

  public deleteExam(id: string) {
    this.data.exams = this.data.exams.filter(e => e.id !== id);
    this.data.questions = this.data.questions.filter(q => q.examId !== id);
    this.saveData();
  }

  public saveQuestions(examId: string, questions: QuestionRecord[]) {
    for (const q of questions) {
      if (!q.correct_answer || String(q.correct_answer).trim() === '') {
        throw new Error(`Savol (${q.question_text || q.id}) uchun to'g'ri javob kiritilishi shart`);
      }
      if (Array.isArray(q.options) && q.options.length > 0) {
        const cleanCorrect = String(q.correct_answer).trim().toUpperCase();
        const optionIds = q.options.map(o => String(o.id).trim().toUpperCase());
        const optionTexts = q.options.map(o => String(o.text).trim().toUpperCase());
        const isValid = optionIds.includes(cleanCorrect) || optionTexts.includes(cleanCorrect);
        if (!isValid) {
          throw new Error(`To'g'ri javob (${q.correct_answer}) mavjud variantlar orasida topilmadi`);
        }
      }
    }
    this.data.questions = this.data.questions.filter(q => q.examId !== examId);
    this.data.questions.push(...questions);
    this.saveData();
  }

  // --- Sessions & Server-Side Grading ---
  public startSession(userId: string, examId: string, durationMinutes: number = 60, clientIp?: string): ExamSessionRecord {
    const sessionId = `sess_${userId}_${examId}_${Date.now()}`;
    const now = Date.now();
    const expiresAt = now + durationMinutes * 60 * 1000;

    const session: ExamSessionRecord = {
      sessionId,
      userId,
      examId,
      startedAt: now,
      expiresAt,
      status: 'IN_PROGRESS',
      answers: {},
      clientIp,
      violationCount: 0,
      lastHeartbeatAt: now,
      processedEventIds: [],
    };

    this.data.sessions.push(session);
    this.saveData();
    return session;
  }

  public createSessionAtomic(
    session: ExamSessionRecord,
    policy: AntiCheatConfig
  ): { success: boolean; session?: ExamSessionRecord; error?: string; code?: string } {
    const now = Date.now();

    // 1. Single IP check
    if (policy.enabled && policy.blockDuplicateIP && session.clientIp) {
      if (this.hasActiveSessionForIP(session.examId, session.clientIp, session.userId)) {
        return {
          success: false,
          code: 'SINGLE_IP_VIOLATION',
          error: 'Bitta IP manzildan bir vaqtning o‘zida faqat bitta faol imtihon sessiyasiga ruxsat beriladi',
        };
      }
    }

    // 2. Existing active session check for this user
    const existing = this.data.sessions.find(
      s => s.examId === session.examId && s.userId === session.userId && (s.mode ?? 'competitive') === (session.mode ?? 'competitive') && ['IN_PROGRESS', 'DISCONNECTED'].includes(s.status) && (typeof s.expiresAt === 'number' ? now < s.expiresAt : new Date(s.expiresAt).getTime() > now)
    );
    if (existing) {
      return {
        success: false,
        code: 'ACTIVE_SESSION_EXISTS',
        error: 'Sizda ushbu imtihon uchun allaqachon faol sessiya mavjud',
      };
    }

    this.data.sessions.push(session);
    this.saveData();
    return { success: true, session };
  }

  public getSession(sessionId: string): ExamSessionRecord | undefined {
    return this.data.sessions.find(s => s.sessionId === sessionId);
  }

  public addSession(session: ExamSessionRecord): void {
    const existingIdx = this.data.sessions.findIndex(s => s.sessionId === session.sessionId);
    if (existingIdx >= 0) {
      this.data.sessions[existingIdx] = session;
    } else {
      this.data.sessions.push(session);
    }
    this.saveData();
  }

  public getSessions(): ExamSessionRecord[] {
    return this.data.sessions;
  }

  public getActiveSession(userId: string, examId: string, mode: AttemptMode = 'competitive'): ExamSessionRecord | undefined {
    return this.data.sessions.find(s => s.userId === userId && s.examId === examId && (s.mode ?? 'competitive') === mode && ['IN_PROGRESS', 'DISCONNECTED'].includes(s.status));
  }

  public recordAnswer(sessionId: string, questionId: string, selectedOption: string): { success: boolean; error?: string } {
    const session = this.getSession(sessionId);
    if (!session) return { success: false, error: 'Sessiya topilmadi' };
    if (session.status !== 'IN_PROGRESS') return { success: false, error: 'Imtihon faol holatda emas' };

    if (Date.now() > session.expiresAt) {
      return { success: false, error: 'Imtihon vaqti tugadi' };
    }

    const question = this.getRawQuestions(session.examId).find(q => q.id === questionId);
    if (!question) return { success: false, error: 'Savol ushbu imtihonga tegishli emas' };
    if (typeof selectedOption !== 'string' || selectedOption.length > 10000) {
      return { success: false, error: 'Javob formati yoki uzunligi noto‘g‘ri' };
    }
    if (question.options?.length && !question.options.some(option => option.id === selectedOption)) {
      return { success: false, error: 'Bunday javob varianti mavjud emas' };
    }
    session.answers[questionId] = selectedOption;
    this.saveData();
    return { success: true };
  }

  /**
   * SERVER-SIDE GRADING LOGIC:
   * Pure server evaluation comparing against hidden correct answers.
   */
  public finishAndGradeExam(sessionId: string): SubmissionRecord | null {
    const session = this.getSession(sessionId);
    if (!session) return null;
    const existing = this.getSubmissionBySession(sessionId);
    if (existing) return existing;
    if (!['IN_PROGRESS', 'DISCONNECTED'].includes(session.status)) return null;

    session.status = 'COMPLETED';
    session.submittedAt = new Date().toISOString();

    const questions = this.getRawQuestions(session.examId);
    const exam = this.getExamById(session.examId);
    const user = this.getUserById(session.userId);

    let calculatedScore = 0;
    let maxCalculatedScore = 0;
    let correctCount = 0;

    const analysis = questions.map((q, idx) => {
      const userAns = session.answers[q.id] || '';
      const points = q.points || 10;
      maxCalculatedScore += points;

      const cleanUser = String(userAns).trim().toUpperCase();
      const cleanCorrect = String(q.correct_answer).trim().toUpperCase();
      const isCorrect = Boolean(cleanUser && (cleanUser === cleanCorrect || cleanUser.replace('OPTION_', '') === cleanCorrect));

      if (isCorrect) {
        calculatedScore += points;
        correctCount++;
      }

      return {
        questionId: q.id,
        questionNum: idx + 1,
        questionText: q.question_text,
        userAnswer: userAns,
        correctAnswer: q.correct_answer,
        isCorrect,
        points: isCorrect ? points : 0,
        explanation: q.explanation,
      };
    });

    const maxScore = maxCalculatedScore > 0 ? maxCalculatedScore : (questions.length * 10);
    const percentage = maxScore > 0 ? Math.round((calculatedScore / maxScore) * 100) : 0;
    
    const kind = exam ? examKind(exam) : 'olympiad';
    const mode = session.mode ?? 'competitive';
    const rasch = kind === 'national_certificate' ? estimateRasch(analysis, exam?.raschConfig) : undefined;
    const certificateEligible = kind === 'olympiad' && mode === 'competitive';

    const elapsedMs = Math.min(Date.now() - session.startedAt, (exam?.durationMinutes || 60) * 60000);
    const timeSpentMinutes = Math.max(1, Math.round(elapsedMs / 60000));

    const certType = percentage >= 85 ? 'I darajali Diplom' : percentage >= 70 ? 'II darajali Diplom' : percentage >= 50 ? 'III darajali Diplom' : 'Ishtirokchi Sertifikati';
    // Item 24: High-entropy verification code to prevent enumeration
    const subToken = crypto.randomBytes(16).toString('hex').toUpperCase();
    const verificationCode = `IS-${new Date().getUTCFullYear()}-${subToken}`;

    const submission: SubmissionRecord = {
      id: `sub_${session.sessionId}`,
      sessionId: session.sessionId,
      attempt: mode === 'practice' ? session.sessionId : '1',
      mode,
      examKind: kind,
      rasch,
      userId: session.userId,
      userName: user?.fullName || 'Ishtirokchi',
      examId: session.examId,
      examTitle: exam?.title || 'Ibn Sino Olimpiadasi',
      subject: exam?.subject || 'Tibbiyot',
      score: calculatedScore,
      maxScore,
      percentage,
      raschTheta: rasch?.theta ?? null,
      status: 'completed',
      timeSpentMinutes,
      submittedAt: session.submittedAt,
      certificateType: certificateEligible ? certType : '',
      verificationCode: certificateEligible ? verificationCode : '',
      analysis,
    };

    session.score = calculatedScore;
    session.percentage = percentage;

    this.data.submissions.unshift(submission);

    // Update user personal highest score
    if (user && certificateEligible) {
      user.score = Math.max(user.score, calculatedScore);
    }

    this.saveData();
    return submission;
  }

  public getSubmissionBySession(sessionId: string): SubmissionRecord | undefined {
    const session = this.getSession(sessionId);
    if (!session) return undefined;
    return this.data.submissions.find(s => s.sessionId === sessionId || (!s.sessionId && !s.attempt &&
      s.userId === session.userId && s.examId === session.examId && (session.mode ?? 'competitive') === 'competitive'));
  }

  public getSubmissions(userId?: string): SubmissionRecord[] {
    if (userId) {
      return this.data.submissions.filter(s => s.userId === userId);
    }
    return this.data.submissions;
  }

  public getSupportTickets(userId?: string): SupportTicketRecord[] {
    const tickets = this.data.supportTickets ?? [];
    return userId ? tickets.filter(ticket => ticket.userId === userId) : tickets;
  }

  public createSupportTicket(ticket: SupportTicketRecord): SupportTicketRecord {
    (this.data.supportTickets ??= []).unshift(ticket);
    this.saveData();
    return ticket;
  }

  public updateSupportTicket(ticketId: string, updater: (ticket: SupportTicketRecord) => void): SupportTicketRecord | undefined {
    const ticket = (this.data.supportTickets ?? []).find(item => item.id === ticketId);
    if (!ticket) return undefined;
    updater(ticket);
    ticket.updatedAt = new Date().toISOString();
    this.saveData();
    return ticket;
  }

  public deleteSupportTicket(ticketId: string): boolean {
    const tickets = this.data.supportTickets ?? [];
    const before = tickets.length;
    this.data.supportTickets = tickets.filter(ticket => ticket.id !== ticketId);
    if (this.data.supportTickets.length !== before) this.saveData();
    return this.data.supportTickets.length !== before;
  }

  public getNotificationLogs(): NotificationLogRecord[] {
    return this.data.notificationLogs ?? [];
  }

  public addNotificationLog(log: NotificationLogRecord): NotificationLogRecord {
    (this.data.notificationLogs ??= []).unshift(log);
    if (this.data.notificationLogs.length > 5000) this.data.notificationLogs.length = 5000;
    this.saveData();
    return log;
  }

  public deleteNotificationLog(id: string): boolean {
    const logs = this.data.notificationLogs ?? [];
    const before = logs.length;
    this.data.notificationLogs = logs.filter(log => log.id !== id);
    if (this.data.notificationLogs.length !== before) this.saveData();
    return this.data.notificationLogs.length !== before;
  }

  public verifyCertificateByCode(code: string): SubmissionRecord | undefined {
    if (!code) return undefined;
    const clean = code.trim().toLowerCase();
    return this.data.submissions.find(s => s.verificationCode && s.verificationCode.trim().toLowerCase() === clean);
  }

  // --- Users ---
  public getUsers(): UserRecord[] {
    return this.data.users;
  }

  public getUserById(id: string): UserRecord | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmailOrPhone(identifier: string): UserRecord | undefined {
    const clean = identifier.toLowerCase().trim();
    const cleanPhone = identifier.replace(/\D/g, '');
    return this.data.users.find(u => 
      u.email.toLowerCase() === clean || 
      (cleanPhone && u.phone.replace(/\D/g, '') === cleanPhone)
    );
  }

  public createUser(user: UserRecord): { success: boolean; error?: string; user?: UserRecord } {
    const existing = this.getUserByEmailOrPhone(user.email) || (user.phone ? this.getUserByEmailOrPhone(user.phone) : null);
    if (existing) {
      return { success: false, error: 'Ushbu email yoki telefon raqami bilan foydalanuvchi allaqachon mavjud' };
    }
    this.data.users.unshift(user);
    this.saveData();
    return { success: true, user };
  }

  public updateUser(id: string, updates: Partial<UserRecord>): UserRecord | null {
    const user = this.getUserById(id);
    if (!user) return null;
    Object.assign(user, updates);
    this.saveData();
    return user;
  }

  public deleteUser(id: string): boolean {
    const len = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.saveData();
    return this.data.users.length < len;
  }

  // --- Proctor Events & Security ---
  public addProctorEvent(event: ProctorEventRecord) {
    this.data.proctorEvents.unshift(event);
    if (this.data.proctorEvents.length > 500) {
      this.data.proctorEvents = this.data.proctorEvents.slice(0, 500);
    }
    this.saveData();
  }

  public getProctorEvents(examId?: string): ProctorEventRecord[] {
    if (examId) {
      return this.data.proctorEvents.filter(e => e.examId === examId);
    }
    return this.data.proctorEvents;
  }

  public adminDisqualifySession(sessionId: string, reason: string, adminName: string): ExamSessionRecord | undefined {
    const session = this.getSession(sessionId);
    if (!session) return undefined;
    session.status = 'DISQUALIFIED';
    session.disqualificationReason = `Admin (${adminName}): ${reason.slice(0, 500)}`;
    this.addProctorEvent({ id: `prc_admin_${crypto.randomBytes(8).toString('hex')}`, sessionId, userId: session.userId,
      examId: session.examId, eventType: 'ADMIN_DISQUALIFY', details: session.disqualificationReason, severity: 'critical',
      timestamp: new Date().toISOString(), ipAddress: session.clientIp || 'server' });
    this.saveData();
    return session;
  }

  // --- Proctor Session Persistence (Item 9) ---
  public saveProctorSession(session: ProctorSessionRecord): void {
    if (!this.data.proctorSessions) {
      this.data.proctorSessions = [];
    }
    const idx = this.data.proctorSessions.findIndex(s => s.sessionId === session.sessionId);
    if (idx >= 0) {
      this.data.proctorSessions[idx] = { ...session };
    } else {
      this.data.proctorSessions.push({ ...session });
    }
    this.saveData();
  }

  public getProctorSession(sessionId: string): ProctorSessionRecord | undefined {
    if (!this.data.proctorSessions) return undefined;
    return this.data.proctorSessions.find(s => s.sessionId === sessionId);
  }

  public getAllProctorSessions(): ProctorSessionRecord[] {
    if (!this.data.proctorSessions) return [];
    return this.data.proctorSessions;
  }

  public deleteProctorSession(id: string): void {
    this.data.proctorSessions = (this.data.proctorSessions ?? []).filter(s => s.sessionId !== id);
    this.saveData();
  }

  // --- IP Blocking & Threat Management ---
  public getBlockedIPs(): Array<{ ip: string; reason: string; blockedAt: string }> {
    if (!this.data.securityBlockedIps) {
      this.data.securityBlockedIps = [];
    }
    return this.data.securityBlockedIps;
  }

  public blockIP(ip: string, reason?: string): boolean {
    if (!this.data.securityBlockedIps) {
      this.data.securityBlockedIps = [];
    }
    const cleanIp = ip.trim();
    if (!cleanIp) return false;
    const exists = this.data.securityBlockedIps.some(item => item.ip === cleanIp);
    if (!exists) {
      this.data.securityBlockedIps.unshift({
        ip: cleanIp,
        reason: reason || 'Xavfsizlik qoidabuzarligi',
        blockedAt: new Date().toISOString(),
      });
      this.saveData();
    }
    return true;
  }

  public unblockIP(ip: string): boolean {
    if (!this.data.securityBlockedIps) return false;
    const cleanIp = ip.trim();
    const prevLen = this.data.securityBlockedIps.length;
    this.data.securityBlockedIps = this.data.securityBlockedIps.filter(item => item.ip !== cleanIp);
    if (this.data.securityBlockedIps.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  public isIPBlocked(ip: string): boolean {
    if (!this.data.securityBlockedIps || !ip) return false;
    const cleanIp = ip.replace(/^.*:/, '').trim();
    if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost' || cleanIp === '0.0.0.0') {
      return false;
    }
    return this.data.securityBlockedIps.some(item => item.ip === cleanIp || item.ip === ip.trim());
  }

  // --- AntiCheat Policy Management ---
  public getExamAntiCheatConfig(examId: string): AntiCheatConfig {
    const exam = this.getExamById(examId);
    if (exam && exam.antiCheatConfig) {
      const validated = validateAntiCheatConfig({ ...exam.antiCheatConfig,
        requireVoiceBiometrics: false, detectUnknownSpeakers: false, detectMultipleSpeakers: false });
      return validated.config || getDefaultAntiCheatConfig();
    }
    return getDefaultAntiCheatConfig();
  }

  public updateExamAntiCheatConfig(examId: string, config: AntiCheatConfig): AntiCheatConfig {
    const exam = this.getExamById(examId);
    if (!exam) {
      throw new Error('Imtihon topilmadi');
    }
    const validated = validateAntiCheatConfig(config);
    if (!validated.valid || !validated.config) throw new Error(validated.errors.join('; '));
    exam.antiCheatConfig = validated.config;
    this.saveExam(exam);
    return exam.antiCheatConfig;
  }

  // Single IP validation: check if another active session for this exam has the same IP
  public hasActiveSessionForIP(examId: string, clientIp: string, excludeUserId?: string): boolean {
    if (!clientIp) return false;
    const cleanIp = clientIp.replace(/^::ffff:/i, '').trim();
    if (process.env.NODE_ENV !== 'production' && ['127.0.0.1', '::1', 'localhost', '0.0.0.0'].includes(cleanIp)) {
      return false; // loopback proxy exclusion
    }
    const policy = this.getExamAntiCheatConfig(examId);
    if (!policy.enabled || !policy.blockDuplicateIP) return false;

    const now = Date.now();
    return this.data.sessions.some(s => {
      const isSameExam = s.examId === examId;
      const isSameIp = s.clientIp && s.clientIp.replace(/^::ffff:/i, '').trim() === cleanIp;
      const isDifferentUser = !excludeUserId || s.userId !== excludeUserId;
      const isActive = ['IN_PROGRESS', 'DISCONNECTED'].includes(s.status);
      const notExpired = typeof s.expiresAt === 'number' ? now < s.expiresAt : new Date(s.expiresAt).getTime() > now;
      return s.mode !== 'practice' && isSameExam && isSameIp && isDifferentUser && isActive && notExpired;
    });
  }

  public recordSessionHeartbeat(sessionId: string): { success: boolean; session?: ExamSessionRecord; error?: string } {
    const session = this.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Sessiya topilmadi' };
    }
    if (session.status !== 'IN_PROGRESS') {
      return { success: false, error: 'Sessiya faol emas' };
    }

    session.lastHeartbeatAt = Date.now();
    this.saveData();
    return { success: true, session };
  }

  public recordSessionProctorEvent(
    sessionId: string,
    event: { eventId?: string; eventType: string; occurredAt?: string; details?: string; ipAddress?: string }
  ): {
    success: boolean;
    violationCount: number;
    maxViolationsAllowed: number;
    status: string;
    isDisqualified: boolean;
    ruleEnabled: boolean;
    error?: string;
  } {
    const session = this.getSession(sessionId);
    if (!session) {
      return {
        success: false,
        violationCount: 0,
        maxViolationsAllowed: 4,
        status: 'UNKNOWN',
        isDisqualified: false,
        ruleEnabled: false,
        error: 'Sessiya topilmadi'
      };
    }

    const config = { ...this.getExamAntiCheatConfig(session.examId), ...(session.mode === 'practice' ? { enabled: false } : {}) };
    const maxAllowed = config.maxViolationsAllowed || 4;

    if (!session.processedEventIds) {
      session.processedEventIds = [];
    }

    // Idempotency check: if eventId is passed and already processed, return current state without double-counting
    if (event.eventId && session.processedEventIds.includes(event.eventId)) {
      return {
        success: true,
        violationCount: session.violationCount || 0,
        maxViolationsAllowed: maxAllowed,
        status: session.status,
        isDisqualified: session.status === 'DISQUALIFIED',
        ruleEnabled: true,
      };
    }

    if (event.eventId) {
      session.processedEventIds.push(event.eventId);
    }

    const ruleEnabled = eventEnabled(config, event.eventType.toUpperCase());

    // Save proctor event audit record
    this.addProctorEvent({
      id: `prc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      eventId: event.eventId,
      sessionId,
      userId: session.userId,
      examId: session.examId,
      eventType: event.eventType,
      details: event.details || 'Qoidabuzarlik hodisasi qayd etildi',
      severity: ruleEnabled ? 'high' : 'low',
      timestamp: new Date().toISOString(),
      ipAddress: event.ipAddress || session.clientIp || '127.0.0.1',
    });

    if (ruleEnabled && session.status === 'IN_PROGRESS') {
      session.violationCount = (session.violationCount || 0) + 1;
      if (session.violationCount >= maxAllowed) {
        session.status = 'DISQUALIFIED';
        session.disqualificationReason = `Server anti-cheat: Qoidabuzarliklar soni chegaradan oshdi (${session.violationCount}/${maxAllowed})`;
      }
      this.saveData();
    }

    return {
      success: true,
      violationCount: session.violationCount || 0,
      maxViolationsAllowed: maxAllowed,
      status: session.status,
      isDisqualified: session.status === 'DISQUALIFIED',
      ruleEnabled,
    };
  }

  // --- Snapshot Storage & Access Control ---
  public saveSnapshot(snapshot: SnapshotRecord): void {
    if (!this.data.snapshots) {
      this.data.snapshots = [];
    }
    this.data.snapshots.unshift(snapshot);
    this.saveData();
  }

  public getExamSnapshots(examId: string): SnapshotRecord[] {
    if (!this.data.snapshots) return [];
    return this.data.snapshots.filter(s => s.examId === examId);
  }

  public getSnapshotById(snapshotId: string): SnapshotRecord | undefined {
    if (!this.data.snapshots) return undefined;
    return this.data.snapshots.find(s => s.id === snapshotId);
  }

  public deleteSnapshot(snapshotId: string): boolean {
    if (!this.data.snapshots) return false;
    const initialLen = this.data.snapshots.length;
    this.data.snapshots = this.data.snapshots.filter(s => s.id !== snapshotId);
    this.saveData();
    return this.data.snapshots.length < initialLen;
  }

  public recordHeartbeat(sessionId: string, _clientTime?: string): { success: boolean; session?: ExamSessionRecord; error?: string; isDisqualified?: boolean; disqualificationReason?: string } {
    const res = this.recordSessionHeartbeat(sessionId);
    return {
      success: res.success,
      session: res.session,
      error: res.error,
      isDisqualified: res.session?.status === 'DISQUALIFIED',
      disqualificationReason: res.session?.disqualificationReason,
    };
  }

  public recordProctorEvent(
    sessionId: string,
    event: {
      eventId?: string;
      eventType: string;
      occurredAt?: string;
      details?: string;
      isViolation?: boolean;
      maxAllowed?: number;
    }
  ): { isDuplicate: boolean; isDisqualified: boolean; violationCount: number; disqualificationReason?: string; status: string; ruleEnabled: boolean } {
    const session = this.getSession(sessionId);
    const wasDuplicate = Boolean(event.eventId && session?.processedEventIds?.includes(event.eventId));
    const res = this.recordSessionProctorEvent(sessionId, {
      eventId: event.eventId,
      eventType: event.eventType,
      occurredAt: event.occurredAt,
      details: event.details,
    });
    return {
      isDuplicate: wasDuplicate,
      isDisqualified: res.isDisqualified,
      violationCount: res.violationCount,
      disqualificationReason: session?.disqualificationReason,
      status: res.status,
      ruleEnabled: res.ruleEnabled,
    };
  }

  // --- Security Settings ---
  public getSecuritySettings(): SecuritySettings {
    if (!this.data.securitySettings) {
      this.data.securitySettings = {
        wafEnabled: true,
        ipBlockingEnabled: true,
        rateLimitEnabled: true,
        sslStrict: true,
        sslValid: true,
        sslExpiry: '2026-12-31',
      };
    }
    return this.data.securitySettings;
  }

  public updateSecuritySettings(partial: Partial<SecuritySettings>): SecuritySettings {
    const current = this.getSecuritySettings();
    this.data.securitySettings = { ...current, ...partial };
    this.saveData();
    return this.data.securitySettings;
  }
}

export const dbStore = new Store();

// --- Exported Helper Functions for Direct Testing and Integration ---
export function hasActiveSessionForIP(
  examId: string,
  ip: string,
  userId: string,
  policy: AntiCheatConfig,
  sessions: ExamSessionRecord[]
): boolean {
  if (!policy.enabled || !policy.blockDuplicateIP) return false;
  const now = Date.now();
  return sessions.some(s => {
    const isMatchingExam = s.examId === examId;
    const isSameIp = s.clientIp && s.clientIp.trim() === ip.trim();
    const isDifferentUser = s.userId !== userId;
    const isActive = ['IN_PROGRESS', 'DISCONNECTED'].includes(s.status);
    const notExpired = typeof s.expiresAt === 'number' ? now < s.expiresAt : new Date(s.expiresAt).getTime() > now;
    return s.mode !== 'practice' && isMatchingExam && isSameIp && isDifferentUser && isActive && notExpired;
  });
}

export function recordSessionHeartbeat(
  session: ExamSessionRecord,
  _clientTime: string
): { success: boolean; isDisqualified?: boolean; disqualificationReason?: string } {
  session.lastHeartbeatAt = Date.now();
  if (session.status === 'DISQUALIFIED') {
    return {
      success: false,
      isDisqualified: true,
      disqualificationReason: session.disqualificationReason,
    };
  }
  return { success: true };
}

export function recordSessionProctorEvent(
  session: ExamSessionRecord,
  event: {
    eventId: string;
    eventType: string;
    occurredAt: string;
    details?: string;
    isViolation: boolean;
    maxAllowed?: number;
  }
): { isDuplicate: boolean; isDisqualified: boolean; violationCount: number; disqualificationReason?: string } {
  if (!session.processedEventIds) {
    session.processedEventIds = [];
  }
  if (session.processedEventIds.includes(event.eventId)) {
    return {
      isDuplicate: true,
      isDisqualified: session.status === 'DISQUALIFIED',
      violationCount: session.violationCount || 0,
      disqualificationReason: session.disqualificationReason,
    };
  }
  session.processedEventIds.push(event.eventId);

  if (event.isViolation) {
    session.violationCount = (session.violationCount || 0) + 1;
    const maxAllowed = event.maxAllowed || 3;
    if (session.violationCount >= maxAllowed) {
      session.status = 'DISQUALIFIED';
      session.disqualificationReason = `Server anti-cheat qoidabuzarligi: limit oshdi (${session.violationCount}/${maxAllowed}). Hodisa: ${event.eventType}`;
    }
  }

  return {
    isDuplicate: false,
    isDisqualified: session.status === 'DISQUALIFIED',
    violationCount: session.violationCount || 0,
    disqualificationReason: session.disqualificationReason,
  };
}

export function saveQuestions(examId: string, questions: QuestionRecord[]) {
  dbStore.saveQuestions(examId, questions);
}
