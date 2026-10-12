import nodemailer from 'nodemailer';
import axios from 'axios';
import { IS_PRODUCTION } from '../config/constants';
import { TelegramBotService } from './telegramBot.service';

export interface SendOtpResult {
  sent: boolean;
  channel: 'email' | 'sms' | 'telegram' | 'development';
  error?: string;
}

export interface SendMessageResult {
  sent: boolean;
  channel: 'sms' | 'email' | 'telegram' | 'development';
  providerMessageId?: string;
  error?: string;
}

export class NotificationProvider {
  /**
   * Check if real production SMTP or SMS gateway is configured
   */
  public static isConfigured(): boolean {
    const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    const hasSms = Boolean(process.env.SMS_API_KEY || process.env.ESKIZ_TOKEN);
    return hasSmtp || hasSms;
  }

  /**
   * Send OTP code securely through configured delivery channel
   */
  public static async sendOtp(to: string, code: string): Promise<SendOtpResult> {
    const isEmail = to.includes('@');
    if (!/^\d{6}$/.test(code)) return { sent: false, channel: isEmail ? 'email' : 'sms', error: 'OTP formati yaroqsiz' };

    // 1. Production check: fail-closed if unconfigured
    if (IS_PRODUCTION) {
      if (isEmail && !(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) {
        return {
          sent: false,
          channel: 'email',
          error: "Xavfsizlik talabi: Production muhitida SMTP provayderi sozlanmagan. Iltimos, administrator bilan bog'laning.",
        };
      }
      if (!isEmail && !(process.env.SMS_API_KEY || process.env.ESKIZ_TOKEN)) {
        return {
          sent: false,
          channel: 'sms',
          error: "Xavfsizlik talabi: Production muhitida SMS shlyuzi sozlanmagan. Iltimos, administrator bilan bog'laning.",
        };
      }
    }

    // 2. Real SMTP provider (Nodemailer over TLS)
    if (isEmail && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = process.env.SMTP_SECURE === 'true' || port === 465;

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure,
          requireTLS: !secure,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 8000,
          tls: {
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2',
          },
        });

        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || `NextOlymp <${process.env.SMTP_USER}>`,
          to: to.trim().toLowerCase(),
          subject: 'NextOlymp — Tasdiqlash Kodi',
          text: `NextOlymp imtihon tizimiga kirish uchun tasdiqlash kodingiz: ${code}. Ushbu kod 15 daqiqa amal qiladi. Kodni hech kimga bermang!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <h2 style="color: #0f172a; margin-top: 0;">NextOlymp Tasdiqlash Kodi</h2>
              <p style="color: #475569; font-size: 14px;">NextOlymp xavfsiz imtihon tizimidagi hisobingizga kirish uchun tasdiqlash kodingiz:</p>
              <div style="text-align: center; margin: 24px 0; padding: 16px; background: #f8fafc; border-radius: 8px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0284c7;">${code}</span>
              </div>
              <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">Ushbu kod 15 daqiqa amal qiladi. Kodni hech kimga bermang!</p>
            </div>
          `,
        });

        if (info.messageId && info.accepted.length > 0 && info.rejected.length === 0) {
          return { sent: true, channel: 'email' };
        }
        return { sent: false, channel: 'email', error: 'SMTP provayderidan tasdiq xabari olinmadi' };
      } catch (err: any) {
        // Fail-closed on error, zero OTP leaking in logs
        console.error('[NotificationProvider.sendOtp Email Error]:', err?.message || 'SMTP ulanish xatosi');
        return { sent: false, channel: 'email', error: 'Email yuborishda xatolik yuz berdi' };
      }
    }

    // 3. Real SMS provider (Eskiz / SMS Gateway)
    if (!isEmail && (process.env.SMS_API_KEY || process.env.ESKIZ_TOKEN)) {
      try {
        const token = process.env.ESKIZ_TOKEN || process.env.SMS_API_KEY;
        const cleanPhone = to.replace(/\D/g, '');

        const response = await axios.post(
          'https://notify.eskiz.uz/api/message/sms/send',
          {
            mobile_phone: cleanPhone,
            message: `NextOlymp tasdiqlash kodingiz: ${code}`,
            from: process.env.ESKIZ_FROM || '4546',
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 8000,
          }
        );

        if (response.status === 200 && (response.data?.status === 'waiting' || response.data?.status === 'success' || response.data?.id)) {
          return { sent: true, channel: 'sms' };
        }
        return { sent: false, channel: 'sms', error: 'SMS provayderidan nomaqbul javob qaytdi' };
      } catch (err: any) {
        console.error('[NotificationProvider.sendOtp SMS Error]:', err?.message || 'SMS API xatosi');
        return { sent: false, channel: 'sms', error: 'SMS yuborishda xatolik yuz berdi' };
      }
    }

    // 4. Development mode explicit behavior:
    if (!IS_PRODUCTION) {
      return {
        sent: false,
        channel: 'development',
        error: "SMTP/SMS sozlanmagan. Haqiqiy yoki mahalliy test provayderini sozlang.",
      };
    }

    return {
      sent: false,
      channel: isEmail ? 'email' : 'sms',
      error: 'Xabarnoma yuboruvchi xizmat mavjud emas',
    };
  }

  public static async sendMessage(to: string, message: string, subject = 'Ibn Sino xabarnomasi'): Promise<SendMessageResult> {
    if (to.startsWith('tg:')) {
      const chatId = to.replace('tg:', '');
      const res = await TelegramBotService.sendMessage(chatId, message);
      return {
        sent: res.success,
        channel: 'telegram',
        providerMessageId: res.messageId ? String(res.messageId) : undefined,
        error: res.error,
      };
    }
    const isEmail = to.includes('@');
    if (!message.trim() || message.length > 1000) {
      return { sent: false, channel: isEmail ? 'email' : 'sms', error: 'Xabar bo‘sh yoki juda uzun' };
    }
    if (isEmail && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = process.env.SMTP_SECURE === 'true' || port === 465;
        const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure,
          requireTLS: !secure, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 8000,
          tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' } });
        const info = await transporter.sendMail({ from: process.env.SMTP_FROM || `NextOlymp <${process.env.SMTP_USER}>`,
          to: to.trim().toLowerCase(), subject, text: message });
        return info.messageId && info.accepted.length > 0 && info.rejected.length === 0
          ? { sent: true, channel: 'email', providerMessageId: info.messageId }
          : { sent: false, channel: 'email', error: 'Email provayderi xabarni qabul qilmadi' };
      } catch (err: any) {
        console.error('[NotificationProvider.sendMessage Email Error]:', err?.message || 'SMTP xatosi');
        return { sent: false, channel: 'email', error: 'Email yuborishda xatolik yuz berdi' };
      }
    }
    if (!isEmail && (process.env.ESKIZ_TOKEN || process.env.SMS_API_KEY)) {
      try {
        const response = await axios.post('https://notify.eskiz.uz/api/message/sms/send', {
          mobile_phone: to.replace(/\D/g, ''), message, from: process.env.ESKIZ_FROM || '4546',
        }, { headers: { Authorization: `Bearer ${process.env.ESKIZ_TOKEN || process.env.SMS_API_KEY}` }, timeout: 8000 });
        if (response.status === 200 && (response.data?.status === 'waiting' || response.data?.status === 'success' || response.data?.id)) {
          return { sent: true, channel: 'sms', providerMessageId: String(response.data?.id || '') || undefined };
        }
        return { sent: false, channel: 'sms', error: 'SMS provayderidan nomaqbul javob qaytdi' };
      } catch (err: any) {
        console.error('[NotificationProvider.sendMessage SMS Error]:', err?.message || 'SMS xatosi');
        return { sent: false, channel: 'sms', error: 'SMS yuborishda xatolik yuz berdi' };
      }
    }
    return { sent: false, channel: isEmail ? 'email' : 'sms', error: 'SMTP/SMS provayderi sozlanmagan' };
  }
}
