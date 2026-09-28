import React, { useState } from 'react';
import { RaschCalculator } from '../../components/baholash/RaschCalculator';
import { ReferenceTables } from '../../components/baholash/ReferenceTables';
import { RubricScorer } from '../../components/baholash/RubricScorer';
import { NationalExamSimulator } from '../../components/baholash/NationalExamSimulator';
import { Calculator, Table, FileEdit, Award, Sparkles, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';

export const BaholashPage: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'calc' | 'tables' | 'rubric' | 'exam'>('calc');

  const modules = [
    { id: 'calc', label: "Rasch & Proporsional Kalkulyator", icon: Calculator },
    { id: 'tables', label: "Tabaqalashtirilgan Jadvallar", icon: Table },
    { id: 'rubric', label: "Yozma Ish Mezonlari (Rubric)", icon: FileEdit },
    { id: 'exam', label: "Milliy Sertifikat Sinov Testi", icon: Award },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#0B1120] text-[#F1F5F9]">
      
      <div className="relative overflow-hidden bg-gradient-to-r from-[#111827] via-[#1E293B] to-[#111827] text-[#F1F5F9] rounded-xl p-6 sm:p-8 border border-[#1E293B] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-xs font-bold text-[#60A5FA]">
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Rasch & BMBA Standartlashtirish Tizimi</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F1F5F9]">
            Baholash Moduli
          </h1>

          <p className="text-xs text-[#94A3B8] max-w-2xl leading-relaxed">
            Mutaxassislik fanlari, til fanlari konversiyasi (24 → 75) hamda Rasch modelining Z va T-shkalalari asosida avtomatlashtirilgan baholash markazi.
          </p>
        </div>
      </div>

      
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#1E293B]">
        {modules.map((m) => {
          const Icon = m.icon;
          const active = activeModule === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveModule(m.id)}
              className={clsx(
                "flex items-center gap-2.5 px-4 py-3 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer",
                active
                  ? "bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/20"
                  : "bg-[#111827] hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#1E293B]"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      
      <div>
        {activeModule === 'calc' && <RaschCalculator />}
        {activeModule === 'tables' && <ReferenceTables />}
        {activeModule === 'rubric' && <RubricScorer />}
        {activeModule === 'exam' && <NationalExamSimulator />}
      </div>
    </div>
  );
};

export default BaholashPage;
