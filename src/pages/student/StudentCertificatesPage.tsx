import React, { useEffect, useState } from 'react';
import { CertificateCard } from '../../components/certificate/CertificateCard';
import { CertificateCanvas } from '../../components/certificate/CertificateCanvas';
import { certificateService } from '../../services/certificateService';
import { Certificate } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ShieldCheck, Search, Award, CheckCircle2, AlertCircle, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentCertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCert, setVerifiedCert] = useState<Certificate | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      certificateService.getUserCertificates(user.id).then((res) => {
        setCertificates(res);
        setIsLoading(false);
      });
    }
  }, [user]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verifyCode.trim()) return;

    setIsVerifying(true);
    setVerifyError(null);
    setVerifiedCert(null);

    try {
      const res = await certificateService.verifyCertificate(verifyCode);
      if (res) {
        setVerifiedCert(res);
      } else {
        setVerifyError("Bunday ID kodli sertifikat topilmadi. Kodni to'g'ri kiritganingizni tekshiring (masalan: NO-8921).");
      }
    } catch {
      setVerifyError("Sertifikatni tekshirishda xatolik yuz berdi.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Award className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">Sertifikatlarim</h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Ibn Sino Mock Exam & Olympiad platformasida qo'lga kiritilgan rasmiy diplomlar va haqiqiylikni tekshirish
          </p>
        </div>

        <Link
          to="/results"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 text-zinc-200 text-xs font-semibold transition-all shrink-0 active:scale-95"
        >
          <span>Natijalarim & Tahlillar</span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
        </Link>
      </div>

      
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-emerald-950/40 border border-white/10 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Sertifikat Haqiqiyligini Tekshirish (QR & ID Kod)</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Istalgan Ibn Sino sertifikati ustidagi unikal kodni kiriting (masalan: <strong>IS-2026-MED-8921</strong>)
            </p>
          </div>

          <form onSubmit={handleVerify} className="flex items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="IS-2026-MED-8921"
                className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-amber-300 placeholder-zinc-500 uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isVerifying || !verifyCode.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0 flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isVerifying ? "Tekshirilmoqda..." : "Tekshirish"}</span>
            </button>
          </form>
        </div>

        
        {verifiedCert && (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="font-black text-sm">Haqiqiy Tasdiqlangan Sertifikat</h4>
                  <p className="text-xs text-zinc-300">
                    ID: <strong>{verifiedCert.verificationCode}</strong> · Egasining ismi: <strong>{verifiedCert.userName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerifiedCert(null)}
                className="text-zinc-400 hover:text-white text-xs underline cursor-pointer"
              >
                Yopish
              </button>
            </div>

            <div className="max-w-2xl mx-auto shadow-2xl rounded-2xl overflow-hidden border border-amber-400/40">
              <CertificateCanvas certificate={verifiedCert} />
            </div>
          </div>
        )}

        
        {verifyError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{verifyError}</span>
          </div>
        )}
      </div>

      
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2.5">
          <span>Mening Hujjatlarim va Diplomlarim</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold border border-emerald-500/30">
            {certificates.length} ta
          </span>
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-zinc-900/60 border border-white/10 rounded-2xl animate-pulse" />
            <div className="h-64 bg-zinc-900/60 border border-white/10 rounded-2xl animate-pulse" />
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-12 rounded-2xl bg-zinc-900/40 border border-dashed border-white/10 text-center space-y-4 backdrop-blur-md">
            <Award className="w-12 h-12 text-zinc-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-base font-semibold text-zinc-100">Hozircha sertifikatlar mavjud emas</p>
              <p className="text-xs text-zinc-400">Olimpiadalarda qatnashib, yuqori natija ko'rsating va sertifikatga ega bo'ling.</p>
            </div>
            <Link to="/student/olympiads" className="inline-block pt-2">
              <Button size="sm" variant="primary">
                Olimpiadalarni ko'rish
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

