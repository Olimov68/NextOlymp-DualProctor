import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface UserRecord {
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
  createdAt: string;
}

export interface QuestionRecord {
  id: string;
  examId: string;
  question_text: string;
  options: Array<{ id: string; text: string }>;
  correct_answer: string; // e.g. 'B' or 'opt-b' - SERVER ONLY!
  points: number;
  orderNum: number;
  explanation: string; // SERVER ONLY until exam finished!
}

export interface ExamRecord {
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
  createdAt: string;
}

export interface ExamSessionRecord {
  sessionId: string;
  userId: string;
  examId: string;
  startedAt: number;
  expiresAt: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'DISQUALIFIED';
  answers: Record<string, string>; // questionId -> selectedOption
  score?: number;
  percentage?: number;
  submittedAt?: string;
}

export interface SubmissionRecord {
  id: string;
  userId: string;
  userName: string;
  examId: string;
  examTitle: string;
  subject: string;
  score: number;
  maxScore: number;
  percentage: number;
  raschTheta: number;
  status: 'completed' | 'disqualified';
  timeSpentMinutes: number;
  submittedAt: string;
  certificateType: string;
  verificationCode: string;
  analysis?: any[];
}

export interface ProctorEventRecord {
  id: string;
  userId: string;
  examId: string;
  eventType: string;
  details: string;
  severity: string;
  timestamp: string;
  ipAddress: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  exams: ExamRecord[];
  questions: QuestionRecord[];
  sessions: ExamSessionRecord[];
  submissions: SubmissionRecord[];
  proctorEvents: ProctorEventRecord[];
  securityBlockedIps: Array<{ ip: string; reason: string; blockedAt: string }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

class Store {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
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
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error reading store.json, falling back to initial data:', e);
      }
    }
    const initial = this.createInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    this.ensureDir();
    const data = dataToSave || this.data;
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  }

  private createInitialData(): DatabaseSchema {
    const adminPassHash = bcrypt.hashSync('IbnSino2026!Admin', 10);
    const studentPassHash = bcrypt.hashSync('student123', 10);

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
    };
  }

  // --- Exam & Questions ---
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

  // --- Sessions & Server-Side Grading ---
  public startSession(userId: string, examId: string, durationMinutes: number = 60): ExamSessionRecord {
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
    };

    this.data.sessions.push(session);
    this.saveData();
    return session;
  }

  public getSession(sessionId: string): ExamSessionRecord | undefined {
    return this.data.sessions.find(s => s.sessionId === sessionId);
  }

  public getActiveSession(userId: string, examId: string): ExamSessionRecord | undefined {
    return this.data.sessions.find(s => s.userId === userId && s.examId === examId && s.status === 'IN_PROGRESS');
  }

  public recordAnswer(sessionId: string, questionId: string, selectedOption: string): { success: boolean; error?: string } {
    const session = this.getSession(sessionId);
    if (!session) return { success: false, error: 'Sessiya topilmadi' };
    if (session.status !== 'IN_PROGRESS') return { success: false, error: 'Imtihon faol holatda emas' };

    if (Date.now() > session.expiresAt + 5000) {
      session.status = 'EXPIRED';
      this.saveData();
      return { success: false, error: 'Imtihon vaqti tugadi' };
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
    
    // Rasch Theta estimation (-3.0 to +3.0)
    let raschTheta = 0;
    if (correctCount === 0) raschTheta = -3.0;
    else if (correctCount === questions.length) raschTheta = 3.0;
    else {
      const p = correctCount / questions.length;
      raschTheta = Math.round(Math.log(p / (1 - p)) * 100) / 100;
    }

    const elapsedMs = Math.min(Date.now() - session.startedAt, (exam?.durationMinutes || 60) * 60000);
    const timeSpentMinutes = Math.max(1, Math.round(elapsedMs / 60000));

    const certType = percentage >= 85 ? 'I darajali Diplom' : percentage >= 70 ? 'II darajali Diplom' : percentage >= 50 ? 'III darajali Diplom' : 'Ishtirokchi Sertifikati';
    const subNum = Math.floor(1000 + Math.random() * 9000);
    const verificationCode = `IS-2026-${(exam?.category || 'MED').toUpperCase().slice(0, 4)}-${subNum}`;

    const submission: SubmissionRecord = {
      id: `sub_${session.userId}_${session.examId}_${Date.now()}`,
      userId: session.userId,
      userName: user?.fullName || 'Ishtirokchi',
      examId: session.examId,
      examTitle: exam?.title || 'Ibn Sino Olimpiadasi',
      subject: exam?.subject || 'Tibbiyot',
      score: calculatedScore,
      maxScore,
      percentage,
      raschTheta,
      status: 'completed',
      timeSpentMinutes,
      submittedAt: session.submittedAt,
      certificateType: certType,
      verificationCode,
      analysis,
    };

    session.score = calculatedScore;
    session.percentage = percentage;

    this.data.submissions.unshift(submission);

    // Update user personal highest score
    if (user) {
      user.score = Math.max(user.score, calculatedScore);
    }

    this.saveData();
    return submission;
  }

  public getSubmissionBySession(sessionId: string): SubmissionRecord | undefined {
    const session = this.getSession(sessionId);
    if (!session) return undefined;
    return this.data.submissions.find(s => s.userId === session.userId && s.examId === session.examId);
  }

  public getSubmissions(userId?: string): SubmissionRecord[] {
    if (userId) {
      return this.data.submissions.filter(s => s.userId === userId);
    }
    return this.data.submissions;
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

  public createUser(user: UserRecord): UserRecord {
    this.data.users.unshift(user);
    this.saveData();
    return user;
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

  public verifyCertificateByCode(code: string): SubmissionRecord | undefined {
    const clean = code.trim().toUpperCase();
    return this.data.submissions.find(s => s.verificationCode.toUpperCase() === clean);
  }
}

export const dbStore = new Store();
