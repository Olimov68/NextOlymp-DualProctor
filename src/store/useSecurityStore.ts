
import { create } from 'zustand';

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
  backendUptime?: string;
  systemUptime?: string;
  hardwareSpecs?: string;
  activeConnections: number;
  requestsPerSec: number;
  responseTimeAvg: number;
  sslValid: boolean | null;
  sslExpiry: string;
  sslIssuer?: string;
  sslDaysRemaining?: number;
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
}

const STORAGE_KEY = 'ega_security_v7_real';

// Clear legacy fake cache if present
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('ega_security_v6');
  } catch {}
}

const DEFAULT_METRICS: ServerMetrics = {
  cpu: 0,
  ram: 0,
  disk: 0,
  ramTotalMb: 0,
  ramUsedMb: 0,
  ramFreeMb: 0,
  diskTotalGb: 0,
  diskUsedGb: 0,
  diskFreeGb: 0,
  network: { in: 0.0, out: 0.0 },
  uptime: 'Aniqlanmoqda...',
  backendUptime: 'Aniqlanmoqda...',
  systemUptime: 'Aniqlanmoqda...',
  activeConnections: 0,
  requestsPerSec: 0,
  responseTimeAvg: 0,
  sslValid: null,
  sslExpiry: 'Aniqlanmoqda...',
  openPorts: [],
  processes: 0,
  threatLevel: 'low',
  rateLimitHits: 0,
  failedLoginAttemptsCount: 0,
};

const DEFAULT_DEFENSE: DefenseStatus = {
  ddosProtection: false,
  rateLimit: false,
  rateLimitValue: 120,
  waf: false,
  sslTls: false,
  geoBlocking: false,
  botDetection: false,
  bruteForceProtection: true,
  twoFactor: false,
  ipWhitelist: false,
  captcha: false,
  intrusionDetection: false,
};

export const useSecurityStore = create<SecurityState>()(
  (set, get) => ({
      accessLogs: [],
      actionLogs: [],
      trafficData: [],
      alerts: [],
      blockedIPs: [],
      liveMode: true,
      serverMetrics: DEFAULT_METRICS,
      defenseStatus: DEFAULT_DEFENSE,
      autoDefend: false,

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

    })
);
