import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { ShieldAlert, Eye, Radio, AlertTriangle, CheckCircle2, UserX, Copy, Trophy, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_OLYMPIADS } from '../../services/mockData';

export const EgaLiveFeed: React.FC = () => {
  const competitions = MOCK_OLYMPIADS;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      <Card className="lg:col-span-2 p-6 bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider">
              Jonli Jarayon
            </span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Oxirgi Faol Olimpiadalar Jadvali
            </h3>
          </div>

          <Link to="/ega/competitions">
            <Button size="sm" variant="outline" className="text-xs">
              Barchasini ko'rish →
            </Button>
          </Link>
        </div>

        {competitions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Fan va Musobaqa</th>
                  <th className="p-3">Bosqich</th>
                  <th className="p-3">Vaqt Oralig'i</th>
                  <th className="p-3">Qatnashuvchilar</th>
                  <th className="p-3">Anti-Cheat</th>
                  <th className="p-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {competitions.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 line-clamp-1">{c.title}</div>
                      <Badge subject={c.subject as any} size="sm" className="mt-1" />
                    </td>
                    <td className="p-3 font-semibold text-slate-700">Saralash</td>
                    <td className="p-3 font-mono text-slate-500">{c.durationMinutes} daq</td>
                    <td className="p-3 font-bold text-slate-900 font-mono">
                      {c.participantsCount} ta
                    </td>
                    <td className="p-3 font-semibold text-emerald-600">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sinxron faol</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <Link to={`/ega/competitions/${c.id}`}>
                        <Button size="sm" variant="outline" className="text-[11px] py-1 px-2" leftIcon={<Eye className="w-3.5 h-3.5 text-blue-600" />}>
                          Boshqarish
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Hali olimpiada yaratilmadi</h4>
              <p className="text-xs text-slate-400">Yangi musobaqa yaratish uchun "Musobaqalar Boshqaruvi" bo'limiga o'ting</p>
            </div>
            <Link to="/ega/competitions">
              <Button size="sm" className="bg-blue-600 text-white font-bold text-xs" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Musobaqa Yaratish
              </Button>
            </Link>
          </div>
        )}
      </Card>

      
      <Card className="p-6 bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-black text-slate-900">
              Jonli Ogohlantirishlar
            </h3>
          </div>

          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>
        </div>

        <div className="p-6 text-center space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h4 className="text-xs font-bold text-slate-900">Tizimda shubhali harakatlar mavjud emas</h4>
          <p className="text-[11px] text-slate-400">Barcha faol proctoring streamlari 100% toza va xavfsiz ishlamoqda.</p>
        </div>

        <Link to="/ega/proctoring" className="block pt-2">
          <Button variant="outline" size="sm" className="w-full text-xs text-slate-700 border-slate-200 hover:bg-slate-50">
            Anti-Cheat Markaziga O'tish →
          </Button>
        </Link>
      </Card>
    </div>
  );
};

