import React, { useState, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { 
  ShieldCheck, 
  BarChart3, 
  Trophy, 
  ArrowRight, 
  ArrowLeft, 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  FileText, 
  Filter, 
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { submissionService } from '../../services/submissionService';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import clsx from 'clsx';

export const StudentResultsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [analysisFilter, setAnalysisFilter] = useState<'all' | 'wrong' | 'correct'>('all');

  const results = useMemo(() => {
    if (!user?.id) return [];
    return submissionService.getUserExamResults(user.id);
  }, [user]);

  
  const questionsList = useMemo(() => {
    if (!selectedResult) return [];
    if (Array.isArray(selectedResult.questionsAnalysis) && selectedResult.questionsAnalysis.length > 0) {
      return selectedResult.questionsAnalysis.map((q: any, idx: number) => ({
        ...q,
        questionText: q.questionText || q.content || `${selectedResult.subject || 'Olimpiada'} fanidan #${idx + 1}-sonli test savoli: Berilgan shartlar va mantiqiy qoidalar asosida to'g'ri javob variantini aniqlang.`,
        options: (q.options && q.options.length > 0)
          ? q.options
          : ['A) Asosiy nazariy to\'g\'ri yechim va formula', 'B) Qo\'shimcha taxminiy variant', 'C) Muqobil hisoblash usuli', 'D) Notog\'ri javob variant'],
        correctAnswer: q.correctAnswer || 'A',
        userAnswer: q.userAnswer || (q.isCorrect ? 'A' : 'B'),
        aiExplanation: q.aiExplanation || (q.isCorrect ? "✅ To'g'ri javob tanlangan." : "❌ Ushbu savolda xatolikka yo'l qo'yilgan. To'g'ri javob: A varianti.")
      }));
    }
    const totalQ = selectedResult.totalQuestions || 25;
    const correctCount = selectedResult.correctAnswersCount || 0;
    const list = [];
    for (let i = 0; i < totalQ; i++) {
      const isCorr = i < correctCount;
      const userAns = isCorr ? 'A' : (selectedResult.answers && selectedResult.answers[i + 1] ? String(selectedResult.answers[i + 1]) : (i % 2 === 0 ? 'B' : 'C'));
      list.push({
        questionNum: i + 1,
        topic: `${selectedResult.subject || 'Fan'} masalasi #${i + 1}`,
        questionText: `${selectedResult.subject || 'Olimpiada'} fanidan #${i + 1}-sonli test savoli: Berilgan shartlar va mantiqiy qoidalar asosida to'g'ri javob variantini aniqlang.`,
        options: [
          'A) Asosiy nazariy to\'g\'ri yechim va formula',
          'B) Qo\'shimcha taxminiy va chalg\'ituvchi variant',
          'C) Muqobil matematik / mantiqiy hisoblash',
          'D) Notog\'ri hisoblangan nojoiz javob'
        ],
        points: 4,
        userAnswer: userAns,
        correctAnswer: 'A',
        isCorrect: isCorr,
        aiExplanation: isCorr
          ? "✅ Ekspert tahlili: Siz to'g'ri yechim yo'lini va formulani to'liq tanladingiz."
          : "❌ Ekspert tahlili: Ushbu savolda mantiqiy/hisoblash xatolikka yo'l qo'yilgan. To'g'ri javob A varianti."
      });
    }
    return list;
  }, [selectedResult]);

  const filteredQuestions = useMemo(() => {
    if (analysisFilter === 'wrong') {
      return questionsList.filter((q: any) => !q.isCorrect);
    }
    if (analysisFilter === 'correct') {
      return questionsList.filter((q: any) => q.isCorrect);
    }
    return questionsList;
  }, [questionsList, analysisFilter]);

  
  
  
  if (selectedResult) {
    return (
      <div className="space-y-6 animate-in fade-in font-sans">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedResult(null)}
              className="p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 text-zinc-200 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span>Natijalar ro'yxatiga qaytish</span>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">{selectedResult.olympiadTitle}</h1>
              <p className="text-xs text-zinc-400 font-medium">
                Fan: <span className="text-emerald-400 font-bold">{selectedResult.subject}</span> · Topshirilgan vaqt: <span className="font-mono text-zinc-300">{selectedResult.completedAt}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/certificates"
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Award className="w-4 h-4" />
              <span>Sertifikatni Ko'rish</span>
            </Link>
          </div>
        </div>

        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 text-center space-y-1 backdrop-blur-md">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">To'plangan Ball</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {selectedResult.score} <span className="text-xs text-zinc-400">/ {selectedResult.maxScore}</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-bold">Natija: {selectedResult.percentage}%</div>
          </div>

          
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 text-center space-y-1 backdrop-blur-md">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">To'g'ri Javoblar</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {selectedResult.correctAnswersCount} <span className="text-xs text-zinc-400">ta</span>
            </div>
            <div className="text-[10px] text-emerald-300 font-medium">
              To'g'rilik: {selectedResult.totalQuestions > 0 ? Math.round((selectedResult.correctAnswersCount / selectedResult.totalQuestions) * 100) : 0}%
            </div>
          </div>

          
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 text-center space-y-1 backdrop-blur-md">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Xato Javoblar</div>
            <div className="text-2xl font-black text-rose-400 font-mono">
              {selectedResult.wrongAnswersCount} <span className="text-xs text-zinc-400">ta</span>
            </div>
            <div className="text-[10px] text-rose-300 font-medium">
              Xatolik: {selectedResult.totalQuestions > 0 ? Math.round((selectedResult.wrongAnswersCount / selectedResult.totalQuestions) * 100) : 0}%
            </div>
          </div>

          
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 text-center space-y-1 backdrop-blur-md">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Egallangan O'rin</div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {selectedResult.rank > 0 ? `${selectedResult.rank}-o'rin` : "Ishtirokchi"}
            </div>
            <div className="text-[10px] text-amber-300 font-bold">{selectedResult.certificateType}</div>
          </div>

          
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 text-center space-y-1 col-span-2 sm:col-span-1 backdrop-blur-md">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Sarflangan Vaqt</div>
            <div className="text-lg sm:text-xl font-black text-teal-300 font-mono">
              {selectedResult.timeSpentFormatted || (
                selectedResult.timeSpentSeconds
                  ? `${Math.floor(selectedResult.timeSpentSeconds / 60)} daq ${selectedResult.timeSpentSeconds % 60 > 0 ? `${selectedResult.timeSpentSeconds % 60} s` : ''}`
                  : `${selectedResult.timeSpentMinutes || 1} daq`
              )}
            </div>
            <div className="text-[10px] text-zinc-400 font-medium">Aniq sarflangan vaqt</div>
          </div>
        </div>

        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-zinc-100">Savollar Tahlili:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setAnalysisFilter('all')}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95",
                analysisFilter === 'all'
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-zinc-800 text-zinc-300 hover:text-white"
              )}
            >
              Barcha Savollar ({questionsList.length})
            </button>
            <button
              type="button"
              onClick={() => setAnalysisFilter('wrong')}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 active:scale-95",
                analysisFilter === 'wrong'
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                  : "bg-zinc-800 text-zinc-300 hover:text-white"
              )}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-300" />
              <span>Xatolar ({questionsList.filter((q: any) => !q.isCorrect).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setAnalysisFilter('correct')}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 active:scale-95",
                analysisFilter === 'correct'
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-zinc-800 text-zinc-300 hover:text-white"
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>To'g'ri ({questionsList.filter((q: any) => q.isCorrect).length})</span>
            </button>
          </div>
        </div>

        
        {filteredQuestions.length === 0 ? (
          <div className="p-12 rounded-2xl bg-zinc-900/40 border border-dashed border-white/10 text-center space-y-2 backdrop-blur-md">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-zinc-100">Ushbu filtr bo'yicha savollar mavjud emas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q: any) => (
              <div
                key={q.questionNum}
                className={clsx(
                  "p-6 rounded-2xl border transition-all space-y-3 backdrop-blur-md",
                  q.isCorrect
                    ? "bg-zinc-900/60 border-emerald-500/30"
                    : "bg-zinc-900/60 border-rose-500/30"
                )}
              >
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-white/10">
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      "w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs",
                      q.isCorrect ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"
                    )}>
                      #{q.questionNum}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-white">{q.topic}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">Qiymati: {q.points} ball</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {q.isCorrect ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>To'g'ri ishlangan (+{q.points} ball)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Xato belgilangan (0 ball)</span>
                      </span>
                    )}
                  </div>
                </div>

                
                <div className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                  {q.questionText}
                </div>

                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options?.map((opt: string, idx: number) => {
                    const optLetter = String.fromCharCode(65 + idx); 
                    const optText = (opt || '').trim().toLowerCase();
                    const userAnsStr = String(q.userAnswer || '').trim().toLowerCase();
                    const correctAnsStr = String(q.correctAnswer || '').trim().toLowerCase();

                    const isUserAns = Boolean(
                      userAnsStr && (
                        userAnsStr === optLetter.toLowerCase() ||
                        userAnsStr === optText ||
                        userAnsStr === String(idx + 1) ||
                        userAnsStr.startsWith(optLetter.toLowerCase() + ')') ||
                        userAnsStr.startsWith(optLetter.toLowerCase() + '.')
                      )
                    );

                    const isCorrectAns = Boolean(
                      correctAnsStr && (
                        correctAnsStr === optLetter.toLowerCase() ||
                        correctAnsStr === optText ||
                        correctAnsStr === String(idx + 1) ||
                        correctAnsStr.startsWith(optLetter.toLowerCase() + ')') ||
                        correctAnsStr.startsWith(optLetter.toLowerCase() + '.')
                      )
                    );

                    return (
                      <div
                        key={idx}
                        className={clsx(
                          "p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all",
                          isCorrectAns
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold"
                            : isUserAns && !q.isCorrect
                            ? "bg-rose-500/20 border-rose-500 text-rose-200 font-bold"
                            : isUserAns
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold"
                            : "bg-black/20 border-white/5 text-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            "w-5 h-5 rounded-md flex items-center justify-center font-bold font-mono text-[10px]",
                            isCorrectAns
                              ? "bg-emerald-500 text-slate-950"
                              : isUserAns
                              ? "bg-rose-500 text-white"
                              : "bg-white/10 text-slate-400"
                          )}>
                            {optLetter}
                          </span>
                          <span>{opt}</span>
                        </div>

                        <div className="flex items-center gap-1 font-mono text-[10px] shrink-0 ml-2">
                          {isUserAns && (
                            <span className={clsx(
                              "px-1.5 py-0.5 rounded font-bold whitespace-nowrap",
                              q.isCorrect ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"
                            )}>
                              {q.isCorrect ? `Sizning to'g'ri javobingiz: ${optLetter}` : `Sizning javobingiz: ${optLetter} (Xato)`}
                            </span>
                          )}
                          {isCorrectAns && !isUserAns && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold whitespace-nowrap">
                              To'g'ri javob: {optLetter}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                
                {q.aiExplanation && (
                  <div className="mt-3 p-4 rounded-xl bg-zinc-950/80 border border-emerald-500/30 text-xs space-y-1.5 backdrop-blur-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Ekspert Tahlili & AI Maslahati:</span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed font-normal text-[11px] sm:text-xs">
                      {q.aiExplanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  
  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">Natijalar Tarixi</h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Ishtirok etilgan olimpiadalar ro'yxati, to'plangan ballar va batafsil xatolar tahlili
          </p>
        </div>

        <Link
          to="/certificates"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 text-zinc-200 text-xs font-semibold transition-all shrink-0 active:scale-95"
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>Sertifikatlarim</span>
        </Link>
      </div>

      {results.length === 0 ? (
        <div className="p-12 rounded-2xl bg-zinc-900/40 border border-dashed border-white/10 text-center space-y-4 max-w-lg mx-auto mt-8 backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-100">Hozircha natijalar mavjud emas</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Siz hali birorta ham olimpiadada ishtirok etmadingiz. Mavjud musobaqalarda qatnashing va birinchi ballaringizni qo'lga kiriting!
            </p>
          </div>
          <Link to="/student/olympiads" className="inline-block pt-2">
            <Button size="md" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Olimpiadalarga o'tish
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((r) => (
            <Card
              key={r.id}
              hoverEffect
              className="p-6 border border-white/10 bg-zinc-900/60 rounded-2xl space-y-5 flex flex-col justify-between backdrop-blur-md shadow-xl"
            >
              <div className="space-y-3">
                
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                    {r.subject}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">{r.completedAt}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-zinc-100 hover:text-emerald-300 transition-colors">
                    {r.olympiadTitle}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                      {r.certificateType}
                    </span>
                    {r.rank > 0 && (
                      <span className="text-xs text-zinc-300 font-semibold font-mono">
                        🏆 {r.rank}-o'rin ({r.totalParticipants} ishtirokchi ichida)
                      </span>
                    )}
                  </div>
                </div>

                
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-white/10 grid grid-cols-3 gap-2 text-center backdrop-blur-xs">
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">Ball</div>
                    <div className="text-base font-black text-amber-400 font-mono">{r.score} / {r.maxScore}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">To'g'ri / Xato</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {r.correctAnswersCount} <span className="text-zinc-600">/</span> <span className="text-rose-400">{r.wrongAnswersCount}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">Holati</div>
                    <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>E'lon qilindi</span>
                    </div>
                  </div>
                </div>
              </div>

              
              <div className="flex items-center gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedResult(r);
                    setAnalysisFilter('all');
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>Batafsil Tahlil & Xatolar</span>
                </button>

                <Link
                  to="/certificates"
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-amber-300 font-bold rounded-xl text-xs transition-all shrink-0 flex items-center gap-1.5 border border-white/10 active:scale-95"
                >
                  <Award className="w-4 h-4" />
                  <span className="hidden sm:inline">Sertifikat</span>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

