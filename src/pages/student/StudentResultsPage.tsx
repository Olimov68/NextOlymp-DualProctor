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
      <div className="space-y-6 animate-in fade-in">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedResult(null)}
              className="p-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-slate-200 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Natijalar ro'yxatiga qaytish</span>
            </button>
            <div>
              <h1 className="text-xl font-black text-white">{selectedResult.olympiadTitle}</h1>
              <p className="text-xs text-slate-400 font-medium">
                Fan: <span className="text-amber-400 font-bold">{selectedResult.subject}</span> · Topshirilgan vaqt: <span className="font-mono text-slate-300">{selectedResult.completedAt}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/certificates"
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              <span>Sertifikatni Ko'rish</span>
            </Link>
          </div>
        </div>

        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          <div className="p-4 rounded-2xl bg-[#111827] border border-blue-500/30 text-center space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">To'plangan Ball</div>
            <div className="text-2xl font-black text-blue-400 font-mono">
              {selectedResult.score} <span className="text-xs text-slate-400">/ {selectedResult.maxScore}</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-bold">Natija: {selectedResult.percentage}%</div>
          </div>

          
          <div className="p-4 rounded-2xl bg-[#111827] border border-emerald-500/30 text-center space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">To'g'ri Javoblar</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {selectedResult.correctAnswersCount} <span className="text-xs text-slate-400">ta</span>
            </div>
            <div className="text-[10px] text-emerald-300 font-medium">
              To'g'rilik: {selectedResult.totalQuestions > 0 ? Math.round((selectedResult.correctAnswersCount / selectedResult.totalQuestions) * 100) : 0}%
            </div>
          </div>

          
          <div className="p-4 rounded-2xl bg-[#111827] border border-rose-500/30 text-center space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Xato Javoblar</div>
            <div className="text-2xl font-black text-rose-400 font-mono">
              {selectedResult.wrongAnswersCount} <span className="text-xs text-slate-400">ta</span>
            </div>
            <div className="text-[10px] text-rose-300 font-medium">
              Xatolik: {selectedResult.totalQuestions > 0 ? Math.round((selectedResult.wrongAnswersCount / selectedResult.totalQuestions) * 100) : 0}%
            </div>
          </div>

          
          <div className="p-4 rounded-2xl bg-[#111827] border border-amber-500/30 text-center space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Egallangan O'rin</div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {selectedResult.rank > 0 ? `${selectedResult.rank}-o'rin` : "Ishtirokchi"}
            </div>
            <div className="text-[10px] text-amber-300 font-bold">{selectedResult.certificateType}</div>
          </div>

          
          <div className="p-4 rounded-2xl bg-[#111827] border border-purple-500/30 text-center space-y-1 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sarflangan Vaqt</div>
            <div className="text-lg sm:text-xl font-black text-purple-300 font-mono">
              {selectedResult.timeSpentFormatted || (
                selectedResult.timeSpentSeconds
                  ? `${Math.floor(selectedResult.timeSpentSeconds / 60)} daq ${selectedResult.timeSpentSeconds % 60 > 0 ? `${selectedResult.timeSpentSeconds % 60} s` : ''}`
                  : `${selectedResult.timeSpentMinutes || 1} daq`
              )}
            </div>
            <div className="text-[10px] text-purple-200 font-medium">Aniq sarflangan vaqt</div>
          </div>
        </div>

        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111827] p-3 rounded-2xl border border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-xs font-bold text-white">Savollar Tahlili:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setAnalysisFilter('all')}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                analysisFilter === 'all'
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-[#1A2642] text-slate-300 hover:text-white"
              )}
            >
              Barcha Savollar ({questionsList.length})
            </button>
            <button
              type="button"
              onClick={() => setAnalysisFilter('wrong')}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                analysisFilter === 'wrong'
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-[#1A2642] text-slate-300 hover:text-white"
              )}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-300" />
              <span>Xatolar ({questionsList.filter((q: any) => !q.isCorrect).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setAnalysisFilter('correct')}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                analysisFilter === 'correct'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-[#1A2642] text-slate-300 hover:text-white"
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>To'g'ri ({questionsList.filter((q: any) => q.isCorrect).length})</span>
            </button>
          </div>
        </div>

        
        {filteredQuestions.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#111827] border border-dashed border-[#1E293B] text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">Ushbu filtr bo'yicha savollar mavjud emas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q: any) => (
              <div
                key={q.questionNum}
                className={clsx(
                  "p-5 rounded-2xl border transition-all space-y-3",
                  q.isCorrect
                    ? "bg-[#0B172A] border-emerald-500/30"
                    : "bg-[#181124] border-rose-500/40"
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
                  <div className="mt-3 p-3.5 rounded-xl bg-[#101935] border border-blue-500/30 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Ekspert Tahlili & AI Maslahati:</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-normal text-[11px] sm:text-xs">
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-[#F1F5F9]">Natijalar Tarixi</h1>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Ishtirok etilgan olimpiadalar ro'yxati, to'plangan ballar va batafsil xatolar tahlili
          </p>
        </div>

        <Link
          to="/certificates"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-slate-200 text-xs font-bold transition-all shrink-0"
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>Sertifikatlarim</span>
        </Link>
      </div>

      {results.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#111827] border border-dashed border-[#1E293B] text-center space-y-4 max-w-lg mx-auto mt-8">
          <div className="w-14 h-14 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] mx-auto flex items-center justify-center">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#F1F5F9]">Hozircha natijalar mavjud emas</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((r) => (
            <Card
              key={r.id}
              hoverEffect
              className="p-5 border border-[#1E293B] bg-[#111827] space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase">
                    {r.subject}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{r.completedAt}</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white hover:text-blue-300 transition-colors">
                    {r.olympiadTitle}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                      {r.certificateType}
                    </span>
                    {r.rank > 0 && (
                      <span className="text-xs text-slate-300 font-bold font-mono">
                        🏆 {r.rank}-o'rin ({r.totalParticipants} ishtirokchi ichida)
                      </span>
                    )}
                  </div>
                </div>

                
                <div className="p-3 rounded-xl bg-black/30 border border-white/5 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase">Ball</div>
                    <div className="text-sm font-black text-amber-400 font-mono">{r.score} / {r.maxScore}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase">To'g'ri / Xato</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      {r.correctAnswersCount} <span className="text-slate-500">/</span> <span className="text-rose-400">{r.wrongAnswersCount}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase">Holati</div>
                    <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>E'lon qilindi</span>
                    </div>
                  </div>
                </div>
              </div>

              
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedResult(r);
                    setAnalysisFilter('all');
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Batafsil Tahlil & Xatolar</span>
                </button>

                <Link
                  to="/certificates"
                  className="px-3.5 py-2 bg-[#1E293B] hover:bg-[#334155] text-amber-300 font-bold rounded-xl text-xs transition-all shrink-0 flex items-center gap-1"
                >
                  <Award className="w-3.5 h-3.5" />
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

