import React from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useProctoringStore } from '../../store/useProctoringStore';

export const AdminResultsPage: React.FC = () => {
  const { flags, updateFlagStatus } = useProctoringStore();

  return (
    <div className="flex bg-surface min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-accent-900">Anti-Cheat Review & Disqualifications</h1>
            <p className="text-xs text-accent-500">Musobaqa jarayonida qayd etilgan haqiqiy qoidabuzarliklarni ko'rib chiqish</p>
          </div>
        </div>

        <Card className="p-6">
          {flags.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-accent-600 font-bold uppercase text-xs border-b border-border">
                <tr>
                  <th className="p-3">Ishtirokchi</th>
                  <th className="p-3">Musobaqa</th>
                  <th className="p-3">Qoidabuzarlik Turi</th>
                  <th className="p-3">Tafsilot</th>
                  <th className="p-3 text-right">Qaror</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {flags.map((f) => (
                  <tr key={f.id}>
                    <td className="p-3 font-bold text-accent-900">{f.user}</td>
                    <td className="p-3">{f.olympiad}</td>
                    <td className="p-3 font-bold text-rose-600">{f.type}</td>
                    <td className="p-3 text-xs text-accent-600">{f.detail}</td>
                    <td className="p-3 text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => updateFlagStatus(f.id, 'Approved')}>Oqlash</Button>
                      <Button size="sm" variant="danger" onClick={() => updateFlagStatus(f.id, 'Disqualified')}>Diskvalifikatsiya</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Hozircha qoidabuzarlik yozuvlari mavjud emas</h3>
                <p className="text-xs text-slate-400">Musobaqada qatnashuvchilar qoidani buzganda real natijalar shu yerga kelib tushadi.</p>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};
