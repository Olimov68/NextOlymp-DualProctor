import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../../types';
import { useSubmission } from '../../hooks/useSubmission';
import { useContestStore } from '../../store/useContestStore';
import { Upload, CheckCircle2, Code2, FileText, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, questionNumber }) => {
  const { t } = useTranslation();
  const { answers, saveDraft } = useSubmission();
  const currentAnswer = answers[question.id] || (question.type === 'code' ? question.codeTemplate || '' : '');

  
  const [secondsOnQuestion, setSecondsOnQuestion] = useState(0);
  const [speedWarning, setSpeedWarning] = useState<string | null>(null);
  const questionStartTimeRef = useRef(Date.now());
  const rapidCountRef = useRef(0);

  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    setSecondsOnQuestion(0);
    setSpeedWarning(null);

    const timer = setInterval(() => {
      setSecondsOnQuestion((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [question.id]);

  const handleSelectOption = (opt: string) => {
    const elapsedSeconds = (Date.now() - questionStartTimeRef.current) / 1000;
    
    
    if (elapsedSeconds < 0.8 && !answers[question.id]) {
      rapidCountRef.current += 1;
      setSpeedWarning(`O'ta tez javob (${elapsedSeconds.toFixed(1)}s). Iltimos, savolni to'liq o'qib ishlang.`);
      
      if (rapidCountRef.current >= 4) {
        useContestStore.getState().recordGuardViolation(
          'RAPID_ANSWER_SUSPECT',
          'Savollarga inson o\'qish imkoniyatidan tez javob belgilandi (4 marta ketma-ket 0.8 soniyadan kam). Iltimos, e\'tiborli bo\'ling.'
        );
        rapidCountRef.current = 0;
      }
    } else {
      setSpeedWarning(null);
    }

    saveDraft(question.id, opt);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    saveDraft(question.id, e.target.value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      saveDraft(question.id, `Yuklandi: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/70 backdrop-blur-md border border-white/10 p-6 sm:p-8 shadow-xl shadow-black/30 space-y-6 text-zinc-100">
      
      <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black flex items-center justify-center text-sm shadow-sm">
            #{questionNumber}
          </span>
          <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
            {question.type === 'multiple_choice' ? 'Variantli Test' : question.type === 'open_text' ? 'Ochiq Savol' : question.type === 'code' ? 'Algoritmik Kod' : 'Fayl Yuklash'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          
          <div className={clsx(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
            secondsOnQuestion < 5 ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-zinc-800/60 text-zinc-300 border-white/10"
          )}>
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sarflandi: {secondsOnQuestion}s</span>
          </div>

          <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 font-semibold text-xs rounded-full border border-emerald-500/30">
            {question.points} {t('contest.points')}
          </span>
        </div>
      </div>

      {speedWarning && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{speedWarning}</span>
        </div>
      )}

      
      <div className="prose max-w-none text-zinc-100 font-medium text-base sm:text-lg leading-relaxed">
        <p className="whitespace-pre-line">{question.content}</p>
      </div>

      
      <div className="pt-4 border-t border-white/10">
        {question.type === 'multiple_choice' && question.options && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {question.options.map((option, idx) => {
              const selected = currentAnswer === option;
              const optionLetter = String.fromCharCode(65 + idx); 

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(option)}
                  className={clsx(
                    "flex items-center justify-between p-4 rounded-xl border text-left font-medium text-sm transition-all duration-200 cursor-pointer active:scale-95",
                    selected
                      ? "border-emerald-500 bg-emerald-500/15 text-white ring-2 ring-emerald-500/30 shadow-md shadow-emerald-500/10"
                      : "border-white/10 bg-zinc-800/40 text-zinc-200 hover:border-emerald-500/40 hover:bg-zinc-800/80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      "w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center border transition-colors",
                      selected ? "bg-emerald-500 text-white border-emerald-500" : "bg-zinc-800 border-white/10 text-zinc-300"
                    )}>
                      {optionLetter}
                    </span>
                    <span>{option}</span>
                  </div>
                  {selected && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {question.type === 'open_text' && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Javobingizni kiriting (Matn yoki matematik qiymat):
            </label>
            <textarea
              rows={3}
              value={typeof currentAnswer === 'string' ? currentAnswer : ''}
              onChange={handleTextChange}
              placeholder="Javobingizni shu yerga yozing..."
              className="w-full p-4 rounded-xl border border-white/10 bg-zinc-950/70 text-zinc-100 placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono transition-all duration-200"
            />
          </div>
        )}

        {question.type === 'code' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-accent-900 text-accent-200 px-4 py-2 rounded-t-xl text-xs font-mono">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>IDE Code Editor ({question.codeLanguage?.toUpperCase() || 'C++'})</span>
              </div>
              <span className="text-[10px] text-accent-400">Autosaved to server</span>
            </div>
            <textarea
              rows={12}
              value={typeof currentAnswer === 'string' ? currentAnswer : ''}
              onChange={handleTextChange}
              className="w-full p-4 rounded-b-xl border border-accent-800 bg-accent-950 text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500 selection:bg-primary-600 selection:text-white"
            />
          </div>
        )}

        {question.type === 'file_upload' && (
          <div className="border-2 border-dashed border-border hover:border-primary-400 rounded-2xl p-8 text-center bg-surface transition-colors flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-accent-900">{t('contest.uploadFile')}</p>
              <p className="text-xs text-accent-500">Maksimal hajmi: 25 MB (PDF, ZIP, PNG, JPG)</p>
            </div>
            <label className="cursor-pointer">
              <span className="inline-flex items-center px-4 py-2 rounded-lg bg-white border border-border text-xs font-bold text-accent-800 shadow-2xs hover:bg-accent-50">
                {t('contest.chooseFile')}
              </span>
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>
            {typeof currentAnswer === 'string' && currentAnswer.startsWith('Yuklandi:') && (
              <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{currentAnswer}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
