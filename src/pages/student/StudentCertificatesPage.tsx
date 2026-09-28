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
    <div className="space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Award className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-[#F1F5F9]">Sertifikatlarim</h1>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Next Olymp platformasida qo'lga kiritilgan rasmiy diplomlar va haqiqiylikni tekshirish
          </p>
        </div>

        <Link
          to="/results"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-slate-200 text-xs font-bold transition-all shrink-0"
        >
          <span>Natijalarim & Tahlillar</span>
          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
        </Link>
      </div>

      
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0B1528] via-[#111F3D] to-[#0A1324] border border-blue-500/30 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sertifikat Haqiqiyligini Tekshirish (QR & ID Kod)</span>
            </h3>
            <p className="text-xs text-slate-300">
              Istalgan Next Olymp sertifikati ustidagi unikal kodni kiriting (masalan: <strong>NO-8921</strong>)
            </p>
          </div>

          <form onSubmit={handleVerify} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="NO-8921"
                className="w-full bg-[#070D1A] border border-blue-500/40 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-amber-300 placeholder-slate-500 uppercase outline-none focus:border-amber-400 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isVerifying || !verifyCode.trim()}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer shrink-0 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isVerifying ? "Tekshirilmoqda..." : "Tekshirish"}</span>
            </button>
          </form>
        </div>

        
        {verifiedCert && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="font-black text-xs sm:text-sm">Haqiqiy Tasdiqlangan Sertifikat</h4>
                  <p className="text-[11px] text-slate-300">
                    ID: <strong>{verifiedCert.verificationCode}</strong> · Egasining ismi: <strong>{verifiedCert.userName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerifiedCert(null)}
                className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
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
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{verifyError}</span>
          </div>
        )}
      </div>

      
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
          <span>Mening Hujjatlarim va Diplomlarim</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-bold">
            {certificates.length} ta
          </span>
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-[#111827] border border-[#1E293B] rounded-xl animate-pulse" />
            <div className="h-64 bg-[#111827] border border-[#1E293B] rounded-xl animate-pulse" />
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-12 rounded-xl bg-[#111827] border border-dashed border-[#1E293B] text-center space-y-3">
            <Award className="w-12 h-12 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#F1F5F9]">Hozircha sertifikatlar mavjud emas</p>
              <p className="text-xs text-[#94A3B8]">Olimpiadalarda qatnashib, yuqori natija ko'rsating va sertifikatga ega bo'ling.</p>
            </div>
            <Link to="/student/olympiads" className="inline-block pt-2">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer transition-all">
                Olimpiadalarni ko'rish
              </button>
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

