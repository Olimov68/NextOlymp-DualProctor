import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { raschService, RubricTask } from '../../services/raschAssessmentService';
import { FileEdit, CheckCircle2, RotateCcw, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';

interface RubricScorerProps {
  onScoreChange?: (totalScore: number) => void;
}

export const RubricScorer: React.FC<RubricScorerProps> = ({ onScoreChange }) => {
  const [rubrics, setRubrics] = useState<RubricTask[]>(() => raschService.getRubrics());
  const [expandedTask, setExpandedTask] = useState<number | null>(41);

  
  const totalWritingScore = useMemo(() => {
    return raschService.sumRubric(rubrics);
  }, [rubrics]);

  useEffect(() => {
    if (onScoreChange) {
      onScoreChange(totalWritingScore);
    }
  }, [totalWritingScore, onScoreChange]);

  const handleScoreUpdate = (taskId: number, partId: string, score: number) => {
    const updated = rubrics.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          parts: t.parts.map((p) => {
            if (p.id === partId) {
              const clamped = Math.min(Math.max(score, 0), p.maxScore);
              return { ...p, currentScore: clamped };
            }
            return p;
          })
        };
      }
      return t;
    });
    setRubrics(updated);
  };

  const handleReset = () => {
    const reset = raschService.resetRubrics();
    setRubrics(reset);
  };

  return (
    <div className="space-y-6">
      
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
            <FileEdit className="w-4 h-4" />
            <span>BMBA Standart Yozma Ish Baholash Mezonlari (Rubric)</span>
          </div>
          <h3 className="text-lg font-bold text-zinc-100">3 ta Topshiriq × 25 ball = 75 maksimal ball</h3>
          <p className="text-xs text-zinc-400">
            Har bir topshiriqning qismlari bo'yicha mustaqil baholang
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-zinc-400">Jami Yozma Ball</div>
            <div className="text-3xl font-black font-mono text-emerald-400">
              {totalWritingScore} <span className="text-sm font-normal text-zinc-400">/ 75</span>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Qayta o'rnatish
          </Button>
        </div>
      </div>

      
      <div className="space-y-4">
        {rubrics.map((task) => {
          const isExpanded = expandedTask === task.id;
          const taskScore = task.parts.reduce((acc, p) => acc + (p.currentScore || 0), 0);

          return (
            <Card
              key={task.id}
              className={clsx(
                "border transition-all duration-200 bg-zinc-900/60 rounded-2xl backdrop-blur-md shadow-lg",
                isExpanded ? "border-emerald-500/40 shadow-emerald-500/5 ring-1 ring-emerald-500/20" : "border-white/10"
              )}
            >
              
              <div
                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                className="p-5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-mono font-black text-xs">
                    {task.id}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">{task.title}</h4>
                    <span className="text-xs text-zinc-400">
                      Taqsimot: [{task.parts.map((p) => p.maxScore).join(', ')}] = {task.totalMax} ball
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-base font-black text-zinc-100">
                    {taskScore} / {task.totalMax} b
                  </span>
                  <div className="p-1 rounded-lg bg-zinc-950 text-zinc-400 border border-white/10">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              
              {isExpanded && (
                <div className="p-5 pt-0 space-y-4 border-t border-white/10">
                  {task.parts.map((part) => (
                    <div
                      key={part.id}
                      className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-zinc-100">{part.name}</div>
                          <p className="text-xs text-zinc-400 mt-0.5">{part.criterion}</p>
                        </div>
                        <div className="inline-flex items-center gap-2 shrink-0">
                          <span className="text-xs text-zinc-400 font-mono">
                            Tarkib: ({part.breakdown})
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            Max: {part.maxScore} b
                          </span>
                        </div>
                      </div>

                      
                      <div className="flex items-center gap-4 pt-1">
                        <input
                          type="range"
                          min="0"
                          max={part.maxScore}
                          step="0.5"
                          value={part.currentScore || 0}
                          onChange={(e) => handleScoreUpdate(task.id, part.id, parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />

                        <div className="w-20 shrink-0">
                          <input
                            type="number"
                            min="0"
                            max={part.maxScore}
                            step="0.5"
                            value={part.currentScore || 0}
                            onChange={(e) => handleScoreUpdate(task.id, part.id, parseFloat(e.target.value))}
                            className="w-full px-2 py-1 text-center font-mono font-bold text-xs bg-zinc-900 border border-white/10 rounded-lg text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
