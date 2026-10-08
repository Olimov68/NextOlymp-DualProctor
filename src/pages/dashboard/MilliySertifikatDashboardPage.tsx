import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import {
  raschService,
  GradeLevel,
  AppealTicket,
  SPEC_1_BENCHMARKS,
  SPEC_2_BENCHMARKS,
  GRADE_BANDS,
  WRITING_MAP_24_75
} from '../../services/raschAssessmentService';
import {
  Award,
  BookOpen,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  QrCode,
  Send,
  HelpCircle,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { NationalExamSimulator } from '../../components/baholash/NationalExamSimulator';
import { useNationalExamStore } from '../../store/useNationalExamStore';
import { NationalExamItem } from '../../data/initialNationalExams';
import { Search, ArrowLeft, ArrowRight } from 'lucide-react';

export const MilliySertifikatDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { exams } = useNationalExamStore();
  const [activeTab, setActiveTab] = useState<'tests' | 'certificates' | 'appeal' | 'rules'>('tests');
  const [selectedExamForTest, setSelectedExamForTest] = useState<NationalExamItem | null>(null);
  const [examSubjectFilter, setExamSubjectFilter] = useState<string>('all');
  const [examSearchQuery, setExamSearchQuery] = useState<string>('');

  
  const [appeals, setAppeals] = useState<AppealTicket[]>(() => raschService.getAppeals());
  const [appealTaskNo, setAppealTaskNo] = useState<number>(41);
  const [originalScore, setOriginalScore] = useState<number>(18);
  const [demandedScore, setDemandedScore] = useState<number>(23);
  const [appealReason, setAppealReason] = useState<string>('');
  const [appealSuccessMsg, setAppealSuccessMsg] = useState<string>('');

  
  const [userCert] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('next_olymp_user_national_certificate');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleAppealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) return;

    const newTicket = raschService.submitAppeal({
      candidateId: user?.id || 'u-user',
      candidateName: user?.fullName || 'Foydalanuvchi',
      examTitle: 'Kimyo fanidan Milliy Sertifikat',
      taskNo: appealTaskNo,
      originalScore,
      demandedScore,
      reason: appealReason
    });

    setAppeals([newTicket, ...appeals]);
    setAppealReason('');
    setAppealSuccessMsg('Apellyatsiya arizangiz muvaffaqiyatli qabul qilindi. Ekspert komissiyasi 3 ish kunida ko\'rib chiqadi.');
    setTimeout(() => setAppealSuccessMsg(''), 6000);
  };

  const getGradeColor = (g: GradeLevel) => {
    if (g === 'A+' || g === 'A') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
    if (g === 'B+' || g === 'B') return 'bg-teal-500/15 text-teal-300 border-teal-500/40';
    if (g === 'C+' || g === 'C') return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
    return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-zinc-100 pb-12">
      
      <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-zinc-900/60 border border-white/10 backdrop-blur-md shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-3 h-3" />
              BMBA Rasmiy Standartlashtirilgan Tizim
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
              Milliy Sertifikat Sinovlari
            </h1>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Mutaxassislik fanlari va til fanlari bo'yicha test va yozma ish topshiriqlarini yeching,
              Rasch modeli asosida standartlashtirilgan ball va rasmiy sertifikatingizni oling.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/10 flex items-center gap-3 min-w-[200px]">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400">Faol Sertifikat</div>
              {userCert ? (
                <>
                  <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                    <span>{userCert.finalScore} ball</span>
                    <span className={clsx("px-1.5 py-0.2 rounded text-[10px] font-bold border", getGradeColor(userCert.grade))}>
                      {userCert.grade}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-400">Muddati: {userCert.validUntil || '2029-yilgacha'}</div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold text-zinc-300">Mavjud emas</div>
                  <div className="text-[10px] text-zinc-500">Sinov testini yechib oling</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('tests')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer active:scale-95",
            activeTab === 'tests'
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Sinov Testi (Simulyator)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('certificates')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer active:scale-95",
            activeTab === 'certificates'
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          )}
        >
          <FileCheck2 className="w-4 h-4" />
          Mening Sertifikatlarim
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appeal')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer active:scale-95",
            activeTab === 'appeal'
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          )}
        >
          <HelpCircle className="w-4 h-4" />
          Apellyatsiya (E'tiroz)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer active:scale-95",
            activeTab === 'rules'
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          BMBA Baholash Qoidalari
        </button>
      </div>

      {activeTab === 'tests' && (
        <div className="space-y-6">
          {selectedExamForTest ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/60 border border-white/10 backdrop-blur-md">
                <button
                  onClick={() => setSelectedExamForTest(null)}
                  className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-400" />
                  <span>Barcha milliy sinovlarga qaytish</span>
                </button>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                  <span>{selectedExamForTest.title} (Rasch Modeli)</span>
                </div>
              </div>

              <NationalExamSimulator />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Sinov nomi yoki fani bo'yicha qidirish..."
                    value={examSearchQuery}
                    onChange={(e) => setExamSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {['all', 'Kimyo', 'Matematika', 'Biologiya', 'Fizika', 'Ona tili', 'Ingliz tili'].map((subj) => (
                    <button
                      key={subj}
                      onClick={() => setExamSubjectFilter(subj)}
                      className={clsx(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95",
                        examSubjectFilter === subj
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                          : "bg-zinc-950/80 text-zinc-400 hover:text-white border border-white/10"
                      )}
                    >
                      {subj === 'all' ? 'Barcha Fanlar' : subj}
                    </button>
                  ))}
                </div>
              </div>

              
              {(() => {
                const filteredExams = exams.filter((e) => {
                  const matchesSearch = !examSearchQuery ||
                    e.title.toLowerCase().includes(examSearchQuery.toLowerCase()) ||
                    e.subject.toLowerCase().includes(examSearchQuery.toLowerCase());
                  const matchesSubject = examSubjectFilter === 'all' || e.subject.toLowerCase() === examSubjectFilter.toLowerCase();
                  return matchesSearch && matchesSubject;
                });

                if (filteredExams.length === 0) {
                  return (
                    <Card className="p-12 text-center bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-xl">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-500">
                        <BookOpen className="w-8 h-8 opacity-40" />
                      </div>
                      <h3 className="text-lg font-bold text-zinc-100 mb-2">Hozircha milliy sertifikat sinovlari mavjud emas</h3>
                      <p className="text-sm text-zinc-400 max-w-md mx-auto">
                        Tizim administratori yangi sinovlarni e'lon qilganda ushbu bo'limda avtomatik paydo bo'ladi.
                      </p>
                    </Card>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExams.map((exam) => (
                      <Card
                        key={exam.id}
                        className="overflow-hidden bg-zinc-900/60 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between shadow-xl rounded-2xl group backdrop-blur-md"
                      >
                        <div>
                          <div className="relative h-40 w-full overflow-hidden bg-zinc-950">
                            <img
                              src={exam.image}
                              alt={exam.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-transparent to-transparent" />

                            <div className="absolute top-3 left-3 flex items-center gap-2">
                              <span className={clsx(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                exam.format === 'online' ? "bg-emerald-500 text-white" : "bg-teal-600 text-white"
                              )}>
                                {exam.format}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-600 text-white">
                                {exam.status === 'ochiq' ? 'Davom etmoqda' : 'Yopiq'}
                              </span>
                            </div>

                            <div className="absolute bottom-3 left-3">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                {exam.subject}
                              </span>
                            </div>
                          </div>

                          <div className="p-5 space-y-3">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                              <span>BMBA Rasch 75 ball shkalasi • A: 65+</span>
                            </div>

                            <h3 className="font-bold text-base text-zinc-100 group-hover:text-emerald-400 transition-colors leading-snug">
                              {exam.title}
                            </h3>

                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                              {exam.description}
                            </p>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs text-zinc-400">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{exam.durationMinutes} daqiqa</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{exam.totalQuestions} ta savol</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 pt-0 border-t border-white/10 mt-3 flex items-center justify-between">
                          <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            Maks. {exam.maxScore} ball
                          </div>

                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => setSelectedExamForTest(exam)}
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                            className="font-bold text-xs"
                          >
                            Sinovda qatnashish
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {userCert ? (
            <Card className="p-6 sm:p-8 bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    Davlat Standartidagi Milliy Sertifikat
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Ushbu sertifikat Oliy ta'lim muassasalariga kirish imtihonlarida maksimal yoki tabaqalashtirilgan imtiyoz beradi.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Printer className="w-4 h-4" />
                    Chop etish (PDF)
                  </Button>
                </div>
              </div>

              <div className="mt-8 relative p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-850 border border-emerald-500/30 shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-4 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-mono text-emerald-400 font-bold">
                      <span>O'ZBEKISTON RESPUBLIKASI</span>
                      <span>•</span>
                      <span>BMBA MILLIY SERTIFIKATI</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black tracking-wide text-zinc-100">
                      {user?.fullName || 'Foydalanuvchi'}
                    </h2>

                    <p className="text-sm text-zinc-400">
                      bilimni baholash agentligining milliy sertifikat sinovlarida <span className="text-zinc-100 font-bold">{userCert.subject}</span> bo'yicha
                      muvaffaqiyatli ishtirok etib, quyidagi standart ball va darajaga ega bo'ldi:
                    </p>

                    <div className="grid grid-cols-3 gap-3 max-w-md pt-2">
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10">
                        <div className="text-[11px] text-zinc-400">Test Balli</div>
                        <div className="text-base font-bold text-zinc-100">{userCert.testStdScore}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10">
                        <div className="text-[11px] text-zinc-400">Yozma Ish</div>
                        <div className="text-base font-bold text-zinc-100">{userCert.writingStdScore}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-emerald-500/40">
                        <div className="text-[11px] text-emerald-400">Umumiy Ball</div>
                        <div className="text-base font-bold text-emerald-400">{userCert.finalScore}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-900/90 border border-white/10 text-center min-w-[200px] shadow-xl">
                    <div className={clsx("text-4xl font-black px-6 py-2 rounded-xl border mb-3", getGradeColor(userCert.grade))}>
                      {userCert.grade}
                    </div>
                    <div className="text-xs font-bold text-zinc-100">DARAJASI</div>
                    <div className="text-[11px] text-zinc-400 mb-4">Maksimal ball imtiyozi</div>

                    <div className="w-24 h-24 bg-white p-2 rounded-xl flex items-center justify-center shadow-inner">
                      <QrCode className="w-20 h-20 text-zinc-950" />
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 mt-2">
                      № {userCert.id}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-2">
                  <div>Berilgan sana: <span className="text-zinc-100">{userCert.issueDate}</span></div>
                  <div>Amal qilish muddati: <span className="text-zinc-100">{userCert.validUntil} (3 yil)</span></div>
                  <div className="font-mono text-[11px] text-emerald-400">Tasdiqlash kodi: {userCert.id}</div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-500">
                <Award className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 mb-2">Hozircha rasmiy sertifikat mavjud emas</h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
                Milliy sertifikat sinov simulyatorida qatnashib test va yozma topshiriqlarni topshiring. Natijalaringiz Rasch modeli bo'yicha baholanib, darajangiz bo'yicha sertifikat shu yerda aks etadi.
              </p>
              <Button
                variant="primary"
                onClick={() => setActiveTab('tests')}
                className="px-6 py-2.5"
              >
                Sinov simulyatorlariga o'tish
              </Button>
            </Card>
          )}
        </div>
      )}

      
      {activeTab === 'appeal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-6">
            <Card className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-xl">
              <h3 className="text-base font-bold text-zinc-100 border-b border-white/10 pb-3 mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                Yozma Ish Bo'yicha E'tiroz Bildirish
              </h3>

              {appealSuccessMsg && (
                <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {appealSuccessMsg}
                </div>
              )}

              <form onSubmit={handleAppealSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Topshiriq raqami</label>
                  <select
                    value={appealTaskNo}
                    onChange={(e) => setAppealTaskNo(Number(e.target.value))}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-zinc-950/80 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    <option value={41} className="bg-zinc-900 text-zinc-100">41-topshiriq (Maksimal 25 ball)</option>
                    <option value={42} className="bg-zinc-900 text-zinc-100">42-topshiriq (Maksimal 25 ball)</option>
                    <option value={43} className="bg-zinc-900 text-zinc-100">43-topshiriq (Maksimal 25 ball)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Qo'yilgan ball</label>
                    <Input
                      type="number"
                      value={originalScore}
                      onChange={(e) => setOriginalScore(Number(e.target.value))}
                      min={0}
                      max={25}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Talab qilinayotgan ball</label>
                    <Input
                      type="number"
                      value={demandedScore}
                      onChange={(e) => setDemandedScore(Number(e.target.value))}
                      min={0}
                      max={25}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">E'tirozning batafsil asosi</label>
                  <textarea
                    rows={5}
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="Qaysi formula, tenglama yoki hisoblash bosqichi ekspert tomonidan to'liq hisobga olinmaganligini aniq bayon qiling..."
                    className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-zinc-950/80 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors resize-none placeholder-zinc-500"
                    required
                  />
                </div>

                <Button type="submit" className="w-full flex items-center justify-center gap-2 text-xs py-2.5">
                  <Send className="w-4 h-4" />
                  Apellyatsiya Arizasini Yuborish
                </Button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <Card className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-xl">
              <h3 className="text-base font-bold text-zinc-100 border-b border-white/10 pb-3 mb-4 flex items-center justify-between">
                <span>Mening E'tirozlarim Tarixi</span>
                <span className="text-xs font-normal text-zinc-400">{appeals.length} ta ariza</span>
              </h3>

              <div className="space-y-4">
                {appeals.map((app) => (
                  <div key={app.id} className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-zinc-100">
                        {app.taskNo}-topshiriq ({app.originalScore} ball → {app.demandedScore} ball)
                      </div>
                      <span className={clsx(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                        app.status === 'accepted' && "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                        app.status === 'rejected' && "bg-rose-500/15 text-rose-400 border-rose-500/30",
                        app.status === 'pending' && "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      )}>
                        {app.status === 'accepted' ? 'Qanoatlantirildi' : app.status === 'rejected' ? 'Rad etildi' : 'Kutilmoqda'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 italic">"{app.reason}"</p>

                    {app.reviewerNotes && (
                      <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-white/10 text-[11px] text-teal-300">
                        <span className="font-bold text-zinc-200">Komissiya xulosasi:</span> {app.reviewerNotes}
                      </div>
                    )}

                    <div className="text-[10px] text-zinc-500 flex items-center gap-1 pt-1">
                      <Clock className="w-3 h-3" />
                      Yuborilgan vaqt: {app.createdAt} • ID: {app.id}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-xl">
              <h4 className="text-sm font-bold text-zinc-100 mb-2 flex items-center justify-between">
                <span>1-Fan: Asosiy Mutaxassislik (MAX = 93)</span>
                <span className="text-xs text-emerald-400 font-mono">BMBA Rasch Logit</span>
              </h4>
              <p className="text-xs text-zinc-400 mb-4">
                Maksimal xom ball 93 ball bo'lib, rasmiy BMBA logit konversiyasiga ko'ra 75 ballik standart shkalaga o'tkaziladi:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-950/80 text-zinc-400 border-b border-white/10">
                    <tr>
                      <th className="p-2.5">Xom Ball (Raw)</th>
                      <th className="p-2.5">Standart Ball</th>
                      <th className="p-2.5">Daraja</th>
                      <th className="p-2.5">Imtiyoz</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {SPEC_1_BENCHMARKS.filter(b => b.raw > 0).map((b, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-2.5 font-bold text-zinc-100">{b.raw}</td>
                        <td className="p-2.5 font-mono text-emerald-400 font-bold">{b.std}</td>
                        <td className="p-2.5">
                          <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold border", getGradeColor(raschService.getGrade(b.std)))}>
                            {raschService.getGrade(b.std)}
                          </span>
                        </td>
                        <td className="p-2.5 text-zinc-400">
                          {b.std >= 65 ? '100% Maksimal' : 'Proporsional'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-xl">
              <h4 className="text-sm font-bold text-zinc-100 mb-2 flex items-center justify-between">
                <span>2-Fan: Qo'shimcha Mutaxassislik (MAX = 63)</span>
                <span className="text-xs text-teal-400 font-mono">BMBA Rasch Logit</span>
              </h4>
              <p className="text-xs text-zinc-400 mb-4">
                Maksimal xom ball 63 ball bo'lib, rasmiy BMBA logit konversiyasiga ko'ra 75 ballik standart shkalaga o'tkaziladi:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-950/80 text-zinc-400 border-b border-white/10">
                    <tr>
                      <th className="p-2.5">Xom Ball (Raw)</th>
                      <th className="p-2.5">Standart Ball</th>
                      <th className="p-2.5">Daraja</th>
                      <th className="p-2.5">Imtiyoz</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {SPEC_2_BENCHMARKS.filter(b => b.raw > 0).map((b, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-2.5 font-bold text-zinc-100">{b.raw}</td>
                        <td className="p-2.5 font-mono text-teal-400 font-bold">{b.std}</td>
                        <td className="p-2.5">
                          <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold border", getGradeColor(raschService.getGrade(b.std)))}>
                            {raschService.getGrade(b.std)}
                          </span>
                        </td>
                        <td className="p-2.5 text-zinc-400">
                          {b.std >= 65 ? '100% Maksimal' : 'Proporsional'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-zinc-900/60 border border-white/10 rounded-2xl backdrop-blur-md shadow-xl">
            <h4 className="text-sm font-bold text-zinc-100 mb-4">BMBA Rasmiy Darajalar Shkalasi</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {GRADE_BANDS.filter(g => g.grade !== 'Fail').map((b) => (
                <div key={b.grade} className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/10 text-center space-y-1 hover:border-white/20 transition-colors">
                  <div className={clsx("inline-block px-2.5 py-0.5 rounded-full text-xs font-black border", getGradeColor(b.grade))}>
                    {b.grade}
                  </div>
                  <div className="text-xs font-mono font-bold text-zinc-100">
                    {b.minStd} – {b.maxStd} ball
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {b.grade.startsWith('A') ? '100% Imtiyoz' : 'Proporsional ball'}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
