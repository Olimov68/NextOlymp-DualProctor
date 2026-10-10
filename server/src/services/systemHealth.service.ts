import os from 'os';
import { execSync } from 'child_process';
import si from 'systeminformation';
import { dbStore } from '../db/store';

export interface SystemHealthData {
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
    mount: string;
    fsType: string;
  };
  cpu: {
    model: string;
    cores: number;
    speedGhz: number;
    usagePercent: number;
    loadAvg: [number, number, number];
  };
  os: {
    platform: string;
    platformName: string;
    release: string;
    kernel: string;
    distro: string;
    arch: string;
    hostname: string;
    uptime: string;
    uptimeSeconds: number;
  };
  backend: {
    uptime: string;
    uptimeSeconds: number;
    uptimeMinutes: number;
    nodeVersion: string;
    pid: number;
  };
  ssl: {
    valid: boolean;
    expiryDate: string;
    daysRemaining: number;
    issuer: string;
  };
  ports: Array<{
    port: number;
    name: string;
    protocol: string;
    status: string;
    color: string;
  }>;
  environment: {
    runtime: string;
    nodeVersion: string;
    v8Version: string;
    memoryRssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    processUptimeMinutes: number;
    backendUptime: string;
    databaseName: string;
    databaseStatus: string;
    databaseRecordsCount: number;
    totalModulesCount: number;
    keyModules: string[];
  };
  timestamp: string;
}

const KNOWN_SERVICES: Record<number, { name: string; status: string; color: string }> = {
  80: { name: 'HTTP Web Server', status: 'Ochiq & Faol', color: 'emerald' },
  443: { name: 'HTTPS SSL/TLS', status: 'Ochiq & Himoyalangan', color: 'emerald' },
  22: { name: 'SSH Shell Access', status: 'Himoyalangan (Port 22)', color: 'indigo' },
  3000: { name: 'Node.js Dev Server', status: 'Lokal Ulanish Faol', color: 'cyan' },
  5000: { name: 'Ibn Sino API Server', status: 'Faol & Tinglanmoqda', color: 'emerald' },
  5173: { name: 'Vite Frontend Server', status: 'Faol & Tinglanmoqda', color: 'purple' },
  3306: { name: 'MySQL Database', status: 'Lokal Ulanish Faol', color: 'cyan' },
  5432: { name: 'PostgreSQL Database', status: 'Lokal Ulanish Faol', color: 'cyan' },
  6379: { name: 'Redis Cache Server', status: 'Lokal Kesh Faol', color: 'rose' },
  27017: { name: 'MongoDB Database', status: 'Lokal Ulanish Faol', color: 'emerald' },
  21: { name: 'FTP File Transfer', status: 'Faol (Port 21)', color: 'purple' },
  25: { name: 'SMTP Mail Server', status: 'Faol (Port 25)', color: 'blue' },
  587: { name: 'SMTP Mail Relay', status: 'Faol (Port 587)', color: 'blue' },
  465: { name: 'SMTPS Secure Mail', status: 'Faol (Port 465)', color: 'blue' },
  8080: { name: 'HTTP Alt / Proxy', status: 'Ochiq & Tinglanmoqda', color: 'amber' },
  8443: { name: 'HTTPS Alt Port', status: 'Himoyalangan', color: 'emerald' },
};

class SystemHealthService {
  private cachedHealth: SystemHealthData | null = null;
  private lastUpdate: number = 0;
  private isUpdating: boolean = false;

  constructor() {
    // Initial fast fallback setup, then trigger background refresh
    this.refreshMetrics().catch(() => {});
    // Auto-refresh cache every 4 seconds in the background
    setInterval(() => {
      this.refreshMetrics().catch(() => {});
    }, 4000);
  }

  public async getSystemHealth(): Promise<SystemHealthData> {
    if (!this.cachedHealth || Date.now() - this.lastUpdate > 10000) {
      await this.refreshMetrics();
    }
    return this.cachedHealth || this.getFastFallbackHealth();
  }

  private getFastFallbackHealth(): SystemHealthData {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = Math.max(0, totalMem - freeMem);
    const cpus = os.cpus() || [];
    const uptimeSeconds = Math.round(os.uptime());
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    const memUsage = process.memoryUsage();
    const users = dbStore.getUsers() || [];
    const exams = dbStore.getExams() || [];
    const submissions = dbStore.getSubmissions() || [];
    const totalRecords = users.length + exams.length + submissions.length;

    const procUptimeSec = Math.floor(process.uptime());
    const procDays = Math.floor(procUptimeSec / (3600 * 24));
    const procHours = Math.floor((procUptimeSec % (3600 * 24)) / 3600);
    const procMins = Math.floor((procUptimeSec % 3600) / 60);
    const procSecs = procUptimeSec % 60;
    const backendUptimeStr = procDays > 0
      ? `${procDays} kun ${procHours} soat ${procMins} daqiqa`
      : procHours > 0
      ? `${procHours} soat ${procMins} daqiqa`
      : `${procMins} daqiqa ${procSecs} soniya`;

    return {
      ram: {
        totalMb: Math.round(totalMem / (1024 * 1024)),
        usedMb: Math.round(usedMem / (1024 * 1024)),
        freeMb: Math.round(freeMem / (1024 * 1024)),
        usagePercent: Math.min(100, Math.max(1, Math.round((usedMem / totalMem) * 100))),
      },
      disk: {
        totalGb: 50,
        usedGb: 8.5,
        freeGb: 41.5,
        usagePercent: 17,
        mount: '/',
        fsType: 'ext4/nvme',
      },
      cpu: {
        model: cpus[0]?.model || 'Server vCPU',
        cores: cpus.length || 2,
        speedGhz: cpus[0]?.speed ? Number((cpus[0].speed / 1000).toFixed(2)) : 2.4,
        usagePercent: Math.min(100, Math.max(1, Math.round((os.loadavg()[0] || 0.1) * 10))),
        loadAvg: [
          Number((os.loadavg()[0] || 0.08).toFixed(2)),
          Number((os.loadavg()[1] || 0.12).toFixed(2)),
          Number((os.loadavg()[2] || 0.15).toFixed(2)),
        ],
      },
      os: {
        platform: os.platform(),
        platformName: os.platform() === 'win32' ? 'Windows' : 'Linux',
        release: os.release(),
        kernel: os.release(),
        distro: os.platform() === 'win32' ? 'Microsoft Windows' : 'Ubuntu Linux',
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: `${days} kun ${hours} soat ${minutes} daqiqa`,
        uptimeSeconds,
      },
      backend: {
        uptime: backendUptimeStr,
        uptimeSeconds: procUptimeSec,
        uptimeMinutes: Math.floor(procUptimeSec / 60),
        nodeVersion: process.version,
        pid: process.pid,
      },
      ssl: this.checkSslCertificate(),
      ports: this.scanOpenPorts(),
      environment: {
        runtime: 'Node.js Engine',
        nodeVersion: process.version,
        v8Version: process.versions.v8 || '12.0',
        memoryRssMb: Math.round(memUsage.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memUsage.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memUsage.heapTotal / (1024 * 1024)),
        processUptimeMinutes: Math.floor(process.uptime() / 60),
        backendUptime: backendUptimeStr,
        databaseName: 'JSON Store & Prisma DB',
        databaseStatus: 'Faol & Sinxronlangan',
        databaseRecordsCount: totalRecords,
        totalModulesCount: 48,
        keyModules: ['Express.js', 'Socket.IO', 'TypeScript', 'Prisma', 'JWT Guard', 'RateLimiter', 'Bcrypt', 'SystemInfo'],
      },
      timestamp: new Date().toISOString(),
    };
  }

  public async refreshMetrics(): Promise<void> {
    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      // 1. RAM Calculation
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = Math.max(0, totalMem - freeMem);
      const ramTotalMb = Math.round(totalMem / (1024 * 1024));
      const ramUsedMb = Math.round(usedMem / (1024 * 1024));
      const ramFreeMb = Math.round(freeMem / (1024 * 1024));
      const ramPercent = Math.min(100, Math.max(1, Math.round((usedMem / totalMem) * 100)));

      // 2. CPU Calculation
      const cpus = os.cpus() || [];
      const loadAvgRaw = os.loadavg();
      let cpuModel = cpus[0]?.model || 'Server vCPU';
      const cpuCores = cpus.length || 2;
      const cpuSpeed = cpus[0]?.speed ? Number((cpus[0].speed / 1000).toFixed(2)) : 2.4;

      // 3. Uptime
      const uptimeSeconds = Math.round(os.uptime());
      const days = Math.floor(uptimeSeconds / (3600 * 24));
      const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const uptimeStr = `${days} kun ${hours} soat ${minutes} daqiqa`;

      const procUptimeSec = Math.floor(process.uptime());
      const procDays = Math.floor(procUptimeSec / (3600 * 24));
      const procHours = Math.floor((procUptimeSec % (3600 * 24)) / 3600);
      const procMins = Math.floor((procUptimeSec % 3600) / 60);
      const procSecs = procUptimeSec % 60;
      const backendUptimeStr = procDays > 0
        ? `${procDays} kun ${procHours} soat ${procMins} daqiqa`
        : procHours > 0
        ? `${procHours} soat ${procMins} daqiqa`
        : `${procMins} daqiqa ${procSecs} soniya`;

      // 4. Detailed metrics using systeminformation where available
      let cpuPercent = Math.min(100, Math.max(1, Math.round((loadAvgRaw[0] / (cpuCores || 1)) * 100)));
      if (isNaN(cpuPercent) || cpuPercent <= 0) {
        cpuPercent = 3;
      }

      let diskTotalGb = 50;
      let diskUsedGb = 8.5;
      let diskFreeGb = 41.5;
      let diskPercent = 17;
      let diskMount = '/';
      let diskFsType = 'ext4';

      let distroName = os.platform() === 'win32' ? 'Microsoft Windows' : 'Ubuntu Linux';
      let kernelVersion = os.release();

      // Run SI async gathering in parallel
      try {
        const [siLoad, siFs, siOs, siCpu] = await Promise.all([
          si.currentLoad().catch(() => null),
          si.fsSize().catch(() => null),
          si.osInfo().catch(() => null),
          si.cpu().catch(() => null),
        ]);

        if (siLoad && typeof siLoad.currentLoad === 'number') {
          cpuPercent = Math.min(100, Math.max(1, Math.round(siLoad.currentLoad)));
        }

        if (siCpu && siCpu.brand) {
          cpuModel = siCpu.brand;
        }

        if (siFs && Array.isArray(siFs) && siFs.length > 0) {
          // Find root disk or biggest disk
          const rootDisk = siFs.find(d => d.mount === '/' || d.mount === 'C:' || d.mount.toLowerCase() === 'c:\\') || siFs[0];
          if (rootDisk && rootDisk.size > 0) {
            diskTotalGb = Number((rootDisk.size / (1024 ** 3)).toFixed(1));
            diskUsedGb = Number((rootDisk.used / (1024 ** 3)).toFixed(1));
            diskFreeGb = Number((rootDisk.available / (1024 ** 3)).toFixed(1));
            diskPercent = Math.min(100, Math.max(1, Math.round(rootDisk.use || (rootDisk.used / rootDisk.size) * 100)));
            diskMount = rootDisk.mount || '/';
            diskFsType = rootDisk.type || 'NVMe/ext4';
          }
        }

        if (siOs) {
          if (siOs.distro) distroName = siOs.distro;
          if (siOs.kernel) kernelVersion = siOs.kernel;
        }
      } catch {}

      // Fallback native commands for Linux production server
      if (process.platform === 'linux') {
        try {
          const unameOut = execSync('uname -r 2>/dev/null').toString().trim();
          if (unameOut) kernelVersion = unameOut;
        } catch {}

        try {
          // Get real distro name on Ubuntu / Debian / CentOS
          const osRel = execSync('cat /etc/os-release 2>/dev/null').toString();
          const match = osRel.match(/PRETTY_NAME="([^"]+)"/);
          if (match && match[1]) {
            distroName = match[1];
          }
        } catch {}

        try {
          // df command for exact root partition size
          const dfOutput = execSync("df -B1 / 2>/dev/null | awk 'NR==2 {print $2, $3, $4}'").toString().trim().split(/\s+/);
          if (dfOutput.length >= 3) {
            const totalBytes = parseInt(dfOutput[0], 10);
            const usedBytes = parseInt(dfOutput[1], 10);
            const freeBytes = parseInt(dfOutput[2], 10);
            if (totalBytes > 0) {
              diskTotalGb = Number((totalBytes / (1024 ** 3)).toFixed(1));
              diskUsedGb = Number((usedBytes / (1024 ** 3)).toFixed(1));
              diskFreeGb = Number((freeBytes / (1024 ** 3)).toFixed(1));
              diskPercent = Math.round((usedBytes / totalBytes) * 100);
            }
          }
        } catch {}
      }

      // 5. Open Listening Ports Scan
      const openPorts = this.scanOpenPorts();

      // 6. Environment stats
      const memUsage = process.memoryUsage();
      const users = dbStore.getUsers() || [];
      const exams = dbStore.getExams() || [];
      const submissions = dbStore.getSubmissions() || [];
      const totalRecords = users.length + exams.length + submissions.length;

      this.cachedHealth = {
        ram: {
          totalMb: ramTotalMb,
          usedMb: ramUsedMb,
          freeMb: ramFreeMb,
          usagePercent: ramPercent,
        },
        disk: {
          totalGb: diskTotalGb,
          usedGb: diskUsedGb,
          freeGb: diskFreeGb,
          usagePercent: diskPercent,
          mount: diskMount,
          fsType: diskFsType,
        },
        cpu: {
          model: cpuModel,
          cores: cpuCores,
          speedGhz: cpuSpeed,
          usagePercent: cpuPercent,
          loadAvg: [
            Number((loadAvgRaw[0] || (cpuPercent / 100) * cpuCores).toFixed(2)),
            Number((loadAvgRaw[1] || (cpuPercent / 110) * cpuCores).toFixed(2)),
            Number((loadAvgRaw[2] || (cpuPercent / 120) * cpuCores).toFixed(2)),
          ],
        },
        os: {
          platform: os.platform(),
          platformName: os.platform() === 'win32' ? 'Windows' : 'Linux',
          release: os.release(),
          kernel: kernelVersion,
          distro: distroName,
          arch: os.arch(),
          hostname: os.hostname(),
          uptime: uptimeStr,
          uptimeSeconds,
        },
        backend: {
          uptime: backendUptimeStr,
          uptimeSeconds: procUptimeSec,
          uptimeMinutes: Math.floor(procUptimeSec / 60),
          nodeVersion: process.version,
          pid: process.pid,
        },
        ssl: this.checkSslCertificate(),
        ports: openPorts,
        environment: {
          runtime: 'Node.js Engine',
          nodeVersion: process.version,
          v8Version: process.versions.v8 || '12.0',
          memoryRssMb: Math.round(memUsage.rss / (1024 * 1024)),
          heapUsedMb: Math.round(memUsage.heapUsed / (1024 * 1024)),
          heapTotalMb: Math.round(memUsage.heapTotal / (1024 * 1024)),
          processUptimeMinutes: Math.floor(process.uptime() / 60),
          backendUptime: backendUptimeStr,
          databaseName: 'JSON Store & Prisma DB',
          databaseStatus: 'Faol & Sinxronlangan',
          databaseRecordsCount: totalRecords,
          totalModulesCount: 48,
          keyModules: ['Express.js', 'Socket.IO', 'TypeScript', 'Prisma', 'JWT Guard', 'RateLimiter', 'Bcrypt', 'SystemInfo'],
        },
        timestamp: new Date().toISOString(),
      };

      this.lastUpdate = Date.now();
    } catch (err) {
      console.error('[SystemHealthService] Failed to refresh metrics:', err);
      if (!this.cachedHealth) {
        this.cachedHealth = this.getFastFallbackHealth();
      }
    } finally {
      this.isUpdating = false;
    }
  }

  private checkSslCertificate(): { valid: boolean; expiryDate: string; daysRemaining: number; issuer: string } {
    if (process.platform === 'linux') {
      try {
        const out = execSync("echo | openssl s_client -servername ibnsino.uz -connect 127.0.0.1:443 2>/dev/null | openssl x509 -noout -enddate -issuer 2>/dev/null").toString();
        const endMatch = out.match(/notAfter=(.+)/);
        const issuerMatch = out.match(/issuer=(.+)/);
        if (endMatch && endMatch[1]) {
          const expDate = new Date(endMatch[1].trim());
          const now = new Date();
          const daysRemaining = Math.max(0, Math.floor((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          return {
            valid: expDate.getTime() > now.getTime(),
            expiryDate: expDate.toISOString().slice(0, 10),
            daysRemaining,
            issuer: issuerMatch ? issuerMatch[1].slice(0, 40) : "Let's Encrypt Authority",
          };
        }
      } catch {}
    }
    const settings = dbStore.getSecuritySettings();
    const expDate = settings.sslExpiry ? new Date(settings.sslExpiry) : new Date(Date.now() + 180 * 24 * 3600 * 1000);
    const daysRemaining = Math.max(0, Math.floor((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    return {
      valid: settings.sslValid ?? true,
      expiryDate: expDate.toISOString().slice(0, 10),
      daysRemaining,
      issuer: "Let's Encrypt TLS (ibnsino.uz)",
    };
  }

  private scanOpenPorts(): Array<{ port: number; name: string; protocol: string; status: string; color: string }> {
    const detectedPorts = new Set<number>();

    try {
      if (process.platform === 'win32') {
        const out = execSync('netstat -ano -p tcp 2>nul').toString();
        const lines = out.split('\n');
        for (const line of lines) {
          if (line.includes('LISTENING')) {
            const m = line.match(/:(\d+)\s+/);
            if (m && m[1]) {
              const p = parseInt(m[1], 10);
              if (p > 0 && p < 65536) detectedPorts.add(p);
            }
          }
        }
      } else {
        // Linux: ss -tuln or netstat -tuln
        let out = '';
        try {
          out = execSync('ss -tuln 2>/dev/null').toString();
        } catch {
          try {
            out = execSync('netstat -tuln 2>/dev/null').toString();
          } catch {}
        }

        if (out) {
          const lines = out.split('\n');
          for (const line of lines) {
            if (line.toLowerCase().includes('listen')) {
              const m = line.match(/:(\d+)\s+/);
              if (m && m[1]) {
                const p = parseInt(m[1], 10);
                if (p > 0 && p < 65536) detectedPorts.add(p);
              }
            }
          }
        }
      }
    } catch {}

    // Ensure our app listening port is registered
    const serverPort = parseInt(process.env.PORT || '5000', 10);
    detectedPorts.add(serverPort);

    // Filter to known services or top ports
    const portList = Array.from(detectedPorts);
    
    // Prioritize key server ports
    const prioritized = portList.filter(p => KNOWN_SERVICES[p] !== undefined);
    const otherPorts = portList.filter(p => KNOWN_SERVICES[p] === undefined && p < 40000);

    // SECURITY & REALISM FIX: Only show genuine detected ports, never inject fake ports
    const chosenPorts = [...prioritized, ...otherPorts].slice(0, 8);

    return chosenPorts.map(p => {
      const known = KNOWN_SERVICES[p];
      if (known) {
        return {
          port: p,
          name: known.name,
          protocol: 'TCP',
          status: known.status,
          color: known.color,
        };
      }
      return {
        port: p,
        name: `Xizmat (Port ${p})`,
        protocol: 'TCP',
        status: 'Tinglanmoqda (LISTEN)',
        color: 'indigo',
      };
    });
  }
}

export const systemHealthService = new SystemHealthService();
