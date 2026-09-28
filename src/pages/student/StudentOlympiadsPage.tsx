import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Trophy, Clock, HelpCircle, ArrowRight, Search, GraduationCap, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useOlympiadList } from '../../hooks/useOlympiad';
import { useOlympiadStore } from '../../store/useOlympiadStore';
import { useAuthStore } from '../../store/useAuthStore';
import { submissionService } from '../../services/submissionService';
import { Subject, OlympiadStatus } from '../../types';
import { Link } from 'react-router-dom';

export const StudentOlympiadsPage: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<OlympiadStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const user = useAuthStore((state) => state.user);
  const studentGrade = user?.grade ? Number(user.grade) : null;

  const { data: queriedOlympiads, isLoading } = useOlympiadList({
    subject: selectedSubject === 'all' ? undefined : selectedSubject,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    search: searchQuery || undefined,
  });

  const { olympiads: localOlympiads } = useOlympiadStore();

  const matchSubject = (subjectStr: string | undefined, filter: Subject | 'all') => {
    if (filter === 'all') return true;
    if (!subjectStr) return false;
    const s = subjectStr.toLowerCase();
    if (filter === 'math') return s.includes('matematik') || s === 'math';
    if (filter === 'physics') return s.includes('fizik') || s === 'physics';
    if (filter === 'informatics') return s.includes('informat') || s === 'informatics';
    if (filter === 'chemistry') return s.includes('kimyo') || s === 'chemistry';
    if (filter === 'biology') return s.includes('biolog') || s === 'biology';
    return s.includes(filter);
  };

  const olympiads = (localOlympiads || [])
    .filter((o) => matchSubject(o.subject, selectedSubject))
    .map((o) => {
      const now = Date.now();
      const stTime = o.startDate ? new Date(o.startDate.replace(' ', 'T')).getTime() : 0;
      const endTime = o.endDate ? new Date(o.endDate.replace(' ', 'T')).getTime() : Infinity;
      const regEndTime = o.registrationEndDate ? new Date(o.registrationEndDate.replace(' ', 'T')).getTime() : Infinity;
      const regStartTime = o.registrationStartDate ? new Date(o.registrationStartDate.replace(' ', 'T')).getTime() : 0;

      const isAlwaysOpen = Boolean((o as any).isAlwaysOpen);

      let mappedStatus: OlympiadStatus = 'active';
      if (!isAlwaysOpen && (o.status === 'yopiq' || (endTime && now > endTime))) {
        mappedStatus = 'finished';
      } else if (!isAlwaysOpen && (stTime && now < stTime)) {
        mappedStatus = 'upcoming';
      } else {
        mappedStatus = 'active';
      }

      const totalQ = o.questions && o.questions.length > 0 ? o.questions.length : ((o as any).totalQuestions || (o as any).total_questions || 25);
      const durMin = (o as any).durationMinutes || (o as any).duration_minutes || 60;

      return {
        ...o,
        subject: o.subject || 'other',
        status: mappedStatus,
        isAlwaysOpen,
        isDateFinished: isAlwaysOpen ? false : (endTime ? now > endTime : false),
        isRegistrationExpired: isAlwaysOpen ? false : (regEndTime ? now > regEndTime : false),
        isUpcoming: isAlwaysOpen ? false : (stTime ? now < stTime : false),
        isLive: isAlwaysOpen ? (o.status !== 'yopiq') : ((stTime ? now >= stTime : true) && (endTime ? now <= endTime : true) && o.status !== 'yopiq'),
        startDate: o.startDate || new Date().toISOString(),
        endDate: o.endDate || new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: durMin,
        totalQuestions: totalQ,
        maxScore: (o as any).maxScore || (o as any).max_score || 100,
        participantsCount: (o as any).participantsCount || (o.registeredCount || 0),
        organizer: o.organizer || "Next Olymp Hakamlar Hay'ati",
      };
    })
    .filter((o) => {
      if (selectedStatus === 'all') return true;
      return o.status === selectedStatus;
    })
    .filter((o) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (o.title || '').toLowerCase().includes(q) || (o.description || '').toLowerCase().includes(q) || (o.subject || '').toLowerCase().includes(q);
    });

  const subjectsList: { id: Subject | 'all'; name: string }[] = [
    { id: 'all', name: 'Barcha Fanlar' },
    { id: 'math', name: 'Matematika' },
    { id: 'physics', name: 'Fizika' },
    { id: 'informatics', name: 'Informatika' },
    { id: 'chemistry', name: 'Kimyo' },
    { id: 'biology', name: 'Biologiya' },
  ];

  return (
    <div className="space-y-5">
      
      <div className="bg-[#111827] text-[#F1F5F9] rounded-xl p-4 sm:p-5 border border-[#1E293B] shadow-md space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA] shrink-0">
              <Trophy className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#F1F5F9]">Olimpiadalar va Musobaqalar</h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#60A5FA] text-[10px] font-bold uppercase tracking-wider border border-[#3B82F6]/30">
                  Kabinet
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#94A3B8] font-medium">
                Mavjud olimpiadalarga ro'yxatdan o'ting va jonli musobaqalarda bilimingizni sinang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-[#94A3B8] bg-[#0B1120] px-2.5 py-1 rounded-md border border-[#1E293B]">
              Jami: <strong className="text-white">{olympiads.length}</strong> ta
            </span>
          </div>
        </div>

        
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Olimpiada nomi yoki fani bo'yicha izlash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 text-xs border border-[#1E293B] bg-[#0B1120] text-[#F1F5F9] placeholder-[#64748B] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3B82F6] font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OlympiadStatus | 'all')}
              className="w-full sm:w-40 px-2.5 py-1.5 sm:py-2 text-xs border border-[#1E293B] rounded-lg bg-[#0B1120] font-semibold text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6] cursor-pointer"
            >
              <option value="all">Barcha holatlar</option>
              <option value="active">🟢 Faol (Ochiq)</option>
              <option value="upcoming">🟡 Kutilayotgan</option>
              <option value="finished">🔴 Yakunlangan</option>
            </select>
          </div>
        </div>

        
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {subjectsList.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                selectedSubject === s.id
                  ? 'bg-[#3B82F6] text-white shadow-xs'
                  : 'bg-[#0B1120] hover:bg-[#1E293B] text-[#94A3B8] border border-[#1E293B]'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-[#111827] border border-[#1E293B] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !olympiads || olympiads.length === 0 ? (
        <div className="p-12 text-center bg-[#111827] border border-[#1E293B] rounded-xl space-y-3">
          <Trophy className="w-12 h-12 text-[#94A3B8] mx-auto" />
          <h3 className="text-lg font-bold text-[#F1F5F9]">Musobaqalar topilmadi</h3>
          <p className="text-xs text-[#94A3B8]">Qidiruv yoki filtr parametrlarini o'zgartirib ko'ring</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {olympiads.map((o) => {
            const targetGrades: number[] = (o as any).targetGrades || (o as any).eligibility?.grades || [];
            const hasGradeFilter = targetGrades && targetGrades.length > 0 && targetGrades.length < 11;
            const isGradeEligible = !studentGrade || !hasGradeFilter || targetGrades.includes(studentGrade);
            
            const attemptsCount = user ? submissionService.getAttemptCount(user.id, o.id) : 0;
            const retakeAllowed = (o as any).retakeAllowed === true;
            const maxAttempts = retakeAllowed ? Number((o as any).maxRetakeAttempts || 2) : 1;
            const hasRemainingAttempts = retakeAllowed && attemptsCount > 0 && attemptsCount < maxAttempts;
            const isCompleted = attemptsCount > 0 && (!retakeAllowed || attemptsCount >= maxAttempts);

                        return (
              <Card key={o.id} hoverEffect className="p-0 overflow-hidden bg-[#111827] border border-[#1E293B] flex flex-col justify-between group">
                <div>
                  
                  <div className="relative h-40 w-full bg-[#0B1120] overflow-hidden">
                    <img
                      src={(o as any).imageUrl || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80'}
                      alt={o.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                      <Badge subject={o.subject} />
                      {hasGradeFilter && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/80 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs">
                          <GraduationCap className="w-3 h-3" />
                          {targetGrades.join(', ')}-sinf
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <Badge status={o.status} />
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-[#F1F5F9] leading-snug group-hover:text-[#3B82F6] transition-colors">{o.title}</h3>
                      <p className="text-xs text-[#94A3B8] line-clamp-2 mt-2 leading-relaxed">{o.description}</p>
                    </div>

                    
                    {!isGradeEligible && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-[11px] text-rose-300">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>
                          Faqat <strong>{targetGrades.join(', ')}-sinf</strong> o'quvchilari uchun. Siz: <strong>{studentGrade}-sinf</strong>.
                        </span>
                      </div>
                    )}

                    
                    {attemptsCount > 0 && (
                      <div className={`p-2.5 rounded-lg border flex items-center justify-between text-[11px] ${
                        hasRemainingAttempts 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>
                            {hasRemainingAttempts 
                              ? `Ishtirok etilgan (${attemptsCount}/${maxAttempts} ta urinish ishlatildi)`
                              : `Yakunlangan (${attemptsCount} ta urinish topshirilgan)`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#94A3B8] font-medium pt-3 border-t border-[#1E293B]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#3B82F6]" />
                      <span>{o.durationMinutes} daqiqa</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-[#3B82F6]" />
                      <span>{o.totalQuestions} ta savol</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs font-bold text-[#10B981] bg-[#10B981]/15 px-2.5 py-1 rounded-md border border-[#10B981]/30">
                      Maks. {o.maxScore} ball
                    </div>

                    {!isGradeEligible ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled
                        className="opacity-50 cursor-not-allowed text-xs"
                      >
                        Sinf mos emas
                      </Button>
                    ) : isCompleted ? (
                      <Link to="/results">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25"
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          Natijani ko'rish
                        </Button>
                      </Link>
                    ) : (o.status === 'finished' || o.isDateFinished) ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled
                        className="opacity-60 cursor-not-allowed text-xs bg-slate-800 text-slate-400 border border-slate-700"
                      >
                        Musobaqa yakunlangan
                      </Button>
                    ) : (o.isRegistrationExpired && attemptsCount === 0) ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled
                        className="opacity-60 cursor-not-allowed text-xs bg-slate-800 text-slate-400 border border-slate-700"
                      >
                        Ro'yxatdan o'tish yopilgan
                      </Button>
                    ) : hasRemainingAttempts ? (
                      <Link to={`/olympiads/${o.id}/participate`}>
                        <Button
                          size="sm"
                          variant="primary"
                          className="bg-amber-600 hover:bg-amber-500 text-white"
                          rightIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        >
                          Qayta topshirish ({attemptsCount + 1}/{maxAttempts})
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/olympiads/${o.id}/participate`}>
                        <Button
                          size="sm"
                          variant="primary"
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          {o.isUpcoming ? "Ro'yxatdan o'tish" : "Qatnashish"}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

