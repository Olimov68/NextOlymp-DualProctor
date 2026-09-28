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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 bg-[#0B1120] text-[#F1F5F9]">
      
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] mx-auto flex items-center justify-center border border-[#3B82F6]/30 shadow-sm">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-black text-[#F1F5F9] tracking-tight">{t('certificate.verifyTitle') || "Sertifikatni Tekshirish"}</h1>
        <p className="text-[#94A3B8] text-sm max-w-md mx-auto">
          Next Olymp sertifikatlari ustidagi verifikatsiya kodini kiriting va rasmiy ma'lumotlarni tekshiring.
        </p>
      </div>

      
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 shadow-xs max-w-xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder={t('certificate.verifyInputPlaceholder') || "Masalan: NO-8921"}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono uppercase font-bold"
          />
          <Button
            isLoading={isLoading}
            onClick={() => handleVerify(code)}
            leftIcon={<Search className="w-4 h-4" />}
            className="shrink-0 font-bold"
          >
            {t('certificate.verifyButton') || "Tekshirish"}
          </Button>
        </div>
      </div>

      
      {certificate && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-[#10B981]/15 border border-[#10B981]/40 rounded-xl flex items-center gap-3 text-[#34D399]">
            <CheckCircle2 className="w-6 h-6 text-[#10B981] shrink-0" />
            <div>
              <h4 className="font-bold text-sm">{t('certificate.validCertificate') || "Haqiqiy Sertifikat"}</h4>
              <p className="text-xs text-[#94A3B8]">Ushbu hujjat Next Olymp serverlarida rasman ro'yxatga olingan va tasdiqlangan.</p>
            </div>
          </div>

          <CertificateCanvas certificate={certificate} />
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#EF4444]/15 border border-[#EF4444]/40 rounded-xl flex items-center gap-3 text-[#F87171] max-w-xl mx-auto">
          <AlertCircle className="w-6 h-6 text-[#EF4444] shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};
