import React from 'react';
import { Card } from '../../components/common/Card';
import { Users, Trophy, Award } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8 text-zinc-100">
      <div>
        <h1 className="text-2xl font-black text-zinc-100">O'qituvchi Kabineti</h1>
        <p className="text-xs text-zinc-400">{user?.school || '1-sonli ixtisoslashtirilgan maktab'} • Biriktirilgan o'quvchilar nazorati</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card hoverEffect className="p-5 flex items-center gap-4 bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-zinc-100">48 ta</div>
            <div className="text-xs text-zinc-400 font-semibold">Biriktirilgan o'quvchilar</div>
          </div>
        </Card>

        <Card hoverEffect className="p-5 flex items-center gap-4 bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">89.4%</div>
            <div className="text-xs text-zinc-400 font-semibold">O'rtacha o'zlashtirish ko'rsatkichi</div>
          </div>
        </Card>

        <Card hoverEffect className="p-5 flex items-center gap-4 bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400">12 ta</div>
            <div className="text-xs text-zinc-400 font-semibold">Sovrindor o'quvchilar</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
