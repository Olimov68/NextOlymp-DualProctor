import React, { useEffect, useState } from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Download, RefreshCw } from 'lucide-react';
import { certificateService } from '../../services/certificateService';
import { Certificate } from '../../types';

export const EgaCertificatesPage: React.FC = () => {
  const [certs, setCerts] = useState<Certificate[]>([]);

  useEffect(() => {
    certificateService.getAllCertificates().then(setCerts);
  }, []);

  return (
    <EgaLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900">Sertifikatlar va Mukofotlar Generatsiyasi</h1>
          <p className="text-xs text-slate-500">G'oliblarga avtomatik QR-kodli sertifikat generatsiya qilish va yuklash monitoringi</p>
        </div>

        <Button leftIcon={<RefreshCw className="w-4 h-4" />} className="bg-blue-600 hover:bg-blue-500 text-white font-bold">
          Barcha Sertifikatlarni Avto-Generatsiya Qilish
        </Button>
      </div>

      <Card className="p-6 bg-white border border-slate-200 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Verifikatsiya Kodi</th>
                <th className="p-3">Egasi (Student)</th>
                <th className="p-3">Musobaqa</th>
                <th className="p-3">Sertifikat Turi</th>
                <th className="p-3">Ball va O'rin</th>
                <th className="p-3 text-right">Yuklab Olish / Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {certs.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-600">{c.verificationCode}</td>
                  <td className="p-3 font-bold text-slate-900">{c.userName}</td>
                  <td className="p-3 max-w-xs line-clamp-1">{c.olympiadTitle}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      c.type === 'winner' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {c.type === 'winner' ? 'G\'oliblik Diplomi' : 'Ishtirok Sertifikati'}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900 font-mono">{c.score} ball ({c.rank}-o'rin)</td>
                  <td className="p-3 text-right space-x-2">
                    <Button size="sm" variant="outline" className="text-[11px] py-1 px-2.5" leftIcon={<Download className="w-3.5 h-3.5" />}>
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </EgaLayout>
  );
};
