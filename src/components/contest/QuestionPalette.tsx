import React from 'react';
import { useContestStore } from '../../store/useContestStore';
import { clsx } from 'clsx';
import { CheckCircle2 } from 'lucide-react';

export const QuestionPalette: React.FC = () => {
  const questions = useContestStore((state) => state.questions);
  const currentQuestionIndex = useContestStore((state) => state.currentQuestionIndex);
  const answers = useContestStore((state) => state.answers);
  const goToQuestion = useContestStore((state) => state.goToQuestion);

  return (
    <div className="bg-white border border-border rounded-xl p-4 space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-accent-600">
        Savollar ro'yxati ({Object.keys(answers).length}/{questions.length} yechildi)
      </h4>
      
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, idx) => {
          const isAnswered = !!answers[q.id];
          const isCurrent = idx === currentQuestionIndex;

          return (
            <button
              key={q.id}
              onClick={() => goToQuestion(idx)}
              className={clsx(
                "relative flex items-center justify-center h-10 rounded-lg font-bold text-xs transition-all border",
                isCurrent
                  ? "bg-primary text-white border-primary shadow-md scale-105"
                  : isAnswered
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-surface text-accent-700 border-border hover:bg-accent-100"
              )}
            >
              <span>{idx + 1}</span>
              {isAnswered && !isCurrent && (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 absolute top-1 right-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
