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
      
      
      <div className="relative overflow-hidden bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#111827] text-[#F1F5F9] rounded-xl p-4 sm:p-5 border border-[#1E293B] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 relative z-10">
          <Avatar
            name={user.fullName || 'User'}
            src={user.avatarUrl}
            size="lg"
            className="ring-2 ring-[#3B82F6]/60 shadow-md shrink-0"
          />

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#F59E0B]" />
              <span>Xush kelibsiz, {user.fullName || 'Foydalanuvchi'}!</span>
            </div>
            
            <h1 className="text-lg sm:text-xl font-black text-[#F1F5F9] tracking-tight">
              Shaxsiy Boshqaruv Paneli
            </h1>
            
            <p className="text-[11px] sm:text-xs text-[#94A3B8] font-medium max-w-xl">
              Platformadagi musobaqalarda qatnashing, bilimingizni sinang va milliy reytingda yuqori pog'onani egallang.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0 self-start md:self-auto">
          <Link to="/student/olympiads">
            <Button
              variant="primary"
              size="sm"
              className="font-bold shadow-xs"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Musobaqalarga kirish
            </Button>
          </Link>
        </div>
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Link to="/student/olympiads">
          <Card hoverEffect className="p-4 flex items-center gap-3.5 bg-[#111827] border border-[#1E293B] group">
            <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/15 group-hover:bg-[#3B82F6] text-[#3B82F6] group-hover:text-white border border-[#3B82F6]/30 flex items-center justify-center font-bold shrink-0 transition-colors">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#F1F5F9] font-mono">{activeOlympiads.length} ta</div>
              <div className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider">Faol Olimpiadalar</div>
            </div>
          </Card>
        </Link>

        <Link to="/certificates">
          <Card hoverEffect className="p-4 flex items-center gap-3.5 bg-[#111827] border border-[#1E293B] group">
            <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/15 group-hover:bg-[#F59E0B] text-[#F59E0B] group-hover:text-slate-950 border border-[#F59E0B]/30 flex items-center justify-center font-bold shrink-0 transition-colors">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#F1F5F9] font-mono">{certificatesCount} ta</div>
              <div className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider">Sertifikatlar</div>
            </div>
          </Card>
        </Link>

        <Link to="/student/leaderboard">
          <Card hoverEffect className="p-4 flex items-center gap-3.5 bg-[#111827] border border-[#1E293B] group">
            <div className="w-10 h-10 rounded-lg bg-[#10B981]/15 group-hover:bg-[#10B981] text-[#10B981] group-hover:text-white border border-[#10B981]/30 flex items-center justify-center font-bold shrink-0 transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#10B981] font-mono">{totalXp.toLocaleString()} XP</div>
              <div className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider">Reyting Ballaringiz</div>
            </div>
          </Card>
        </Link>
      </div>

      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#F1F5F9] tracking-tight">
            Davom etayotgan va Tavsiya etiladigan Musobaqalar
          </h3>
          <Link to="/student/olympiads" className="text-xs font-semibold text-[#3B82F6] hover:underline">
            Barchasini ko'rish →
          </Link>
        </div>

        {activeOlympiads.length === 0 ? (
          <div className="p-10 rounded-xl bg-[#111827] border border-dashed border-[#1E293B] text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] mx-auto flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#F1F5F9]">Hozircha faol olimpiada yo'q</h4>
            <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
              Yaqin soatlarda yangi fan olimpiadalari boshlanadi. Musobaqalar taqvimi bilan tanishishingiz mumkin.
            </p>
            <Link to="/student/olympiads" className="inline-block pt-1">
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
                <Card key={o.id} hoverEffect className="p-5 flex flex-col justify-between border border-[#1E293B] bg-[#111827] space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 font-bold uppercase text-[10px]">
                          {o.subject}
                        </span>
                        {hasGradeFilter && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-bold">
                            {targetGrades.join(', ')}-sinf
                          </span>
                        )}
                        {retakeAllowed && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                            {maxAttempts}x Urinish
                          </span>
                        )}
                      </div>
                      <span className="text-[#94A3B8] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
                        {(o as any).durationMinutes || 60} daqiqa
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#F1F5F9]">{o.title}</h4>
                    <p className="text-xs text-[#94A3B8] line-clamp-2">{o.description}</p>

                    {!isGradeEligible && (
                      <div className="text-[11px] text-rose-400 font-medium pt-1">
                        ⚠️ Faqat {targetGrades.join(', ')}-sinflar uchun (Siz: {studentGrade}-sinf)
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between">
                    <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#F59E0B]" />
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
