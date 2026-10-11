

export interface SystemStatsResponse {
  ram: {
    totalMb: number; 
    usedMb: number;
    freeMb: number;
    usagePercent: number;
  };
  disk: {
    totalGb: number; 
    usedGb: number;
    freeGb: number;
    usagePercent: number;
  };
  cpu: {
    model: string;
    cores: number;
    usagePercent: number;
    speedGhz: number;
  };
  network: {
    inMbPerSec: number;
    outMbPerSec: number;
    activeConnections: number;
  };
  uptime: string;
  threatLevel: 'low' | 'medium' | 'high';
  rateLimitHitsCount: number;
  recentSuspiciousIpCount: number;
  timestamp: string;
}

export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  ip: string;
  country: string;
  countryCode: string;
  type: 'login_success' | 'login_failed' | 'rate_limit' | 'ddos_detected' | 'api_access';
  level: 'info' | 'warning' | 'error' | 'critical';
  statusCode: number;
  message: string;
  userAgent?: string;
  userEmail?: string;
}

export const adminMonitoringService = {
  async getSystemStats(): Promise<SystemStatsResponse | null> {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    try {
      const res = await fetch(`${apiBase}/admin/system-metrics`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.metrics) {
          return json.metrics;
        }
      }
    } catch (err) {
      console.warn('Real server stats fetch error:', err);
    }

    return null;
  },

  async getSecurityLogs(): Promise<SecurityLogEntry[]> {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    try {
      const res = await fetch(`${apiBase}/admin/security-logs`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return [];
  }
};
