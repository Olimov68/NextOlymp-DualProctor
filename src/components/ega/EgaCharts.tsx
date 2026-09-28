import React from 'react';
import { Card } from '../common/Card';
import { TrendingUp, BarChart3, MapPin } from 'lucide-react';

export const EgaCharts: React.FC = () => {
  const subjectStats = [
    { name: 'Matematika', count: 5420, percentage: 85, color: 'bg-blue-600' },
    { name: 'Informatika (ICPC)', count: 4180, percentage: 72, color: 'bg-indigo-600' },
    { name: 'Fizika', count: 2950, percentage: 55, color: 'bg-purple-600' },
    { name: 'Kimyo', count: 1840, percentage: 40, color: 'bg-teal-600' },
    { name: 'Biologiya', count: 1030, percentage: 28, color: 'bg-emerald-600' },
  ];

  const regionStats = [
    { region: 'Toshkent shahri', count: 4850, share: '31.4%' },
    { region: 'Samarqand viloyati', count: 2420, share: '15.7%' },
    { region: 'Farg\'ona viloyati', count: 2100, share: '13.6%' },
    { region: 'Buxoro viloyati', count: 1890, share: '12.2%' },
    { region: 'Xorazm viloyati', count: 1420, share: '9.2%' },
    { region: 'Boshqa viloyatlar', count: 2740, share: '17.9%' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <Card className="lg:col-span-2 p-6 bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider">
              Tizim Dinamikasi
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Haftalik Ro‘yxatdan O‘tish va Qatnashuv Dinamikasi
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
              <span className="text-slate-700">Registratsiyalar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block"></span>
              <span className="text-slate-700">Test Yechganlar</span>
            </div>
          </div>
        </div>

        
        <div className="h-64 w-full relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            
            <line x1="0" y1="40" x2="500" y2="40" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="0" y1="80" x2="500" y2="80" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="0" y1="120" x2="500" y2="120" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="0" y1="160" x2="500" y2="160" stroke="#F1F5F9" strokeWidth="1" />

            
            <path
              d="M0,160 Q70,120 140,90 T280,50 T420,30 L500,20 L500,200 L0,200 Z"
              fill="url(#gradBlue)"
            />
            <path
              d="M0,160 Q70,120 140,90 T280,50 T420,30 L500,20"
              fill="none"
              stroke="#2563EB"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            
            <path
              d="M0,180 Q70,150 140,110 T280,80 T420,55 L500,40 L500,200 L0,200 Z"
              fill="url(#gradCyan)"
            />
            <path
              d="M0,180 Q70,150 140,110 T280,80 T420,55 L500,40"
              fill="none"
              stroke="#06B6D4"
              strokeWidth="3"
              strokeDasharray="4 2"
              strokeLinecap="round"
            />

            
            <circle cx="140" cy="90" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="280" cy="50" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            <circle cx="420" cy="30" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
          </svg>

          
          <div className="flex justify-between text-[11px] font-bold text-slate-400 pt-2 border-t border-slate-100">
            <span>Dush</span>
            <span>Sesh</span>
            <span>Chor</span>
            <span>Pay</span>
            <span>Jum</span>
            <span>Shan</span>
            <span>Yak</span>
          </div>
        </div>
      </Card>

      
      <Card className="p-6 bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider">
            Fanlar Taqsimoti
          </span>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Fanlar Kesimida Ishtirokchilar
          </h3>
        </div>

        <div className="space-y-4">
          {subjectStats.map((sub, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>{sub.name}</span>
                <span className="font-mono text-blue-600">{sub.count.toLocaleString()} ta</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${sub.color} rounded-full transition-all duration-500`}
                  style={{ width: `${sub.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Hududlar bo'yicha ulush (Top-3):</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {regionStats.slice(0, 3).map((r, i) => (
              <div key={i} className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900 truncate">{r.region.split(' ')[0]}</div>
                <div className="text-blue-600 font-mono font-extrabold">{r.share}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
