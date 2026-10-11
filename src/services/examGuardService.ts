
import { useProctoringStore } from '../store/useProctoringStore';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from './api';

export type ExamViolationType =
  | 'CLIPBOARD_ACTION'
  | 'CONTEXT_MENU'
  | 'DEVTOOLS_KEY'
  | 'DEVTOOLS_OPENED'
  | 'DEVTOOLS_DETECTED'
  | 'VIEW_SOURCE'
  | 'PRINT_ATTEMPT'
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'EXIT_FULLSCREEN'
  | 'HEARTBEAT_TIMEOUT';

export interface ExamGuardOptions {
  enabled?: boolean;
  maxViolations?: number;
  olympiadId?: string;
  sessionId?: string;
  olympiadTitle?: string;
  requireFullscreen?: boolean;
  blockTabSwitch?: boolean;
  blockCopyPaste?: boolean;
  blockDevTools?: boolean;
  heartbeatEnabled?: boolean;
  heartbeatIntervalSec?: number;
  heartbeatIntervalMs?: number;
  onViolation?: (type: ExamViolationType, data: { count: number; max: number; message: string }) => void;
  onDisqualify?: (reason: string) => void;
}

export class ExamGuard {
  public maxViolations: number;
  public violationCount: number;
  private enabled: boolean;
  private olympiadId: string;
  private sessionId: string;
  private olympiadTitle: string;
  private requireFullscreen: boolean;
  private blockTabSwitch: boolean;
  private blockCopyPaste: boolean;
  private blockDevTools: boolean;
  private heartbeatEnabled: boolean;
  private heartbeatIntervalMs: number;
  private onViolation: (type: ExamViolationType, data: { count: number; max: number; message: string }) => void;
  private onDisqualify: (reason: string) => void;

  private cleanupFns: Array<() => void> = [];
  private heartbeatTimer: any = null;
  private devtoolsInterval: any = null;
  private isDestroyed: boolean = false;

  constructor(options: ExamGuardOptions = {}) {
    this.enabled = options.enabled ?? true;
    this.maxViolations = options.maxViolations || 3;
    this.violationCount = 0;
    this.olympiadId = options.olympiadId || 'olymp-current';
    this.sessionId = options.sessionId || '';
    this.olympiadTitle = options.olympiadTitle || 'Onlayn Olimpiada';
    this.requireFullscreen = options.requireFullscreen ?? true;
    this.blockTabSwitch = options.blockTabSwitch ?? true;
    this.blockCopyPaste = options.blockCopyPaste ?? true;
    this.blockDevTools = options.blockDevTools ?? true;
    this.heartbeatEnabled = options.heartbeatEnabled ?? true;
    this.heartbeatIntervalMs = options.heartbeatIntervalSec ? options.heartbeatIntervalSec * 1000 : (options.heartbeatIntervalMs || 10000);
    this.onViolation = options.onViolation || (() => {});
    this.onDisqualify = options.onDisqualify || (() => {});

    if (this.enabled) {
      this.init();
    }
  }

  private init() {
    if (this.blockCopyPaste) {
      this.preventCopyPaste();
      this.preventContextMenu();
    }
    if (this.blockDevTools) {
      this.preventKeyboardShortcuts();
      this.detectDevTools();
    }
    if (this.blockTabSwitch) {
      this.trackTabAndFocus();
    }
    if (this.requireFullscreen) {
      this.enforceFullScreen();
    }
    this.startHeartbeat();
  }

  
  public recordViolation(type: ExamViolationType, message: string) {
    if (this.isDestroyed) return;

    if (!this.enabled || !this.sessionId) return;
    this.reportToServer(type, message);
  }

  
  private preventCopyPaste() {
    const block = (e: ClipboardEvent) => {
      e.preventDefault();
      this.recordViolation('CLIPBOARD_ACTION', 'Matndan nusxa olish, qirqish yoki joylash taqiqlangan!');
    };

    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('paste', block);

    
    const prevSelect = document.body.style.userSelect;
    const prevWebkitSelect = (document.body.style as any).webkitUserSelect;
    document.body.style.userSelect = 'none';
    (document.body.style as any).webkitUserSelect = 'none';

    this.cleanupFns.push(() => {
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('paste', block);
      document.body.style.userSelect = prevSelect;
      (document.body.style as any).webkitUserSelect = prevWebkitSelect;
    });
  }

  
  private preventContextMenu() {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      this.recordViolation('CONTEXT_MENU', "Sichqonchaning o'ng tugmasi menyusi bloklangan!");
    };

    document.addEventListener('contextmenu', handleContextMenu);
    this.cleanupFns.push(() => {
      document.removeEventListener('contextmenu', handleContextMenu);
    });
  }

  
  private preventKeyboardShortcuts() {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        this.recordViolation('DEVTOOLS_KEY', 'F12 orqali konsol / DevTools ochish taqiqlangan!');
        return;
      }

      
      if (isCtrlOrCmd && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        this.recordViolation('DEVTOOLS_KEY', 'Dasturchi asboblarini (DevTools) ochish taqiqlangan!');
        return;
      }

      
      if (isCtrlOrCmd && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        this.recordViolation('VIEW_SOURCE', 'Sahifa manba kodini ko\'rish taqiqlangan!');
        return;
      }

      
      if (isCtrlOrCmd && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        this.recordViolation('PRINT_ATTEMPT', 'Sahifani chop etish yoki PDF qilish taqiqlangan!');
        return;
      }

      
      if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      
      if (
        e.key === 'PrintScreen' ||
        e.keyCode === 44 ||
        (isCtrlOrCmd && e.shiftKey && ['S', 's', '3', '4', '5'].includes(e.key)) ||
        (e.metaKey && e.shiftKey)
      ) {
        e.preventDefault();
        e.stopPropagation();
        this.recordViolation('CLIPBOARD_ACTION', 'Ekranni rasmga olish (Screenshot / PrintScreen) qat\'iyan taqiqlangan!');
        return;
      }

      
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        this.recordViolation('TAB_SWITCH', 'Oyna almashtirishga (Alt+Tab) urinish aniqlandi!');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        this.recordViolation('CLIPBOARD_ACTION', 'Ekranni rasmga olish (Screenshot / PrintScreen) aniqlandi!');
      }
    };
    window.addEventListener('keyup', handleKeyUp, true);

    this.cleanupFns.push(() => {
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    });
  }

  
  private trackTabAndFocus() {
    const handleVisibility = () => {
      if (document.hidden) {
        this.recordViolation('TAB_SWITCH', "O'quvchi boshqa ilovaga/vkladkaga o'tdi yoki ekranni rasmga oldi!");
      }
    };

    const handleBlur = () => {
      this.recordViolation('WINDOW_BLUR', "Brauzer oynasidan chiqildi, bildirishnoma ochildi yoki ekran rasmga olindi (Window Blur)!");
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);

    this.cleanupFns.push(() => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    });
  }

  
  private detectDevTools() {
    // Window dimensions and console getters do not prove DevTools use.
    // Shortcut interception remains advisory; no heuristic auto-penalties.
  }

  private enforceFullScreen() {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        this.recordViolation('EXIT_FULLSCREEN', "To'liq ekran rejimidan chiqildi (Fullscreen Exited)!");
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    this.cleanupFns.push(() => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    });
  }

  
  private startHeartbeat() {
    if (!this.heartbeatEnabled) return;
    this.heartbeatTimer = setInterval(() => {
      if (this.isDestroyed) return;
      this.sendHeartbeat();
    }, this.heartbeatIntervalMs);
  }

  private sendHeartbeat() {
    if (!this.heartbeatEnabled || !this.sessionId || this.isDestroyed) return;
    apiClient.post(`/exams/${encodeURIComponent(this.olympiadId)}/heartbeat`, {
      sessionId: this.sessionId,
      clientTime: new Date().toISOString(),
    }).then((res: any) => {
      if (res?.isDisqualified) {
        this.onDisqualify(res.disqualificationReason || 'Heartbeat timeout tufayli diskvalifikatsiya qilindi.');
      }
    }).catch((err: any) => {
      console.warn('[ExamGuard] Heartbeat send error:', err?.message || err);
    });
  }

  public reportToServer(type: ExamViolationType, message: string) {
    if (this.sessionId) {
      const eventId = crypto.randomUUID();
      apiClient.post(`/exams/${encodeURIComponent(this.olympiadId)}/proctor-events`, {
        eventId,
        sessionId: this.sessionId,
        eventType: type,
        occurredAt: new Date().toISOString(),
        details: message,
      }).then((res: { violationCount: number; isDisqualified: boolean; disqualificationReason?: string }) => {
        if (this.isDestroyed) return;
        this.violationCount = res.violationCount;
        this.onViolation(type, { count: res.violationCount, max: this.maxViolations, message });
        if (res?.isDisqualified) {
          this.onDisqualify(res.disqualificationReason || 'Qoidabuzarliklar soni limitdan oshdi (server qarori).');
        }
      }).catch((err: any) => {
        console.warn('[ExamGuard] Proctor event API xatosi:', err?.message || err);
      });
    }
  }

  
  public destroy() {
    this.isDestroyed = true;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.devtoolsInterval) clearInterval(this.devtoolsInterval);
    this.cleanupFns.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.warn('ExamGuard cleanup error:', e);
      }
    });
    this.cleanupFns = [];
  }
}
