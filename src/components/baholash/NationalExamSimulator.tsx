import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { raschService } from '../../services/raschAssessmentService';
import { CheckCircle2, Award, Clock, HelpCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
  points: number;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Quyidagi qaysi birikma ishqoriy metallarning peroksidlari sinfiga kiradi?",
    options: ["Na2O", "Na2O2", "K2O", "CaO"],
    correct: 1,
    points: 3.1
  },
  {
    id: 2,
    text: "0.2 mol gazning normal sharoitdagi hajmini (litrda) aniqlang.",
    options: ["2.24 L", "4.48 L", "22.4 L", "44.8 L"],
    correct: 1,
    points: 3.1
  },
  {
    id: 3,
    text: "Quyidagi moddalardan qaysi biri vodorod bog'lanish hosil qilmaydi?",
    options: ["H2O", "NH3", "CH4", "HF"],
    correct: 2,
    points: 3.1
  },
  {
    id: 4,
    text: "Benzol molekulasidagi gibridlangan uglerod atomlari qaysi holatda bo'ladi?",
    options: ["sp", "sp2", "sp3", "sp3d"],
    correct: 1,
    points: 3.1
  },
  {
    id: 5,
    text: "Standart elektrod potensiali eng yuqori bo'lgan metallni toping.",
    options: ["Li", "K", "Au", "Cu"],
    correct: 2,
    points: 3.1
  }
];

export const NationalExamSimulator: React.FC = () => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelect = (qId: number, optionIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleFinish = () => {
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  
  const totalRaw = Object.entries(selectedAnswers).reduce((acc, [qId, ansIdx]) => {
    const q = SAMPLE_QUESTIONS.find((item) => item.id === parseInt(qId));
    if (q && q.correct === ansIdx) {
      return acc + q.points;
    }
    return acc;
  }, 0);

  const maxExamRaw = SAMPLE_QUESTIONS.reduce((acc, q) => acc + q.points, 0);

  
  const stdScore = raschService.calcPropScore(totalRaw, 93, 65);
  const grade = raschService.getGrade(stdScore);

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl bg-[#111827] border border-[#1E293B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#3B82F6] text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Milliy Sertifikat Diagnostika Testi (Faqat Test Yechish)</span>
          </div>
          <h3 className="text-lg font-bold text-[#F1F5F9] mt-1">Kimyo va Mutaxassislik Fanlari Sinovi</h3>
          <p className="text-xs text-[#94A3B8]">
            Testni yeching va milliy sertifikat shkalasi bo'yicha darajangizni darhol bilib oling.
          </p>
        </div>

        {isSubmitted && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Qaytadan topshirish
          </Button>
        )}
      </div>

      {isSubmitted && (
        <Card className="p-6 bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#111827] border-2 border-[#10B981]/50 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-wider text-[#F1F5F9]">Sinov Natijasi</h4>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40">
              {grade} Daraja
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-lg bg-[#0B1120] border border-[#1E293B] text-center">
              <div className="text-xs text-[#94A3B8]">To'plangan Xom Ball</div>
              <div className="text-2xl font-mono font-bold text-[#F1F5F9] mt-1">
                {totalRaw.toFixed(1)} / {maxExamRaw.toFixed(1)}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0B1120] border border-[#1E293B] text-center">
              <div className="text-xs text-[#94A3B8]">Standartlashtirilgan Ball</div>
              <div className="text-2xl font-mono font-bold text-[#3B82F6] mt-1">
                {stdScore} ball
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0B1120] border border-[#1E293B] text-center">
              <div className="text-xs text-[#94A3B8]">Olingan Daraja</div>
              <div className="text-2xl font-mono font-bold text-[#10B981] mt-1">
                {grade}
              </div>
            </div>
          </div>
        </Card>
      )}

      
      <div className="space-y-4">
        {SAMPLE_QUESTIONS.map((q, idx) => {
          const selected = selectedAnswers[q.id];
          return (
            <Card key={q.id} className="p-6 bg-[#111827] border border-[#1E293B] space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h4 className="text-sm font-bold text-[#F1F5F9] leading-relaxed">
                  <span className="text-[#3B82F6] font-mono mr-2">{idx + 1}-savol.</span>
                  {q.text}
                </h4>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono text-[#94A3B8] bg-[#0B1120] border border-[#1E293B] shrink-0">
                  {q.points} b
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, optIdx) => {
                  const isOptSelected = selected === optIdx;
                  const isCorrect = isSubmitted && q.correct === optIdx;
                  const isWrong = isSubmitted && isOptSelected && !isCorrect;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelect(q.id, optIdx)}
                      className={clsx(
                        "p-3 rounded-lg border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between",
                        isCorrect
                          ? "bg-[#10B981]/15 border-[#10B981] text-[#34D399]"
                          : isWrong
                          ? "bg-[#EF4444]/15 border-[#EF4444] text-[#F87171]"
                          : isOptSelected
                          ? "bg-[#3B82F6]/15 border-[#3B82F6] text-white"
                          : "bg-[#0B1120] border-[#1E293B] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E293B]/60"
                      )}
                    >
                      <span>
                        <strong className="font-mono mr-2">{String.fromCharCode(65 + optIdx)})</strong>
                        {opt}
                      </span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {!isSubmitted && (
        <div className="flex justify-end pt-2">
          <Button
            size="lg"
            variant="primary"
            onClick={handleFinish}
            disabled={Object.keys(selectedAnswers).length === 0}
            className="font-bold shadow-lg shadow-[#3B82F6]/20"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Testni Yakunlash va Baholash
          </Button>
        </div>
      )}
    </div>
  );
};
