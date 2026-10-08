import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { CertificateCanvas } from '../../components/certificate/CertificateCanvas';
import { certificateService } from '../../services/certificateService';
import { Certificate } from '../../types';

export const VerifyCertificatePage: React.FC = () => {
  const { t } = useTranslation();
  const { code: routeCode } = useParams<{ code?: string }>();
  const [code, setCode] = useState(routeCode || '');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (searchCode: string) => {
    if (!searchCode.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await certificateService.verifyCertificate(searchCode);
      if (res) {
        setCertificate(res);
      } else {
        setCertificate(null);
        setError("Bunday verifikatsiya kodi bilan sertifikat topilmadi. Kodni qayta tekshiring.");
      }
    } catch {
      setError("Verifikatsiya so'rovida xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (routeCode) {
      handleVerify(routeCode);
    }
  }, [routeCode]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 bg-zinc-950 text-zinc-100 font-sans">
      
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            {t('certificate.verifyTitle') || "Sertifikatni Tekshirish"}
          </span>
        </h1>
        <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
          Ibn Sino rasmiy sertifikatlari ustidagi verifikatsiya kodini kiriting va haqiqiyligini tekshiring.
        </p>
      </div>

      
      <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/30 max-w-xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder={t('certificate.verifyInputPlaceholder') || "Masalan: IS-2026-BIOL-2671"}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono uppercase font-bold"
          />
          <Button
            isLoading={isLoading}
            onClick={() => handleVerify(code)}
            leftIcon={<Search className="w-4 h-4" />}
            className="shrink-0 font-bold px-6 shadow-md"
          >
            {t('certificate.verifyButton') || "Tekshirish"}
          </Button>
        </div>
      </div>

      
      {certificate && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">{t('certificate.validCertificate') || "Haqiqiy Sertifikat"}</h4>
              <p className="text-xs text-zinc-400">Ushbu hujjat Ibn Sino platformasi serverlarida rasman ro'yxatga olingan va tasdiqlangan.</p>
            </div>
          </div>

          <CertificateCanvas certificate={certificate} />
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-center gap-3 text-rose-300 max-w-xl mx-auto shadow-lg shadow-rose-950/30">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};
