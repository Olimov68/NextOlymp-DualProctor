import React from 'react';
import { Users, Radio, Trophy, ShieldAlert, Award, TrendingUp } from 'lucide-react';
import { Card } from '../common/Card';
import { MOCK_OLYMPIADS, MOCK_LEADERBOARD, MOCK_CERTIFICATES } from '../../services/mockData';

export const EgaMetricCards: React.FC = () => {
  const totalCompetitions = MOCK_OLYMPIADS.length;
  const activeCompetitions = MOCK_OLYMPIADS.filter((o) => o.status === 'active').length;
  const finishedCompetitions = MOCK_OLYMPIADS.filter((o) => o.status === 'finished').length;
  const totalParticipants = MOCK_OLYMPIADS.reduce((acc, curr) => acc + (curr.participantsCount || 0), 0);
  const activeParticipants = MOCK_LEADERBOARD.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-sans">
      
      <Card className="p-5 bg-white border border-slate-200 shadow-2xs hover:border-blue-500 hover:shadow-md transition-all space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
            Jami O‘quvchilar
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalParticipants > 0 ? totalParticipants.toLocaleString() : 0}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
            <span>Tizim noldan shakllanmoqda</span>
          </div>
        </div>
      </Card>

      
      <Card className="p-5 bg-white border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
            Faol Qatnashuvchilar
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold relative">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{activeParticipants}</span>
            {activeParticipants > 0 && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div className="text-[11px] font-bold text-emerald-600">
            {activeParticipants > 0 ? "Hozir test yechmoqda" : "Hozir faol test yo'q"}
          </div>
        </div>
      </Card>

      
      <Card className="p-5 bg-white border border-slate-200 shadow-2xs hover:border-amber-500 hover:shadow-md transition-all space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
            Fan Olimpiadalari
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-black text-slate-900 font-mono">{totalCompetitions} ta</div>
          <div className="text-[11px] font-semibold text-slate-500">
            {activeCompetitions} ta faol • {finishedCompetitions} yakunlangan
          </div>
        </div>
      </Card>

      
      <Card className="p-5 bg-white border border-slate-200 shadow-2xs hover:border-rose-500 hover:shadow-md transition-all space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
            Shubhali Harakatlar
          </span>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-black text-slate-900 font-mono">0 ta</div>
          <div className="text-[11px] font-semibold text-emerald-600">
            Qoidabuzarliklar yo'q
          </div>
        </div>
      </Card>

      
      <Card className="p-5 bg-white border border-slate-200 shadow-2xs hover:border-purple-500 hover:shadow-md transition-all space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
            O‘rtacha Ball
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-black text-slate-900 font-mono">0.0</div>
          <div className="text-[11px] font-semibold text-slate-500">
            Natijalar kutilmoqda
          </div>
        </div>
      </Card>
    </div>
  );
};

