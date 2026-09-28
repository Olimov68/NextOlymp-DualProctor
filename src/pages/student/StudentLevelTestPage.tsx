import React, { useState } from 'react';
import { useLevelTestStore, LevelTestSet } from '../../store/useLevelTestStore';
import {
  Trophy,
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Filter,
  RotateCcw,
  Award,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';

export const StudentLevelTestPage: React.FC = () => {
  const { testSets } = useLevelTestStore();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [activeTest, setActiveTest] = useState<LevelTestSet | null>(null);

  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const filteredTests = testSets.filter((t) => {
    const matchSub = selectedSubject === 'all' || t.subject === selectedSubject;
    const matchGrade = selectedGrade === 'all' || t.grade === Number(selectedGrade);
    return matchSub && matchGrade;
  });

  const handleStartTest = (testSet: LevelTestSet) => {
    setActiveTest(testSet);
    setCurrentQIndex(0);
    setUserAnswers({});
    setIsSubmitted(false);
  };

  const handleSelectOption = (qId: string, optIndex: number) => {
    if (isSubmitted) return;
    const letter = String.fromCharCode(65 + optIndex); 
    setUserAnswers((prev) => ({ ...prev, [qId]: letter }));
  };

  const handleSubmitTest = () => {
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setActiveTest(null);
    setIsSubmitted(false);
    setUserAnswers({});
    setCurrentQIndex(0);
  };

  
  let totalScore = 0;
  let maxPossibleScore = 0;
  let correctCount = 0;

  if (activeTest) {
    activeTest.questions.forEach((q) => {
      maxPossibleScore += q.points;
      if (userAnswers[q.id] === q.correctAnswer) {
        totalScore += q.points;
        correctCount += 1;
      }
    });
  }

  const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  const getLevelBadge = (pct: number) => {
    if (pct >= 85) return { label: "Olimpiada Ustozi 🌟", color: "bg-amber-500 text-slate-950 border-amber-300" };
    if (pct >= 65) return { label: "Yuqori Daraja 🚀", color: "bg-emerald-600 text-white border-emerald-400" };
    if (pct >= 45) return { label: "O'rta Daraja 📈", color: "bg-blue-600 text-white border-blue-400" };
    return { label: "Boshlang'ich Daraja 📚", color: "bg-purple-600 text-white border-purple-400" };
  };

  return (
    <div className="space-y-8 font-sans pb-12">
      
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span>Darajani Test Qilish & O'tgan Yillar Savollari</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Akademik Darajangizni Sinab Ko'ring!
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            O'tgan yillardagi respublika va viloyat olimpiada savollarini yechish orqali o'z bilim darajangizni va tayyorgarligingizni baholang.
          </p>
        </div>
      </div>

      
      {activeTest ? (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl text-white">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                {activeTest.year}-yil • {activeTest.grade}-sinf • {activeTest.subject.toUpperCase()}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{activeTest.title}</h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ro'yxatga qaytish</span>
              </button>
            </div>
          </div>

          
          {isSubmitted && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 text-white space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xl">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase text-slate-400">Sizning Diagnostika Natijangiz</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-2xl font-black text-white">{totalScore} / {maxPossibleScore} ball ({percentage}%)</span>
                      <span className={clsx("px-3 py-1 rounded-full text-xs font-black border", getLevelBadge(percentage).color)}>
                        {getLevelBadge(percentage).label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400 font-mono">
                  To'g'ri javoblar: <strong className="text-emerald-400 font-bold">{correctCount} ta</strong> / {activeTest.questions.length} ta
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Tavsiya: Quyida har bir savol bo'yicha batafsil tahlil va to'g'ri javoblar keltirilgan. Kamchiliklaringizni ko'rib chiqib, olimpiadaga tayyorgarlikni yanada kuchaytiring!
              </p>
            </div>
          )}

          
          {!isSubmitted ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-bold text-slate-400">
                  Savol {currentQIndex + 1} / {activeTest.questions.length}
                </span>

                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                  {activeTest.questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={clsx(
                        "w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        currentQIndex === idx
                          ? "bg-amber-500 text-slate-950 font-black shadow-md"
                          : userAnswers[q.id]
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      )}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              
              {(() => {
                const q = activeTest.questions[currentQIndex];
                const selectedOpt = userAnswers[q.id];

                return (
                  <div className="space-y-6">
                    <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                      {currentQIndex + 1}. {q.questionText}
                    </h3>

                    <div className="space-y-3">
                      {q.options.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isSelected = selectedOpt === letter;

                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectOption(q.id, idx)}
                            className={clsx(
                              "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-sm font-medium",
                              isSelected
                                ? "bg-indigo-950/80 border-indigo-400 text-white font-bold shadow-md"
                                : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className={clsx(
                                "w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border",
                                isSelected ? "bg-indigo-500 text-white border-indigo-400" : "bg-slate-800 text-slate-400 border-slate-700"
                              )}>
                                {letter}
                              </span>
                              <span>{opt}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      <button
                        disabled={currentQIndex === 0}
                        onClick={() => setCurrentQIndex((prev) => prev - 1)}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Oldingisi
                      </button>

                      {currentQIndex < activeTest.questions.length - 1 ? (
                        <button
                          onClick={() => setCurrentQIndex((prev) => prev + 1)}
                          className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors cursor-pointer"
                        >
                          Keyingisi
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitTest}
                          className="px-6 py-2.5 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all cursor-pointer"
                        >
                          Testni Yakunlash
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Savollar Tahlili va To'g'ri Javoblar</h3>
              {activeTest.questions.map((q, idx) => {
                const userAns = userAnswers[q.id];
                const isCorrect = userAns === q.correctAnswer;

                return (
                  <div key={q.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-white space-y-3">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="font-bold text-sm">
                        {idx + 1}. {q.questionText}
                      </div>
                      <div className="shrink-0">
                        {isCorrect ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> To'g'ri (+{q.points} ball)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Noto'g'ri
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isUserChoice = userAns === letter;
                        const isRightAnswer = q.correctAnswer === letter;

                        return (
                          <div
                            key={optIdx}
                            className={clsx(
                              "p-2.5 rounded-xl border flex items-center justify-between font-medium",
                              isRightAnswer
                                ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold"
                                : isUserChoice
                                ? "bg-rose-950/60 border-rose-500 text-rose-300"
                                : "bg-slate-950/40 border-slate-800 text-slate-400"
                            )}
                          >
                            <span><strong>{letter})</strong> {opt}</span>
                            {isRightAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            {isUserChoice && !isRightAnswer && <XCircle className="w-4 h-4 text-rose-400" />}
                          </div>
                        );
                      })}
                    </div>

                    
                    <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 space-y-1">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Yechim Tahlili
                      </span>
                      <p>{q.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        
        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Filter className="w-4 h-4 text-amber-400" />
              <span>Filtrlash:</span>
            </div>

            
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full sm:w-56 p-2 text-xs border border-slate-800 rounded-xl bg-slate-950 font-bold text-blue-300 outline-none focus:border-amber-400"
            >
              <option value="all">Barcha fanlar</option>
              <option value="math">Matematika</option>
              <option value="physics">Fizika</option>
              <option value="chemistry">Kimyo</option>
              <option value="biology">Biologiya</option>
              <option value="informatics">Informatika</option>
            </select>

            
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full sm:w-44 p-2 text-xs border border-slate-800 rounded-xl bg-slate-950 font-bold text-white outline-none focus:border-amber-400"
            >
              <option value="all">Barcha sinflar</option>
              {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                <option key={g} value={g}>{g}-sinf</option>
              ))}
            </select>
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
              <div
                key={test.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-lg group transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      {test.subject.toUpperCase()} • {test.year}-yil
                    </span>
                    <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                      {test.grade}-sinf
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {test.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> {test.durationMinutes} daqiqa
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-400" /> {test.questions.length} ta savol
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartTest(test)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <span>Testni Boshlash</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
