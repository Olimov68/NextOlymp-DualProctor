import axios from 'axios';
import { dbStore, type UserRecord, type SubmissionRecord, type ExamRecord } from '../db/store';

export interface TelegramSendMessageOptions {
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  reply_markup?: any;
  disable_web_page_preview?: boolean;
}

export class TelegramBotService {
  private static isPollingRunning = false;
  private static pollAbortController: AbortController | null = null;
  private static lastUpdateId = 0;
  private static notifiedReminders = new Set<string>(); // examId + minute to prevent duplicate broadcasts

  public static getToken(): string {
    return (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  }

  public static getBotUsername(): string {
    return (process.env.TELEGRAM_BOT_USERNAME || 'IbnsinoschoolBot').replace(/^@/, '').trim();
  }

  public static getSiteUrl(): string {
    return (process.env.SITE_URL || 'https://ibnsinoschool.uz').replace(/\/$/, '');
  }

  public static isConfigured(): boolean {
    return Boolean(this.getToken() && this.getToken().includes(':'));
  }

  /**
   * Send a message to any Telegram user via Bot API
   */
  public static async sendMessage(
    chatId: string | number,
    text: string,
    options?: TelegramSendMessageOptions
  ): Promise<{ success: boolean; messageId?: number; error?: string }> {
    const token = this.getToken();
    if (!token || !chatId) {
      return { success: false, error: 'Telegram bot token yoki chat_id mavjud emas' };
    }

    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          chat_id: chatId,
          text,
          parse_mode: options?.parse_mode ?? 'HTML',
          disable_web_page_preview: options?.disable_web_page_preview ?? false,
          reply_markup: options?.reply_markup,
        },
        {
          timeout: 10000,
        }
      );

      if (response.data && response.data.ok) {
        return { success: true, messageId: response.data.result?.message_id };
      }
      return { success: false, error: response.data?.description || 'Nomaʼlum Telegram API xatoligi' };
    } catch (err: any) {
      const desc = err?.response?.data?.description || err?.message || 'Telegram yuborishda xatolik';
      console.error(`[TelegramBot.sendMessage Error for chat ${chatId}]:`, desc);
      return { success: false, error: desc };
    }
  }

  /**
   * Send Registration or Password Reset OTP Code
   */
  public static async sendOtpCode(
    chatId: string | number,
    code: string,
    fullName: string,
    type: 'register' | 'reset' = 'register'
  ): Promise<boolean> {
    const siteUrl = this.getSiteUrl();
    let text = '';

    if (type === 'register') {
      text =
        `Assalomu alaykum, <b>${fullName}</b>! 🌿\n\n` +
        `Ibn Sino xalqaro maktabi onlayn olimpiada va mock imtihon tizimiga xush kelibsiz.\n\n` +
        `Sizning ro'yxatdan o'tish tasdiqlash kodingiz:\n` +
        `🔢 <b><code style="font-size:22px;">${code}</code></b>\n\n` +
        `⏱ <i>Ushbu kod 15 daqiqa davomida amal qiladi. Kodni hech kimga bermang!</i>\n\n` +
        `🌐 Sayt: ${siteUrl}`;
    } else {
      text =
        `Assalomu alaykum, <b>${fullName}</b>! 🔐\n\n` +
        `Ibn Sino platformasidagi hisobingiz parolini tiklash uchun tasdiqlash kodingiz:\n` +
        `🔢 <b><code style="font-size:22px;">${code}</code></b>\n\n` +
        `⏱ <i>Ushbu kod 15 daqiqa davomida amal qiladi. Agar siz so'rov yubormagan bo'lsangiz, xabarni e'tiborsiz qoldiring.</i>\n\n` +
        `🌐 Sayt: ${siteUrl}`;
    }

    const res = await this.sendMessage(chatId, text, { parse_mode: 'HTML' });
    return res.success;
  }

  /**
   * Send 15-minute Olympiad Reminder notification
   * Exact format requested:
   * "Assalomu alaykum, Asilbek! 15 daqiqadan so‘ng mock test boshlanadi. Saytga kiring: ibnsinoschool.uz"
   */
  public static async sendOlympiadReminder(
    chatId: string | number,
    params: {
      studentName: string;
      examTitle?: string;
      subject?: string;
      minutesBefore?: number;
    }
  ): Promise<boolean> {
    const siteUrl = this.getSiteUrl().replace(/^https?:\/\//, '');
    const cleanName = params.studentName || 'Qadrli ishtirokchi';
    const minutes = params.minutesBefore || 15;
    const title = params.examTitle ? `\n📝 Imtihon: <b>${params.examTitle}</b>` : '';

    const text =
      `Assalomu alaykum, <b>${cleanName}</b>! ⏰\n\n` +
      `<b>${minutes} daqiqadan so‘ng mock test boshlanadi.</b>${title}\n\n` +
      `Saytga kiring: <b>${siteUrl}</b>\n\n` +
      `Tayyorgarligingizni ko'ring va o'z bilimingizni sinang! Omad yor bo'lsin! 🎯`;

    const res = await this.sendMessage(chatId, text, { parse_mode: 'HTML' });
    return res.success;
  }

  /**
   * Send Exam / Mock Test Result notification
   * Exact format requested:
   * "Sizning mock test natijangiz tayyor!\n\nFan: Biologiya / Kimyo\nTo‘plagan balingiz: 85 / 100\nO‘rningiz: 3-o‘rin\n\nBatafsil tahlil: ibnsinoschool.uz/results/..."
   */
  public static async sendExamResult(
    chatId: string | number,
    params: {
      studentName?: string;
      subject: string;
      score: number;
      maxScore: number;
      rank?: number;
      submissionId: string;
    }
  ): Promise<boolean> {
    const siteUrl = this.getSiteUrl().replace(/^https?:\/\//, '');
    const cleanRank = params.rank ? `\nO‘rningiz: <b>${params.rank}-o‘rin</b>` : '';

    const text =
      `🎉 <b>Sizning mock test natijangiz tayyor!</b>\n\n` +
      `📚 Fan: <b>${params.subject || 'Biologiya / Kimyo'}</b>\n` +
      `⭐ To‘plagan balingiz: <b>${params.score} / ${params.maxScore}</b>${cleanRank}\n\n` +
      `🔍 Batafsil tahlil: <b>${siteUrl}/results/${params.submissionId}</b>`;

    const res = await this.sendMessage(chatId, text, { parse_mode: 'HTML' });
    return res.success;
  }

  /**
   * Broadcast 15-minute Olympiad reminder to all registered students with Telegram
   */
  public static async broadcastOlympiadReminder(
    examId: string,
    minutesBefore = 15
  ): Promise<{ total: number; sent: number; failed: number }> {
    const exam = dbStore.getExamById(examId);
    if (!exam) return { total: 0, sent: 0, failed: 0 };

    const students = dbStore.getUsers().filter(u => u.status === 'active' && Boolean(u.telegramChatId));
    let sent = 0;
    let failed = 0;

    for (const student of students) {
      if (!student.telegramChatId) continue;
      const ok = await this.sendOlympiadReminder(student.telegramChatId, {
        studentName: student.fullName,
        examTitle: exam.title,
        subject: exam.subject,
        minutesBefore,
      });
      if (ok) sent++;
      else failed++;
    }

    return { total: students.length, sent, failed };
  }

  /**
   * Scheduled checker: Runs periodically to check exams starting in ~15 minutes
   */
  public static checkUpcomingOlympiadsAndNotify(): void {
    try {
      const exams = dbStore.getExams().filter(e => e.status !== 'yopiq');
      const now = Date.now();

      for (const exam of exams) {
        let startTimeMs: number | null = null;
        const timeStr = exam.startTime || (exam as any).startDate;
        if (timeStr) {
          const parsed = new Date(timeStr).getTime();
          if (!isNaN(parsed)) startTimeMs = parsed;
        }

        if (!startTimeMs) continue;

        const diffMinutes = Math.round((startTimeMs - now) / 60000);

        // If exam is between 13 and 17 minutes away, and not notified yet
        if (diffMinutes >= 13 && diffMinutes <= 17) {
          const reminderKey = `${exam.id}_15m`;
          if (!this.notifiedReminders.has(reminderKey)) {
            this.notifiedReminders.add(reminderKey);
            console.log(`[TelegramBot] ⏰ Sending 15-minute reminder for exam: ${exam.title} (${exam.id})`);
            void this.broadcastOlympiadReminder(exam.id, 15);
          }
        }
      }
    } catch (err: any) {
      console.error('[TelegramBot checkUpcomingOlympiads Error]:', err?.message || err);
    }
  }

  /**
   * Start Telegram Long Polling to handle /start and user interactions
   */
  public static startPolling(): void {
    if (this.isPollingRunning) return;
    if (!this.isConfigured()) {
      console.warn('[TelegramBot] Bot tokeni sozlanmagan, polling faollashtirilmadi');
      return;
    }

    this.isPollingRunning = true;
    this.pollAbortController = new AbortController();

    console.log(`🤖 [TelegramBot] @${this.getBotUsername()} long-polling xizmati ishga tushdi`);

    // Start background polling loop
    void this.pollLoop();
  }

  public static stopPolling(): void {
    this.isPollingRunning = false;
    if (this.pollAbortController) {
      this.pollAbortController.abort();
      this.pollAbortController = null;
    }
    console.log('[TelegramBot] Long-polling xizmati to‘xtatildi');
  }

  private static async pollLoop(): Promise<void> {
    const siteUrl = this.getSiteUrl();
    let hasWarned401 = false;

    while (this.isPollingRunning) {
      const token = this.getToken();
      if (!token || !token.includes(':')) {
        await new Promise(res => setTimeout(res, 10000));
        continue;
      }

      try {
        const response = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`, {
          params: {
            offset: this.lastUpdateId ? this.lastUpdateId + 1 : undefined,
            timeout: 20,
            allowed_updates: JSON.stringify(['message']),
          },
          timeout: 30000,
        });

        hasWarned401 = false; // Reset 401 warning on success

        if (response.data && response.data.ok && Array.isArray(response.data.result)) {
          for (const update of response.data.result) {
            this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);
            await this.handleUpdate(update, siteUrl);
          }
        }

        // Small throttle delay between polling cycles to keep CPU at 0%
        await new Promise(res => setTimeout(res, 1000));
      } catch (err: any) {
        if (!this.isPollingRunning) break;

        const status = err?.response?.status;
        const desc = err?.response?.data?.description || err?.message || '';

        if (status === 401) {
          if (!hasWarned401) {
            console.warn(`[TelegramBot] ⚠️ Token yaroqsiz (401 Unauthorized). Iltimos, .env faylidagi TELEGRAM_BOT_TOKEN ni tekshiring: ${desc}`);
            hasWarned401 = true;
          }
          // Back off for 30 seconds on 401 Unauthorized
          await new Promise(res => setTimeout(res, 30000));
        } else if (status === 409) {
          // Conflict: another instance is already running getUpdates
          console.warn('[TelegramBot] ⚠️ 409 Conflict: Botning boshqa nusxasi ishlayapti. 10 soniya kutilmoqda...');
          await new Promise(res => setTimeout(res, 10000));
        } else {
          // Network timeout / connection drop - wait 3 seconds and retry gracefully
          await new Promise(res => setTimeout(res, 3000));
        }
      }
    }
  }

  private static async handleUpdate(update: any, siteUrl: string): Promise<void> {
    const message = update.message;
    if (!message || !message.text) return;

    const chatId = message.chat.id;
    const text = message.text.trim();
    const from = message.from || {};
    const telegramUsername = from.username || '';
    const firstName = from.first_name || 'Foydalanuvchi';

    // Handle /start command (with optional deep-link payload)
    if (text.startsWith('/start')) {
      const parts = text.split(/\s+/);
      const payload = parts[1] ? parts[1].trim() : '';

      // 1. Deep link: /start reg_<token>
      if (payload.toLowerCase().startsWith('reg_')) {
        const token = payload;
        const pending = dbStore.getPendingRegistration(token);

        if (pending && pending.expiresAt > Date.now()) {
          // Link chat ID to pending registration
          pending.telegramChatId = chatId;
          pending.telegramUsername = telegramUsername;
          pending.verified = true;
          dbStore.updatePendingRegistration(token, {
            telegramChatId: chatId,
            telegramUsername,
            verified: true,
          });

          const reply =
            `Assalomu alaykum, <b>${pending.fullName}</b>! 🌿\n\n` +
            `Ibn Sino xalqaro maktabi platformasiga xush kelibsiz!\n\n` +
            `Sizning ro'yxatdan o'tish tasdiqlash kodingiz:\n` +
            `🔢 <b><code style="font-size:24px;">${pending.code}</code></b>\n\n` +
            `Ushbu kodni saytdagi ro'yxatdan o'tish sahifasiga kiriting va "Tasdiqlash" tugmasini bosing.\n` +
            `⏱ Kod 15 daqiqa davomida amal qiladi.\n\n` +
            `🌐 Sayt: ${siteUrl}`;

          await this.sendMessage(chatId, reply, { parse_mode: 'HTML' });
          return;
        } else {
          await this.sendMessage(
            chatId,
            `Assalomu alaykum, <b>${firstName}</b>!\n\n` +
            `⚠️ Ushbu ro'yxatdan o'tish havolasining muddati o'tgan yoki havola yaroqsiz.\n\n` +
            `Iltimos, saytdan qayta ro'yxatdan o'ting: ${siteUrl}/auth/register`,
            { parse_mode: 'HTML' }
          );
          return;
        }
      }

      // 2. Deep link: /start reset_<emailOrCode>
      if (payload.toLowerCase().startsWith('reset_')) {
        const rawKey = payload.replace(/^reset_/i, '');
        // Find in password resets
        let targetEmail = '';
        let resetRecord: any = null;

        if (rawKey.includes('@')) {
          targetEmail = rawKey.toLowerCase();
          resetRecord = dbStore.getPasswordReset(targetEmail);
        } else {
          // Check all pending password resets
          const schema = (dbStore as any).data?.passwordResets || {};
          for (const [em, rec] of Object.entries(schema)) {
            if ((rec as any).resetToken === rawKey || em.startsWith(rawKey)) {
              targetEmail = em;
              resetRecord = rec;
              break;
            }
          }
        }

        if (resetRecord && resetRecord.expiresAt > Date.now()) {
          const user = dbStore.getUserByEmailOrPhone(targetEmail);
          if (user) {
            dbStore.updateUser(user.id, { telegramChatId: chatId, telegramUsername });
          }

          const reply =
            `Assalomu alaykum, <b>${user?.fullName || firstName}</b>! 🔐\n\n` +
            `Parolni tiklash uchun tasdiqlash kodingiz:\n` +
            `🔢 <b><code style="font-size:24px;">${resetRecord.plainCode || 'Yuborildi'}</code></b>\n\n` +
            `Saytga qaytib ushbu kodni kiriting va yangi parolingizni o'rnating.\n` +
            `⏱ Kod 15 daqiqa davomida amal qiladi.`;

          await this.sendMessage(chatId, reply, { parse_mode: 'HTML' });
          return;
        }
      }

      // 3. Generic /start
      const user = dbStore.getUserByTelegramChatId(chatId);
      if (user) {
        await this.sendMessage(
          chatId,
          `Assalomu alaykum, <b>${user.fullName}</b>! 🌿\n\n` +
          `Sizning hisobingiz Ibn Sino platformasiga ulangan.\n\n` +
          `Bu yerda siz:\n` +
          `⏰ Mock test va olimpiadalardan 15 daqiqa oldin eslatma\n` +
          `📊 Natijalaringiz va to'plangan ballaringiz haqida xabarnoma\n` +
          `🔐 Parolni tiklash va tasdiqlash kodlarini olasiz.\n\n` +
          `🌐 Sayt: ${siteUrl}`,
          { parse_mode: 'HTML' }
        );
      } else {
        await this.sendMessage(
          chatId,
          `Assalomu alaykum, <b>${firstName}</b>! 🌿\n\n` +
          `Ibn Sino xalqaro maktabi olimpiada va mock testlar platformasi rasmiy botiga xush kelibsiz!\n\n` +
          `Platformada ro'yxatdan o'tishda tasdiqlash kodi ushbu bot orqali taqdim etiladi.\n\n` +
          `Saytga kiring: <b>${siteUrl}</b>\n\n` +
          `Yordam: /help\n` +
          `Sizning Telegram ID: <code>${chatId}</code>`,
          { parse_mode: 'HTML' }
        );
      }
      return;
    }

    // Handle /myid
    if (text === '/myid') {
      await this.sendMessage(
        chatId,
        `Sizning Telegram Chat ID: <code>${chatId}</code>\nUsername: @${telegramUsername || 'mavjud emas'}`,
        { parse_mode: 'HTML' }
      );
      return;
    }

    // Handle /help
    if (text === '/help') {
      await this.sendMessage(
        chatId,
        `🌿 <b>Ibn Sino Ta'lim Platformasi Boti</b>\n\n` +
        `Ushbu bot quyidagi maqsadlarda ishlaydi:\n` +
        `1. Ro'yxatdan o'tishda 6 xonali tasdiqlash kodini yuborish\n` +
        `2. Parolni tiklashda xavfsiz kod berish\n` +
        `3. Olimpiada boshlanishidan 15 daqiqa oldin eslatma yuborish\n` +
        `4. Test tugashi bilanoq to'plangan ball va o'rinni xabar qilish\n\n` +
        `🌐 Sayt: ${siteUrl}`,
        { parse_mode: 'HTML' }
      );
      return;
    }
  }
}
