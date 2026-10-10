
import { useSecurityStore } from '../store/useSecurityStore';
import { useProctoringStore } from '../store/useProctoringStore';
import { useNotificationStore } from '../store/useNotificationStore';

export interface SignedRequestPayload<T = any> {
  data: T;
  sessionId: string;
  userId: string;
  timestamp: number;
  nonce: string;
  signature: string; 
}

export interface RateLimitConfig {
  maxRequestsPerWindow: number; 
  windowMs: number; 
}

export class HmacRequestSigner {
  private static generateSessionKey(sessionId: string, userId: string): string {
    return `NEXT_OLYMP_SEC_${sessionId}_${userId}_2026_SALT`;
  }

  
  public static async signPayload<T>(
    data: T,
    sessionId: string,
    userId: string
  ): Promise<SignedRequestPayload<T>> {
    const timestamp = Date.now();
    const randomBytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBytes);
    }
    const nonce = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('');
    const keyString = this.generateSessionKey(sessionId, userId);

    const messageString = `${sessionId}:${userId}:${timestamp}:${nonce}:${JSON.stringify(data)}`;

    
    let signature = '';
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(keyString);
      const messageData = encoder.encode(messageString);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      signature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      
      let hash = 0;
      for (let i = 0; i < messageString.length; i++) {
        const char = messageString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      signature = `hmac_fb_${Math.abs(hash).toString(16)}`;
    }

    return {
      data,
      sessionId,
      userId,
      timestamp,
      nonce,
      signature,
    };
  }

  
  public static async verifySignature(signed: SignedRequestPayload): Promise<boolean> {
    const now = Date.now();
    
    if (Math.abs(now - signed.timestamp) > 60000) {
      console.warn('[HMAC] Replay attack detected: timestamp expired');
      return false;
    }

    const keyString = this.generateSessionKey(signed.sessionId, signed.userId);
    const messageString = `${signed.sessionId}:${signed.userId}:${signed.timestamp}:${signed.nonce}:${JSON.stringify(signed.data)}`;

    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(keyString);
      const messageData = encoder.encode(messageString);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      const expectedSignature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      return expectedSignature === signed.signature;
    } catch {
      return signed.signature.startsWith('hmac_fb_');
    }
  }
}

export class ClientRateLimiter {
  private requestTimestamps: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequestsPerWindow: 2, windowMs: 2000 }) {
    this.config = config;
  }

  public checkAndRecord(actionName: string = 'submit_answer'): { allowed: boolean; waitTimeMs?: number } {
    const now = Date.now();
    
    this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < this.config.windowMs);

    if (this.requestTimestamps.length >= this.config.maxRequestsPerWindow) {
      const oldestInWindow = this.requestTimestamps[0];
      const waitTimeMs = this.config.windowMs - (now - oldestInWindow);

      
      const procStore = useProctoringStore.getState();
      const secStore = useSecurityStore.getState();
      const notifStore = useNotificationStore.getState();

      procStore.addLiveAlert({
        sessionId: 'proc-rate-limit',
        userId: 'USR-LOCAL',
        studentName: 'Ishtirokchi (Avtomatlashtirilgan so\'rov)',
        olympiadTitle: 'Imtihon Himoyasi',
        type: 'tab_switch',
        title: `Rate Limit Buzildi: ${actionName}`,
        description: `${this.config.windowMs}ms ichida ${this.config.maxRequestsPerWindow} tadan ortiq so'rov yuborildi (Bot/Skript shubhasi)`,
        severity: 'yuqori',
        status: 'yangi',
      });

      secStore.addAccessLog({
        id: `rl-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        ip: '127.0.0.1 (Client)',
        country: "O'zbekiston",
        countryCode: 'UZ',
        method: 'POST',
        path: `/api/contest/${actionName}`,
        statusCode: 429, 
        responseTimeMs: 2,
        userAgent: navigator.userAgent.slice(0, 50),
        bytesSent: 64,
        level: 'warning',
      });

      notifStore.addNotification({
        title: 'Tezlik chegarasi (Rate Limit)',
        desc: "Juda ko'p ketma-ket so'rovlar yuborildi. Iltimos, 2 soniya kuting.",
        type: 'warning',
      });

      return { allowed: false, waitTimeMs };
    }

    this.requestTimestamps.push(now);
    return { allowed: true };
  }
}

export class MultiMonitorDetector {
  public static isMultiMonitor(): boolean {
    
    if ('isExtended' in window.screen && (window.screen as any).isExtended) {
      return true;
    }

    
    if (window.screen.availWidth > 2560 || window.screen.width > 3000) {
      return true;
    }

    return false;
  }

  public static async checkScreenDetails(): Promise<{
    multiMonitor: boolean;
    screensCount: number;
    details?: string;
  }> {
    try {
      if ('getScreenDetails' in window) {
        const screenDetails = await (window as any).getScreenDetails();
        const screensCount = screenDetails.screens.length;
        return {
          multiMonitor: screensCount > 1,
          screensCount,
          details: `${screensCount} ta monitor ulangan`,
        };
      }
    } catch {
      
    }

    const multi = this.isMultiMonitor();
    return {
      multiMonitor: multi,
      screensCount: multi ? 2 : 1,
      details: multi ? "Kengaytirilgan monitor (isExtended) aniqlandi" : "Yagona monitor",
    };
  }
}

export const globalRateLimiter = new ClientRateLimiter({
  maxRequestsPerWindow: 2,
  windowMs: 2500, 
});
