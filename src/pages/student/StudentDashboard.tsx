import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { Trophy, Award, ArrowRight, Sparkles, BarChart3, Clock, Calendar } from 'lucide-react';
import { useOlympiadStore } from '../../store/useOlympiadStore';
import { certificateService } from '../../services/certificateService';
import { submissionService } from '../../services/submissionService';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { olympiads } = useOlympiadStore();

  const [certificatesCount, setCertificatesCount] = useState<number>(0);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      certificateService.getUserCertificates(user.id).then((certs) => {
        setCertificatesCount(certs.length);
      });
      const realSubs = submissionService.getUserSubmissions(user.id);
      setSubmissions(realSubs);
    }
  }, [user]);

  if (!user) return null;

  
  const activeOlympiads = olympiads.filter((o) => o.status === 'ochiq');

  
  const totalXp = submissions.reduce((acc, curr) => acc + (curr.score ? curr.score * 10 : 0), 0);

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-emerald-950/40 text-zinc-100 rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 relative z-10">
          <Avatar
            name={user.fullName || 'User'}
            src={user.avatarUrl}
            size="lg"
            className="ring-2 ring-emerald-500/60 shadow-lg shrink-0"
          />

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xush kelibsiz, {user.fullName || 'Foydalanuvchi'}!</span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
              Shaxsiy Boshqaruv Paneli
            </h1>
            
            <p className="text-xs sm:text-sm text-zinc-400 font-normal max-w-xl">
              Platformadagi musobaqalarda qatnashing, bilimingizni sinang va milliy reytingda yuqori pog'onani egallang.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0 self-start md:self-auto">
          <Link to="/student/olympiads">
            <Button
              variant="primary"
              size="md"
              className="font-semibold shadow-lg shadow-emerald-500/20"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Musobaqalarga kirish
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link to="/student/olympiads">
          <Card hoverEffect className="p-6 flex items-center gap-4 bg-zinc-900/60 border border-white/10 rounded-2xl group backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 group-hover:bg-emerald-500 text-emerald-400 group-hover:text-white border border-emerald-500/30 flex items-center justify-center font-bold shrink-0 transition-all duration-200">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-zinc-100 font-mono">{activeOlympiads.length} ta</div>
              <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Faol Olimpiadalar</div>
            </div>
          </Card>
        </Link>

        <Link to="/certificates">
          <Card hoverEffect className="p-6 flex items-center gap-4 bg-zinc-900/60 border border-white/10 rounded-2xl group backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 group-hover:bg-amber-500 text-amber-400 group-hover:text-zinc-950 border border-amber-500/30 flex items-center justify-center font-bold shrink-0 transition-all duration-200">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-zinc-100 font-mono">{certificatesCount} ta</div>
              <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Sertifikatlar</div>
            </div>
          </Card>
        </Link>

        <Link to="/student/leaderboard">
          <Card hoverEffect className="p-6 flex items-center gap-4 bg-zinc-900/60 border border-white/10 rounded-2xl group backdrop-blur-md">
            <div className="w-12 h-12 rounded-xl bg-teal-500/15 group-hover:bg-teal-500 text-teal-400 group-hover:text-white border border-teal-500/30 flex items-center justify-center font-bold shrink-0 transition-all duration-200">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{totalXp.toLocaleString()} XP</div>
              <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Reyting Ballaringiz</div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recommended & Ongoing Contests */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-zinc-100 tracking-tight">
            Davom etayotgan va Tavsiya etiladigan Musobaqalar
          </h3>
          <Link to="/student/olympiads" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
            Barchasini ko'rish →
          </Link>
        </div>

        {activeOlympiads.length === 0 ? (
          <div className="p-12 rounded-2xl bg-zinc-900/40 border border-dashed border-white/10 text-center space-y-4 backdrop-blur-md">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
              <Trophy className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-zinc-100">Hozircha faol olimpiada yo'q</h4>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Yaqin soatlarda yangi fan olimpiadalari boshlanadi. Musobaqalar taqvimi bilan tanishishingiz mumkin.
            </p>
            <Link to="/student/olympiads" className="inline-block pt-2">
              <Button size="sm" variant="primary">
                Olimpiadalar ro'yxatiga o'tish
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeOlympiads.slice(0, 4).map((o) => {
              const targetGrades: number[] = (o as any).targetGrades || (o as any).eligibility?.grades || [];
              const hasGradeFilter = targetGrades && targetGrades.length > 0 && targetGrades.length < 11;
              const studentGrade = user?.grade ? Number(user.grade) : null;
              const isGradeEligible = !studentGrade || !hasGradeFilter || targetGrades.includes(studentGrade);

              const attemptsCount = user ? submissionService.getAttemptCount(user.id, o.id) : 0;
              const retakeAllowed = (o as any).retakeAllowed === true;
              const maxAttempts = retakeAllowed ? Number((o as any).maxRetakeAttempts || 2) : 1;
              const hasRemainingAttempts = retakeAllowed && attemptsCount > 0 && attemptsCount < maxAttempts;
              const isCompleted = attemptsCount > 0 && (!retakeAllowed || attemptsCount >= maxAttempts);

              return (
                <Card key={o.id} hoverEffect className="p-6 flex flex-col justify-between border border-white/10 bg-zinc-900/60 rounded-2xl space-y-5 backdrop-blur-md">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold text-xs">
                          {o.subject}
                        </span>
                        {hasGradeFilter && (
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-semibold">
                            {targetGrades.join(', ')}-sinf
                          </span>
                        )}
                        {retakeAllowed && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                            {maxAttempts}x Urinish
                          </span>
                        )}
                      </div>
                      <span className="text-zinc-400 flex items-center gap-1.5 text-xs">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        {(o as any).durationMinutes || 60} daqiqa
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors">{o.title}</h4>
                    <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">{o.description}</p>

                    {!isGradeEligible && (
                      <div className="text-xs text-rose-400 font-medium pt-1">
                        ⚠️ Faqat {targetGrades.join(', ')}-sinflar uchun (Siz: {studentGrade}-sinf)
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {o.startDate}
                    </span>

                    {!isGradeEligible ? (
                      <Button size="sm" variant="secondary" disabled className="opacity-50 text-xs">
                        Sinf mos emas
                      </Button>
                    ) : isCompleted ? (
                      <Link to="/results">
                        <Button size="sm" variant="outline" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                          Natijani ko'rish
                        </Button>
                      </Link>
                    ) : hasRemainingAttempts ? (
                      <Link to={`/olympiads/${o.id}/participate`}>
                        <Button size="sm" variant="primary" className="bg-amber-600 hover:bg-amber-500 text-white">
                          Qayta topshirish ({attemptsCount + 1}/{maxAttempts})
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/olympiads/${o.id}/participate`}>
                        <Button size="sm" variant="primary">
                          Ishtirok etish
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
