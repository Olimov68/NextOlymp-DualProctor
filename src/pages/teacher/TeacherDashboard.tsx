import React from 'react';
import { Card } from '../../components/common/Card';
import { Users, Trophy, Award } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#F1F5F9]">O'qituvchi Kabineti</h1>
        <p className="text-xs text-[#94A3B8]">{user?.school || '1-sonli ixtisoslashtirilgan maktab'} • Biriktirilgan o'quvchilar nazorati</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card hoverEffect className="p-5 flex items-center gap-4 bg-[#111827] border border-[#1E293B]">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#F1F5F9]">48 ta</div>
            <div className="text-xs text-[#94A3B8] font-semibold">Biriktirilgan o'quvchilar</div>
          </div>
        </Card>

        <Card hoverEffect className="p-5 flex items-center gap-4 bg-[#111827] border border-[#1E293B]">
          <div className="w-12 h-12 rounded-xl bg-[#10B981]/15 text-[#10B981] flex items-center justify-center font-bold">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#10B981]">89.4%</div>
            <div className="text-xs text-[#94A3B8] font-semibold">O'rtacha o'zlashtirish ko'rsatkichi</div>
          </div>
        </Card>

        <Card hoverEffect className="p-5 flex items-center gap-4 bg-[#111827] border border-[#1E293B]">
          <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#F59E0B]">12 ta</div>
            <div className="text-xs text-[#94A3B8] font-semibold">Sovrindor o'quvchilar</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
