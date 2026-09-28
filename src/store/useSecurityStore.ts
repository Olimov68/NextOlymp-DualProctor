
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AccessLog,
  ActionLog,
  TrafficDataPoint,
  SecurityAlert,
  BlockedIP,
  initialAccessLogs,
  initialActionLogs,
  initialTrafficData,
  initialSecurityAlerts,
  initialBlockedIPs,
} from '../data/initialSecurityLogs';

export interface ServerMetrics {
  cpu: number;
  ram: number; 
  disk: number; 
  ramTotalMb: number; 
  ramUsedMb: number; 
  ramFreeMb: number; 
  diskTotalGb: number; 
  diskUsedGb: number; 
  diskFreeGb: number; 
  network: { in: number; out: number };
  uptime: string;
  activeConnections: number;
  requestsPerSec: number;
  responseTimeAvg: number;
  sslValid: boolean;
  sslExpiry: string;
  openPorts: number[];
  processes: number;
  threatLevel: 'low' | 'medium' | 'high';
  rateLimitHits: number;
  failedLoginAttemptsCount: number;
}

export interface DefenseStatus {
  ddosProtection: boolean;
  rateLimit: boolean;
  rateLimitValue: number; 
  waf: boolean;
  sslTls: boolean;
  geoBlocking: boolean;
  botDetection: boolean;
  bruteForceProtection: boolean;
  twoFactor: boolean;
  ipWhitelist: boolean;
  captcha: boolean;
  intrusionDetection: boolean;
}

interface SecurityState {
  accessLogs: AccessLog[];
  actionLogs: ActionLog[];
  trafficData: TrafficDataPoint[];
  alerts: SecurityAlert[];
  blockedIPs: BlockedIP[];
  liveMode: boolean;
  serverMetrics: ServerMetrics;
  defenseStatus: DefenseStatus;
  autoDefend: boolean;

  blockIP: (ip: string, country: string, countryCode: string, reason: string, permanent?: boolean) => void;
  unblockIP: (ip: string) => void;
  resolveAlert: (id: string) => void;
  updateAlertStatus: (id: string, status: SecurityAlert['status']) => void;
  setLiveMode: (v: boolean) => void;
  addAccessLog: (log: AccessLog) => void;
  setTrafficData: (data: TrafficDataPoint[]) => void;
  setBlockedIPs: (ips: BlockedIP[]) => void;
  clearLogs: () => void;
  toggleDefense: (key: keyof DefenseStatus) => void;
  setAutoDefend: (v: boolean) => void;
  updateServerMetrics: (partial: Partial<ServerMetrics>) => void;
  recordFailedLogin: (ip: string, email: string, reason: string) => void;
  recordSuccessfulLogin: (ip: string, email: string, role: string) => void;
  recordRateLimitHit: (ip: string, path: string) => void;
}

const STORAGE_KEY = 'ega_security_v6';

const DEFAULT_METRICS: ServerMetrics = {
  cpu: 2,
  ram: 4,
  disk: 1,
  ramTotalMb: 1024,
  ramUsedMb: 48,
  ramFreeMb: 976,
  diskTotalGb: 25,
  diskUsedGb: 0.1,
  diskFreeGb: 24.9,
  network: { in: 0.0, out: 0.0 },
  uptime: '0 kun 1 soat 24 daqiqa',
  activeConnections: 1,
  requestsPerSec: 0,
  responseTimeAvg: 12,
  sslValid: true,
  sslExpiry: '2027-03-15',
  openPorts: [80, 443, 22],
  processes: 12,
  threatLevel: 'low',
  rateLimitHits: 0,
  failedLoginAttemptsCount: 0,
};

const DEFAULT_DEFENSE: DefenseStatus = {
  ddosProtection: true,
  rateLimit: true,
  rateLimitValue: 120,
  waf: true,
  sslTls: true,
  geoBlocking: false,
  botDetection: true,
  bruteForceProtection: true,
  twoFactor: false,
  ipWhitelist: false,
  captcha: true,
  intrusionDetection: true,
};

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      accessLogs: initialAccessLogs,
      actionLogs: initialActionLogs,
      trafficData: initialTrafficData,
      alerts: initialSecurityAlerts,
      blockedIPs: initialBlockedIPs,
      liveMode: true,
      serverMetrics: DEFAULT_METRICS,
      defenseStatus: DEFAULT_DEFENSE,
      autoDefend: true,

      blockIP: (ip, country, countryCode, reason, permanent = false) => {
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
        const newBlocked: BlockedIP = {
          ip,
          country: country || 'Noma\'lum',
          countryCode: countryCode || 'XX',
          reason,
          blockedAt: now,
          expiresAt: permanent ? 'Hech qachon' : new Date(Date.now() + 86400000).toISOString().replace('T', ' ').slice(0, 16),
          permanent,
          requestCount: 1,
        };

        const existing = get().blockedIPs.filter((b) => b.ip !== ip);
        set({ blockedIPs: [newBlocked, ...existing] });

        
        const updatedAlerts = get().alerts.map((a) =>
          a.ip === ip ? { ...a, status: 'blocked' as const } : a
        );
        set({ alerts: updatedAlerts });

        
        const actionLog: ActionLog = {
          id: `act-${Date.now()}`,
          timestamp: now,
          ip,
          userId: 'U-ADM-001',
          userName: 'EGA Admin (Manual/Auto)',
          role: 'admin',
          action: 'BLOCK_IP',
          resource: `ips/${ip}`,
          detail: `Bloklandi: ${reason} (${permanent ? 'Doimiy' : '24 soat'})`,
          success: true,
          level: 'warning',
        };
        set({ actionLogs: [actionLog, ...get().actionLogs] });
      },

      unblockIP: (ip) => {
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
        set({ blockedIPs: get().blockedIPs.filter((b) => b.ip !== ip) });

        const actionLog: ActionLog = {
          id: `act-${Date.now()}`,
          timestamp: now,
          ip,
          userId: 'U-ADM-001',
          userName: 'EGA Admin',
          role: 'admin',
          action: 'UNBLOCK_IP',
          resource: `ips/${ip}`,
          detail: 'Blokdan chiqarildi',
          success: true,
          level: 'info',
        };
        set({ actionLogs: [actionLog, ...get().actionLogs] });
      },

      resolveAlert: (id) => {
        const updated = get().alerts.map((a) => (a.id === id ? { ...a, status: 'resolved' as const } : a));
        set({ alerts: updated });
      },

      updateAlertStatus: (id, status) => {
        const updated = get().alerts.map((a) => (a.id === id ? { ...a, status } : a));
        set({ alerts: updated });
      },

      setLiveMode: (v) => set({ liveMode: v }),

      setTrafficData: (data) => set({ trafficData: data }),

      setBlockedIPs: (ips) => set({ blockedIPs: ips }),

      addAccessLog: (log) => {
        const current = get().accessLogs;
        set({ accessLogs: [log, ...current.slice(0, 499)] });
      },

      clearLogs: () => set({ accessLogs: [] }),

      toggleDefense: (key) => {
        const current = get().defenseStatus;
        const updated = { ...current, [key]: !current[key] };
        set({ defenseStatus: updated });

        const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
        const actionLog: ActionLog = {
          id: `act-${Date.now()}`,
          timestamp: now,
          ip: '127.0.0.1',
          userId: 'U-ADM-001',
          userName: 'EGA Admin',
          role: 'admin',
          action: updated[key] ? 'WHITELIST_ADD' : 'FIREWALL_RULE',
          resource: `defense/${String(key)}`,
          detail: `${String(key)} ${updated[key] ? 'yoqildi' : 'o\'chirildi'}`,
          success: true,
          level: 'info',
        };
        set({ actionLogs: [actionLog, ...get().actionLogs] });
      },

      setAutoDefend: (v) => set({ autoDefend: v }),

      updateServerMetrics: (partial) => {
        set({ serverMetrics: { ...get().serverMetrics, ...partial } });
      },

      recordFailedLogin: (ip, email, reason) => {
        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const newLog: AccessLog = {
          id: `acc-fail-${Date.now()}`,
          timestamp: now,
          ip,
          method: 'POST',
          path: '/api/v1/auth/login',
          statusCode: 401,
          responseTimeMs: Math.floor(Math.random() * 80) + 40,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          country: 'Uzbekistan',
          countryCode: 'UZ',
          level: 'error',
          userName: email,
          bytesSent: 340,
        };

        const currentMetrics = get().serverMetrics;
        set({
          accessLogs: [newLog, ...get().accessLogs.slice(0, 499)],
          serverMetrics: {
            ...currentMetrics,
            failedLoginAttemptsCount: (currentMetrics.failedLoginAttemptsCount || 0) + 1,
          },
        });

        
        const recentFails = get().accessLogs.filter(
          (l) => l.ip === ip && l.statusCode === 401 && l.path.includes('login')
        ).length;

        if (recentFails >= 3 && get().autoDefend) {
          get().blockIP(ip, 'Uzbekistan', 'UZ', `Ketma-ket ${recentFails} ta muvaffaqiyatsiz kirish urinishi: ${reason}`);
        }
      },

      recordSuccessfulLogin: (ip, email, role) => {
        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const newLog: AccessLog = {
          id: `acc-ok-${Date.now()}`,
          timestamp: now,
          ip,
          method: 'POST',
          path: '/api/v1/auth/login',
          statusCode: 200,
          responseTimeMs: Math.floor(Math.random() * 60) + 30,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          country: 'Uzbekistan',
          countryCode: 'UZ',
          level: 'info',
          userName: `${email} (${role})`,
          bytesSent: 512,
        };
        set({ accessLogs: [newLog, ...get().accessLogs.slice(0, 499)] });
      },

      recordRateLimitHit: (ip, path) => {
        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const newLog: AccessLog = {
          id: `acc-rl-${Date.now()}`,
          timestamp: now,
          ip,
          method: 'GET',
          path,
          statusCode: 429,
          responseTimeMs: 12,
          userAgent: 'Automated-Bot/1.0',
          country: 'Unknown',
          countryCode: 'XX',
          level: 'warning',
          bytesSent: 128,
        };

        const currentMetrics = get().serverMetrics;
        set({
          accessLogs: [newLog, ...get().accessLogs.slice(0, 499)],
          serverMetrics: {
            ...currentMetrics,
            rateLimitHits: (currentMetrics.rateLimitHits || 0) + 1,
          },
        });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        blockedIPs: state.blockedIPs,
        defenseStatus: state.defenseStatus,
        autoDefend: state.autoDefend,
      }),
    }
  )
);
