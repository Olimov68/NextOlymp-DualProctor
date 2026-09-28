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
      
      <div className="p-5 rounded-xl bg-[#111827] border border-[#1E293B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#F59E0B] text-xs font-black uppercase tracking-wider">
            <FileEdit className="w-4 h-4" />
            <span>BMBA Standart Yozma Ish Baholash Mezonlari (Rubric)</span>
          </div>
          <h3 className="text-lg font-bold text-[#F1F5F9]">3 ta Topshiriq × 25 ball = 75 maksimal ball</h3>
          <p className="text-xs text-[#94A3B8]">
            Har bir topshiriqning qismlari bo'yicha mustaqil baholang
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-[#94A3B8]">Jami Yozma Ball</div>
            <div className="text-3xl font-black font-mono text-[#10B981]">
              {totalWritingScore} <span className="text-sm font-normal text-[#94A3B8]">/ 75</span>
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
                "border transition-all duration-200 bg-[#111827]",
                isExpanded ? "border-[#3B82F6]/60 shadow-lg shadow-[#3B82F6]/5" : "border-[#1E293B]"
              )}
            >
              
              <div
                onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                className="p-5 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 flex items-center justify-center font-mono font-black text-xs">
                    {task.id}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#F1F5F9]">{task.title}</h4>
                    <span className="text-xs text-[#94A3B8]">
                      Taqsimot: [{task.parts.map((p) => p.maxScore).join(', ')}] = {task.totalMax} ball
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-base font-black text-[#F1F5F9]">
                    {taskScore} / {task.totalMax} b
                  </span>
                  <div className="p-1 rounded-md bg-[#0B1120] text-[#94A3B8]">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              
              {isExpanded && (
                <div className="p-5 pt-0 space-y-4 border-t border-[#1E293B]">
                  {task.parts.map((part) => (
                    <div
                      key={part.id}
                      className="p-4 rounded-lg bg-[#0B1120] border border-[#1E293B] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-[#F1F5F9]">{part.name}</div>
                          <p className="text-xs text-[#94A3B8] mt-0.5">{part.criterion}</p>
                        </div>
                        <div className="inline-flex items-center gap-2 shrink-0">
                          <span className="text-xs text-[#94A3B8] font-mono">
                            Tarkib: ({part.breakdown})
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#111827] border border-[#1E293B] text-[#60A5FA]">
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
                          className="flex-1 h-2 bg-[#111827] rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
                        />

                        <div className="w-20 shrink-0">
                          <input
                            type="number"
                            min="0"
                            max={part.maxScore}
                            step="0.5"
                            value={part.currentScore || 0}
                            onChange={(e) => handleScoreUpdate(task.id, part.id, parseFloat(e.target.value))}
                            className="w-full px-2 py-1 text-center font-mono font-bold text-xs bg-[#111827] border border-[#1E293B] rounded text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
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
