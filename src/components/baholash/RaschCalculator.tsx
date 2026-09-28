import React, { useState, useMemo } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { raschService, GradeLevel, GRADE_BANDS } from '../../services/raschAssessmentService';
import { Calculator, Sparkles, TrendingUp, Info, CheckCircle2, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export const RaschCalculator: React.FC = () => {
  const [calcMode, setCalcMode] = useState<'prop' | 'rash'>('prop');

  
  const [selectedSubjectType, setSelectedSubjectType] = useState<'spec_1' | 'spec_2'>('spec_1');
  const [rawScore, setRawScore] = useState<number>(85.85);

  
  const [theta, setTheta] = useState<number>(1.5);
  const [mu, setMu] = useState<number>(0.0);
  const [sigma, setSigma] = useState<number>(1.0);

  
  const [writingScore, setWritingScore] = useState<number>(68);
  const [includeWriting, setIncludeWriting] = useState<boolean>(true);

  
  const calculation = useMemo(() => {
    let stdScore = 0;
    let zScore = 0;
    let tScore = 0;

    if (calcMode === 'rash') {
      const res = raschService.calcRashScore(theta, mu, sigma);
      zScore = res.Z;
      tScore = res.T;
      stdScore = tScore;
    } else {
      stdScore = raschService.calcBMBAStandardScore(rawScore, selectedSubjectType);
    }

    const testGrade = raschService.getGrade(stdScore);
    const overallScore = includeWriting ? raschService.finalScore(stdScore, writingScore) : stdScore;
    const overallGrade = raschService.getGrade(overallScore);

    return {
      stdScore,
      zScore,
      tScore,
      testGrade,
      overallScore,
      overallGrade
    };
  }, [calcMode, selectedSubjectType, rawScore, theta, mu, sigma, writingScore, includeWriting]);

  const maxRawLimit = selectedSubjectType === 'spec_1' ? 93 : 63;

  
  const getGradeColor = (g: GradeLevel) => {
    if (g === 'A+' || g === 'A') return 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/40';
    if (g === 'B+' || g === 'B') return 'bg-[#3B82F6]/15 text-[#60A5FA] border-[#3B82F6]/40';
    if (g === 'C+' || g === 'C') return 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/40';
    return 'bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/40';
  };

  return (
    <div className="space-y-6">
      
      <div className="p-4 rounded-xl bg-[#111827] border border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA]">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F1F5F9]">Standartlashtirish Rejimi</h3>
            <p className="text-xs text-[#94A3B8]">BMBA Rasch logit jadvallari yoki ilmiy Rasch Z va T shkalasi</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#0B1120] p-1 rounded-lg border border-[#1E293B]">
          <button
            type="button"
            onClick={() => setCalcMode('prop')}
            className={clsx(
              "px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer",
              calcMode === 'prop'
                ? "bg-[#3B82F6] text-white shadow-sm"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            )}
          >
            BMBA Rasch Standart (Default)
          </button>
          <button
            type="button"
            onClick={() => setCalcMode('rash')}
            className={clsx(
              "px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer",
              calcMode === 'rash'
                ? "bg-[#3B82F6] text-white shadow-sm"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            )}
          >
            Rasch Modeli (Z va T)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 bg-[#111827] border border-[#1E293B] space-y-5">
            <h4 className="text-sm font-black uppercase tracking-wider text-[#F1F5F9] border-b border-[#1E293B] pb-3 flex items-center justify-between">
              <span>Parametrlarni Kiritish</span>
              <span className="text-[11px] font-mono text-[#3B82F6] font-normal">
                {calcMode === 'prop' ? 'BMBA Shkalasi (MAX 75.0 std)' : 'Z=(θ−μ)/σ | T=50+10·Z'}
              </span>
            </h4>

            {calcMode === 'prop' ? (
              <div className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Mutaxassislik Fani</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSubjectType('spec_1')}
                      className={clsx(
                        "p-3 rounded-lg border text-left transition-all cursor-pointer",
                        selectedSubjectType === 'spec_1'
                          ? "bg-[#3B82F6]/10 border-[#3B82F6] text-white"
                          : "bg-[#0B1120] border-[#1E293B] text-[#94A3B8] hover:text-white"
                      )}
                    >
                      <div className="text-xs font-bold">1-Fan (Asosiy)</div>
                      <div className="text-[11px] text-[#60A5FA] font-mono mt-0.5">MAX = 93 ball</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSubjectType('spec_2')}
                      className={clsx(
                        "p-3 rounded-lg border text-left transition-all cursor-pointer",
                        selectedSubjectType === 'spec_2'
                          ? "bg-[#3B82F6]/10 border-[#3B82F6] text-white"
                          : "bg-[#0B1120] border-[#1E293B] text-[#94A3B8] hover:text-white"
                      )}
                    >
                      <div className="text-xs font-bold">2-Fan (Qo'shimcha)</div>
                      <div className="text-[11px] text-[#60A5FA] font-mono mt-0.5">MAX = 63 ball</div>
                    </button>
                  </div>
                </div>

                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold uppercase tracking-wider text-[#94A3B8]">
                      To'plangan Xom Ball (Raw Score)
                    </label>
                    <span className="font-mono text-[#F1F5F9] font-bold">
                      {rawScore} / {maxRawLimit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={maxRawLimit}
                    step="0.05"
                    value={rawScore}
                    onChange={(e) => setRawScore(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#0B1120] rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
                  />
                  <div className="pt-1">
                    <Input
                      type="number"
                      value={rawScore}
                      min={0}
                      max={maxRawLimit}
                      step={0.1}
                      onChange={(e) => setRawScore(Math.min(Math.max(parseFloat(e.target.value) || 0, 0), maxRawLimit))}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Input
                      label="θ (Qobiliyat logiti)"
                      type="number"
                      step={0.1}
                      value={theta}
                      onChange={(e) => setTheta(parseFloat(e.target.value) || 0)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Input
                      label="μ (O'rtacha mean)"
                      type="number"
                      step={0.1}
                      value={mu}
                      onChange={(e) => setMu(parseFloat(e.target.value) || 0)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Input
                      label="σ (Standart og'ish SD)"
                      type="number"
                      step={0.1}
                      min={0.1}
                      value={sigma}
                      onChange={(e) => setSigma(parseFloat(e.target.value) || 1)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#0B1120] border border-[#1E293B] rounded-lg text-xs text-[#94A3B8] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#3B82F6] font-bold">
                    <Info className="w-3.5 h-3.5" />
                    <span>Rasch formulasi qadamlari:</span>
                  </div>
                  <p>1. Z-ball: <code className="text-[#F1F5F9]">Z = ({theta} − {mu}) / {sigma} = {calculation.zScore}</code></p>
                  <p>2. T-shkala: <code className="text-[#F1F5F9]">T = 50 + 10 · ({calculation.zScore}) = {calculation.tScore}</code></p>
                </div>
              </div>
            )}

            
            <div className="pt-4 border-t border-[#1E293B] space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#F1F5F9]">
                <input
                  type="checkbox"
                  checked={includeWriting}
                  onChange={(e) => setIncludeWriting(e.target.checked)}
                  className="rounded text-[#3B82F6] focus:ring-[#3B82F6]"
                />
                <span>Yozma ish natijasini ham qo'shib yakuniy o'rtacha ballni hisoblash</span>
              </label>

              {includeWriting && (
                <div className="space-y-1.5 pl-6">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                    <span>Yozma ish balli (75 shkalada)</span>
                    <span className="font-mono font-bold text-[#F1F5F9]">{writingScore} / 75</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="75"
                    step="1"
                    value={writingScore}
                    onChange={(e) => setWritingScore(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#0B1120] rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
                  />
                </div>
              )}
            </div>
          </Card>

          
          <div className="p-5 rounded-xl bg-[#111827] border border-[#1E293B] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Daraja Chegaralari Standarti</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GRADE_BANDS.slice(0, 6).map((band) => (
                <div key={band.grade} className="p-2 rounded-lg bg-[#0B1120] border border-[#1E293B] text-xs flex items-center justify-between">
                  <span className="font-bold text-[#F1F5F9]">{band.grade}</span>
                  <span className="font-mono text-[#94A3B8]">{band.minStd} - {band.maxStd}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 bg-[#111827] border-2 border-[#3B82F6]/40 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Hisoblangan Natija</span>
              <span className={clsx("px-3 py-1 rounded-full text-xs font-black border", getGradeColor(calculation.overallGrade))}>
                {calculation.overallGrade} Daraja
              </span>
            </div>

            <div className="space-y-4">
              
              <div className="p-4 rounded-xl bg-[#0B1120] border border-[#1E293B] text-center space-y-1">
                <div className="text-xs text-[#94A3B8] uppercase font-bold tracking-wider">
                  {calcMode === 'prop' ? 'Standartlashtirilgan Ball' : 'T-Ball (Rasch)'}
                </div>
                <div className="text-4xl font-black text-[#F1F5F9] font-mono">
                  {calculation.stdScore}
                </div>
                <div className="text-[11px] text-[#10B981] font-semibold">
                  Test bo'yicha daraja: {calculation.testGrade}
                </div>
              </div>

              
              {includeWriting && (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B]">
                    <div className="text-[10px] text-[#94A3B8] uppercase font-bold">Yozma Ish</div>
                    <div className="text-xl font-bold font-mono text-[#F59E0B]">{writingScore} ball</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0B1120] border border-[#1E293B]">
                    <div className="text-[10px] text-[#94A3B8] uppercase font-bold">O'rtacha Yakuniy</div>
                    <div className="text-xl font-bold font-mono text-[#3B82F6]">{calculation.overallScore} ball</div>
                  </div>
                </div>
              )}
            </div>

            
            <div className="space-y-2 pt-2 border-t border-[#1E293B]">
              <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                <span>Normal Taqsimot (Bell Curve)</span>
                <span className="font-mono text-[#3B82F6]">Ball: {calculation.stdScore}</span>
              </div>

              <div className="relative w-full h-28 bg-[#0B1120] rounded-lg border border-[#1E293B] p-2 flex items-end justify-center overflow-hidden">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="bellGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  <path
                    d="M 0,95 Q 75,95 100,70 T 150,15 T 200,70 Q 225,95 300,95 L 300,100 L 0,100 Z"
                    fill="url(#bellGrad)"
                  />
                  <path
                    d="M 0,95 Q 75,95 100,70 T 150,15 T 200,70 Q 225,95 300,95"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />
                  
                  {(() => {
                    const normalizedX = Math.min(Math.max((calculation.stdScore / 75) * 300, 10), 290);
                    return (
                      <g>
                        <line x1={normalizedX} y1="0" x2={normalizedX} y2="100" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />
                        <circle cx={normalizedX} cy="30" r="4" fill="#F59E0B" />
                        <text x={normalizedX} y="15" fill="#F59E0B" fontSize="10" textAnchor="middle" fontWeight="bold">Siz</text>
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
