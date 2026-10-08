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
    <div className="space-y-6 font-sans">
      
      <div className="bg-zinc-900/60 text-zinc-100 rounded-2xl p-6 border border-white/10 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100">Olimpiadalar va Musobaqalar</h1>
                <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                  Kabinet
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 font-normal">
                Mavjud olimpiadalarga ro'yxatdan o'ting va jonli musobaqalarda bilimingizni sinang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-zinc-400 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-white/10">
              Jami: <strong className="text-zinc-100 font-mono">{olympiads.length}</strong> ta
            </span>
          </div>
        </div>

        
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Olimpiada nomi yoki fani bo'yicha izlash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-white/10 bg-zinc-950/80 text-zinc-100 placeholder-zinc-500 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OlympiadStatus | 'all')}
              className="w-full sm:w-44 px-3 py-2.5 text-xs border border-white/10 rounded-xl bg-zinc-950/80 font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer transition-all"
            >
              <option value="all">Barcha holatlar</option>
              <option value="active">🟢 Faol (Ochiq)</option>
              <option value="upcoming">🟡 Kutilayotgan</option>
              <option value="finished">🔴 Yakunlangan</option>
            </select>
          </div>
        </div>

        
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {subjectsList.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-95 ${
                selectedSubject === s.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-zinc-950/80 hover:bg-zinc-800 text-zinc-400 border border-white/10'
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
            <div key={i} className="h-56 bg-zinc-900/60 border border-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !olympiads || olympiads.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 border border-dashed border-white/10 rounded-2xl space-y-3 backdrop-blur-md">
          <Trophy className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-lg font-bold text-zinc-100">Musobaqalar topilmadi</h3>
          <p className="text-xs text-zinc-400">Qidiruv yoki filtr parametrlarini o'zgartirib ko'ring</p>
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
              <Card key={o.id} hoverEffect className="p-0 overflow-hidden bg-zinc-900/60 border border-white/10 rounded-2xl flex flex-col justify-between group backdrop-blur-md shadow-xl">
                <div>
                  
                  <div className="relative h-44 w-full bg-zinc-950 overflow-hidden">
                    <img
                      src={(o as any).imageUrl || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80'}
                      alt={o.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                    
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                      <Badge subject={o.subject} />
                      {hasGradeFilter && (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/80 text-white text-xs font-semibold flex items-center gap-1 backdrop-blur-xs">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {targetGrades.join(', ')}-sinf
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <Badge status={o.status} />
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <div>
                      <h3 className="font-bold text-lg text-zinc-100 leading-snug group-hover:text-emerald-300 transition-colors">{o.title}</h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-2 leading-relaxed">{o.description}</p>
                    </div>

                    
                    {!isGradeEligible && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>
                          Faqat <strong>{targetGrades.join(', ')}-sinf</strong> o'quvchilari uchun. Siz: <strong>{studentGrade}-sinf</strong>.
                        </span>
                      </div>
                    )}

                    
                    {attemptsCount > 0 && (
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
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

                <div className="p-6 pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 font-medium pt-4 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span>{o.durationMinutes} daqiqa</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-teal-400" />
                      <span>{o.totalQuestions} ta savol</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30">
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
                        className="opacity-60 cursor-not-allowed text-xs bg-zinc-800 text-zinc-500 border border-white/5"
                      >
                        Musobaqa yakunlangan
                      </Button>
                    ) : (o.isRegistrationExpired && attemptsCount === 0) ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled
                        className="opacity-60 cursor-not-allowed text-xs bg-zinc-800 text-zinc-500 border border-white/5"
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

