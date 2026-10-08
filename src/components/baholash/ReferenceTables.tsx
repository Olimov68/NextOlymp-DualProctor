import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Table, BookOpen, Languages, Sparkles, CheckCircle2 } from 'lucide-react';
import { WRITING_MAP_24_75, raschService } from '../../services/raschAssessmentService';
import { clsx } from 'clsx';

export const ReferenceTables: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'spec' | 'lang'>('spec');

  const spec1Data = [
    { raw: 93.00, std: 75.0, grade: 'A+', note: 'Maksimal ball' },
    { raw: 92.86, std: 64.9, grade: 'B+', note: 'B+ yuqori chegarasi' },
    { raw: 85.85, std: 60.0, grade: 'B+', note: 'B+ boshlang\'ich' },
    { raw: 85.70, std: 59.9, grade: 'B',  note: 'B yuqori chegarasi' },
    { raw: 78.69, std: 55.0, grade: 'B',  note: 'B boshlang\'ich' },
    { raw: 78.55, std: 54.9, grade: 'C+', note: 'C+ yuqori chegarasi' },
    { raw: 71.54, std: 50.0, grade: 'C+', note: 'C+ boshlang\'ich' },
    { raw: 71.40, std: 49.9, grade: 'C',  note: 'C yuqori chegarasi' },
    { raw: 65.82, std: 46.0, grade: 'C',  note: 'C minimal chegara' },
  ];

  const spec2Data = [
    { raw: 63.00, std: 75.0, grade: 'A+', note: 'Maksimal ball' },
    { raw: 62.90, std: 64.9, grade: 'B+', note: 'B+ yuqori chegarasi' },
    { raw: 58.15, std: 60.0, grade: 'B+', note: 'B+ boshlang\'ich' },
    { raw: 58.06, std: 59.9, grade: 'B',  note: 'B yuqori chegarasi' },
    { raw: 53.31, std: 55.0, grade: 'B',  note: 'B boshlang\'ich' },
    { raw: 53.21, std: 54.9, grade: 'C+', note: 'C+ yuqori chegarasi' },
    { raw: 48.46, std: 50.0, grade: 'C+', note: 'C+ boshlang\'ich' },
    { raw: 48.36, std: 49.9, grade: 'C',  note: 'C yuqori chegarasi' },
    { raw: 44.58, std: 46.0, grade: 'C',  note: 'C minimal chegara' },
  ];

  const langEntries = Object.entries(WRITING_MAP_24_75)
    .filter(([k]) => k.includes('.'))
    .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));

  return (
    <div className="space-y-6">
      
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('spec')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95",
            activeTab === 'spec'
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Mutaxassislik Fanlari Jadvallari (1 va 2-fan)</span>
        </button>

        <button
          onClick={() => setActiveTab('lang')}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95",
            activeTab === 'lang'
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          )}
        >
          <Languages className="w-4 h-4" />
          <span>Til Fanlari Konversiyasi (24 → 75)</span>
        </button>
      </div>

      {activeTab === 'spec' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <Card className="p-5 bg-zinc-900/60 border border-white/10 space-y-4 rounded-2xl backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-black text-zinc-100">1-FAN Tabaqalashtirilgan Shkalasi</h4>
                <p className="text-xs text-zinc-400 mt-0.5">MAX = 93 ball | Formula: raw · 93 / 65</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                A = 65.0+
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-white/10">
                  <tr>
                    <th className="p-2.5">Xom Ball (raw)</th>
                    <th className="p-2.5 text-center">Standart Ball (std)</th>
                    <th className="p-2.5 text-center">Daraja</th>
                    <th className="p-2.5">Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-100 font-medium">
                  {spec1Data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-2.5 font-mono font-bold">{row.raw}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-emerald-400">{row.std}</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {row.grade}
                        </span>
                      </td>
                      <td className="p-2.5 text-zinc-400 text-[11px]">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          
          <Card className="p-5 bg-zinc-900/60 border border-white/10 space-y-4 rounded-2xl backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-black text-zinc-100">2-FAN Tabaqalashtirilgan Shkalasi</h4>
                <p className="text-xs text-zinc-400 mt-0.5">MAX = 63 ball | Formula: raw · 63 / 65</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                A = 65.0+
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-white/10">
                  <tr>
                    <th className="p-2.5">Xom Ball (raw)</th>
                    <th className="p-2.5 text-center">Standart Ball (std)</th>
                    <th className="p-2.5 text-center">Daraja</th>
                    <th className="p-2.5">Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-100 font-medium">
                  {spec2Data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-2.5 font-mono font-bold">{row.raw}</td>
                      <td className="p-2.5 text-center font-mono font-bold text-emerald-400">{row.std}</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          {row.grade}
                        </span>
                      </td>
                      <td className="p-2.5 text-zinc-400 text-[11px]">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-6 bg-zinc-900/60 border border-white/10 space-y-4 rounded-2xl backdrop-blur-md shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h4 className="text-sm font-black text-zinc-100">O'zbek / Rus / Qoraqalpoq Tili va Adabiyoti</h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Yozma ish bahosi (24 ballik mezon) → 75 ballik shkalaga o'tkazishning rasmiy BMBA mapping jadvali
              </p>
            </div>
            <div className="text-xs text-zinc-400 font-mono">
              Jami nuqtalar: <span className="font-bold text-zinc-100">{langEntries.length} ta</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[480px] overflow-y-auto custom-scrollbar p-1">
            {langEntries.map(([ball24, ball75]) => (
              <div key={ball24} className="p-2 rounded-xl bg-zinc-950/80 border border-white/10 text-center space-y-1">
                <div className="text-[10px] text-zinc-400 uppercase">Xom {ball24} b</div>
                <div className="text-sm font-mono font-black text-emerald-400">→ {ball75} b</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
