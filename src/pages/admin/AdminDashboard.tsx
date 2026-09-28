import React from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Card } from '../../components/common/Card';
import { Users, Trophy, ShieldAlert, Cpu, Activity, Server } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="flex bg-surface min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-black text-accent-900">Admin Platform Dashboard</h1>
            <p className="text-xs text-accent-500">Next Olymp System Management & Real-Time Monitoring</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200">
            <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>SERVER HEALTH: 100% OK</span>
          </div>
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <Card className="p-5 space-y-2">
            <div className="flex items-center justify-between text-accent-400">
              <span className="text-xs font-bold uppercase">Foydalanuvchilar</span>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-black text-accent-900 font-mono">15,420</div>
            <p className="text-[10px] text-emerald-600 font-semibold">+12% bu hafta</p>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="flex items-center justify-between text-accent-400">
              <span className="text-xs font-bold uppercase">Musobaqalar</span>
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-accent-900 font-mono">124</div>
            <p className="text-[10px] text-accent-500 font-semibold">2 ta aktiv</p>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="flex items-center justify-between text-accent-400">
              <span className="text-xs font-bold uppercase">Anti-Cheat Flags</span>
              <ShieldAlert className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-3xl font-black text-rose-600 font-mono">3 ta</div>
            <p className="text-[10px] text-rose-600 font-semibold">Tekshirish kutilmoqda</p>
          </Card>

          <Card className="p-5 space-y-2">
            <div className="flex items-center justify-between text-accent-400">
              <span className="text-xs font-bold uppercase">Socket.IO Latency</span>
              <Server className="w-5 h-5 text-secondary" />
            </div>
            <div className="text-3xl font-black text-accent-900 font-mono">14 ms</div>
            <p className="text-[10px] text-emerald-600 font-semibold">Redis sorted set sync</p>
          </Card>
        </div>
      </main>
    </div>
  );
};
