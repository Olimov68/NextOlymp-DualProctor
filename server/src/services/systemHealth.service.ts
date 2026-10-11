import os from 'node:os';
import fs from 'node:fs';
import { X509Certificate } from 'node:crypto';
import si from 'systeminformation';
import { dbStore } from '../db/store';
import { databasePool } from '../db/transactionStore';

function duration(seconds: number) {
  return `${Math.floor(seconds / 86400)} kun ${Math.floor(seconds % 86400 / 3600)} soat ${Math.floor(seconds % 3600 / 60)} daqiqa`;
}
function tlsStatus() {
  // Reverse proxy owns TLS. Read only the explicitly configured PUBLIC certificate.
  // This reports certificate dates, not trust-chain validation or negotiated TLS version.
  try {
    if (!process.env.TLS_CERT_PATH) throw new Error('not configured');
    const certificate = new X509Certificate(fs.readFileSync(process.env.TLS_CERT_PATH));
    const expires = Date.parse(certificate.validTo);
    const begins = Date.parse(certificate.validFrom);
    return { valid: Date.now() >= begins && Date.now() < expires,
      expiryDate: new Date(expires).toISOString().slice(0, 10),
      daysRemaining: Math.floor((expires - Date.now()) / 86400000),
      issuer: certificate.issuer, source: 'configured-certificate-dates' };
  } catch {
    return { valid: null, expiryDate: null, daysRemaining: null, issuer: null, source: 'unavailable' };
  }
}

class SystemHealthService {
  public async getSystemHealth() {
    const [load, disks, info, connections] = await Promise.all([
      si.currentLoad().catch(() => null), si.fsSize().catch(() => null),
      si.osInfo().catch(() => null), si.networkConnections().catch(() => null),
    ]);
    const disk = disks?.find(d => d.mount === '/' || /^c:\\?$/i.test(d.mount)) ?? disks?.[0];
    const cpus = os.cpus();
    const total = os.totalmem(), free = os.freemem();
    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor(os.uptime());
    const processSeconds = Math.floor(process.uptime());
    const keyModules = ['Express', 'Socket.IO', 'JWT', 'bcrypt', 'systeminformation', databasePool ? 'PostgreSQL' : 'development JSON'];
    const gb = (bytes: number | undefined) => bytes === undefined ? null : Number((bytes / 1024 ** 3).toFixed(2));
    return {
      ram: { totalMb: Math.round(total / 1048576), usedMb: Math.round((total - free) / 1048576),
        freeMb: Math.round(free / 1048576), usagePercent: Math.round((total - free) / total * 100) },
      disk: { totalGb: gb(disk?.size), usedGb: gb(disk?.used), freeGb: gb(disk?.available),
        usagePercent: disk ? Math.round(disk.use) : null, mount: disk?.mount ?? null, fsType: disk?.type ?? null },
      cpu: { model: cpus[0]?.model ?? 'Aniqlanmadi', cores: cpus.length,
        speedGhz: cpus[0]?.speed ? cpus[0].speed / 1000 : null,
        usagePercent: load && Number.isFinite(load.currentLoad) ? Math.round(load.currentLoad * 100) / 100 : null,
        loadAvg: os.platform() === 'win32' ? [null, null, null] : os.loadavg() },
      os: { platform: os.platform(), platformName: os.type(), release: os.release(), kernel: os.release(),
        distro: info?.distro ?? os.type(), arch: os.arch(), hostname: os.hostname(),
        uptime: duration(uptimeSeconds), uptimeSeconds },
      backend: { uptime: duration(processSeconds), uptimeSeconds: processSeconds,
        uptimeMinutes: Math.floor(processSeconds / 60), nodeVersion: process.version, pid: process.pid },
      ssl: tlsStatus(),
      ports: (connections ?? []).filter(c => c.state === 'LISTEN').slice(0, 20).map(c => ({
        port: Number(c.localPort), name: c.process || 'Tinglayotgan xizmat', protocol: c.protocol,
        status: 'LISTEN — bu himoyalangan degani emas', color: 'indigo',
      })),
      environment: { runtime: 'Node.js', nodeVersion: process.version, v8Version: process.versions.v8,
        memoryRssMb: Math.round(memory.rss / 1048576), heapUsedMb: Math.round(memory.heapUsed / 1048576),
        heapTotalMb: Math.round(memory.heapTotal / 1048576), processUptimeMinutes: Math.floor(processSeconds / 60),
        backendUptime: duration(processSeconds), databaseName: databasePool ? 'PostgreSQL' : 'Development JSON',
        databaseStatus: 'Joriy so‘rovda o‘qildi',
        databaseRecordsCount: dbStore.getUsers().length + dbStore.getExams().length + dbStore.getSubmissions().length,
        totalModulesCount: keyModules.length, keyModules },
      timestamp: new Date().toISOString(),
    };
  }
}
export type SystemHealthData = Awaited<ReturnType<SystemHealthService['getSystemHealth']>>;
export const systemHealthService = new SystemHealthService();
