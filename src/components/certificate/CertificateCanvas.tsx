import React from 'react';
import { Certificate, CertificateConfig } from '../../types';
import { Award, ShieldCheck, CheckCircle2, Sparkles, Trophy, QrCode } from 'lucide-react';

interface CertificateCanvasProps {
  certificate: Certificate;
  config?: CertificateConfig;
  className?: string;
  id?: string;
}

export const CertificateCanvas: React.FC<CertificateCanvasProps> = ({
  certificate,
  config,
  className = '',
  id = 'certificate-canvas-element'
}) => {
  const fontChoice = certificate.fontFamily || config?.fontFamily || 'cinzel';

  
  const getFontFamilyStyle = () => {
    switch (fontChoice) {
      case 'cinzel':
        return { fontFamily: "'Cinzel', Georgia, serif" };
      case 'playfair':
        return { fontFamily: "'Playfair Display', Georgia, serif" };
      case 'montserrat':
        return { fontFamily: "'Montserrat', sans-serif" };
      case 'greatvibes':
        return { fontFamily: "'Great Vibes', 'Brush Script MT', cursive" };
      case 'serif':
        return { fontFamily: "Georgia, 'Times New Roman', serif" };
      default:
        return { fontFamily: "'Inter', system-ui, sans-serif" };
    }
  };

  const getCertificateTitle = () => {
    if (certificate.type === 'winner') return "G'OLIBLIK DIPLOMI";
    if (certificate.type === 'round_passed') return "1-BOSQICH G'OLIBI DIPLOMI";
    if (certificate.type === 'round_failed') return "ISHTIROKCHI SERTIFIKATI";
    return "RASMIY SERTIFIKAT";
  };

  
  const getCertificateBodyText = () => {
    if (certificate.customMessage && certificate.customMessage.length > 30) {
      return certificate.customMessage;
    }

    if (config?.isMultiRound) {
      if (certificate.type === 'round_passed') {
        return config.round1PassedText || 
          `Tabriklaymiz! "${certificate.olympiadTitle || 'Olimpiada'}" fan olimpiadasining 1-bosqichida yuqori natija ko'rsatib, ${certificate.score} ball bilan muvaffaqiyatli o'tdingiz va final bosqichiga yo'llanma oldingiz.`;
      } else {
        return config.round1FailedText ||
          `"${certificate.olympiadTitle || 'Olimpiada'}" fan olimpiadasida faol va munosib ishtirok etganingiz uchun samimiy minnatdorchilik bildiramiz. Bilim olishdan to'xtamang, kelgusi musobaqalarda albatta zafar quchasiz!`;
      }
    }

    if (certificate.type === 'winner' || !certificate.rank || certificate.rank <= 3) {
      if (config?.winnerText) {
        return config.winnerText
          .replace('{name}', certificate.userName)
          .replace('{olympiad}', certificate.olympiadTitle || 'Olimpiada')
          .replace('{rank}', String(certificate.rank || 1))
          .replace('{score}', String(certificate.score));
      }
      return `"${certificate.olympiadTitle || 'Olimpiada'}" fan musobaqasida yuqori intellektual salohiyat namoyon etib, faxrli ${certificate.rank || 1}-o'rinni egalladi va g'oliblik diplomi bilan taqdirlanadi.`;
    }

    
    if (config?.participantText) {
      return config.participantText
        .replace('{name}', certificate.userName)
        .replace('{olympiad}', certificate.olympiadTitle || 'Olimpiada')
        .replace('{score}', String(certificate.score));
    }
    return `"${certificate.olympiadTitle || 'Olimpiada'}" fan musobaqasida faol va munosib ishtirok etib, ${certificate.score} ball to'plagani uchun minnatdorchilik bilan taqdirlanadi.`;
  };

  
  const verifyUrl = `${window.location.origin}/verify-certificate/${certificate.verificationCode}`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=2&data=${encodeURIComponent(verifyUrl)}`;

  const subjectDisplay = config?.subjectName || certificate.subject || 'Akademik Fan';

  return (
    <div
      id={id}
      style={getFontFamilyStyle()}
      className={`relative w-full aspect-[1.414/1] bg-gradient-to-br from-[#070D1F] via-[#0E1A38] to-[#060A18] text-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl border-2 sm:border-4 border-amber-400/90 overflow-hidden flex flex-col justify-between select-none print:shadow-none print:border-amber-500 ${className}`}
    >
      
      <div className="absolute inset-1.5 sm:inset-2.5 border border-amber-400/40 rounded-xl pointer-events-none" />
      <div className="absolute inset-3 sm:inset-4 border border-dashed border-amber-400/20 rounded-lg pointer-events-none" />
      
      
      <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
      <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
      <div className="absolute bottom-2.5 left-2.5 sm:bottom-3.5 sm:left-3.5 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
      <div className="absolute bottom-2.5 right-2.5 sm:bottom-3.5 sm:right-3.5 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-r-2 border-amber-400 pointer-events-none" />

      
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.035]">
        <Trophy className="w-80 h-80 sm:w-96 sm:h-96 text-amber-300" />
      </div>

      
      <div className="relative z-10 flex items-center justify-between border-b border-amber-400/30 pb-2 sm:pb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-base md:text-lg font-black tracking-widest text-amber-400 uppercase leading-none">
              NEXT OLYMP
            </div>
            <div className="text-[7px] sm:text-[9px] text-slate-300 tracking-wider uppercase font-semibold mt-0.5">
              RESPUBLIKA ILMIY-AKADEMIK OLIMPIADA PORTALI
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/40 text-amber-300 px-2 py-0.5 rounded-md text-[9px] sm:text-[11px] font-mono font-bold">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>ID: {certificate.verificationCode}</span>
          </div>
          <span className="text-[8px] sm:text-[10px] text-slate-300 font-medium">
            Fan: <strong className="text-amber-300">{subjectDisplay}</strong>
          </span>
        </div>
      </div>

      
      <div className="relative z-10 my-auto text-center space-y-1.5 sm:space-y-2.5 py-1 sm:py-2">
        
        <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 border-amber-300 shadow-sm font-extrabold text-[9px] sm:text-[11px] tracking-widest uppercase border">
          <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>{getCertificateTitle()}</span>
        </div>

        <p className="text-[9px] sm:text-[10px] text-slate-300 font-medium uppercase tracking-wider">
          Ushbu rasmiy hujjat tasdiqlaydiki:
        </p>

        
        <h1
          className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 tracking-tight leading-snug px-2"
          style={fontChoice === 'greatvibes' ? { fontSize: '2rem', lineHeight: '1.2' } : {}}
        >
          {certificate.userName}
        </h1>

        
        <p className="text-[10px] sm:text-xs md:text-sm text-slate-200 max-w-xl mx-auto leading-relaxed px-2 font-normal">
          {getCertificateBodyText()}
        </p>

        
        <div className="flex items-center justify-center gap-2 pt-0.5">
          <div className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] sm:text-[10px] text-slate-300 font-medium">
            To'plangan ball: <strong className="text-amber-400 font-bold font-mono">{certificate.score}</strong> / {certificate.maxScore || 100}
          </div>
          {certificate.rank && certificate.rank > 0 ? (
            <div className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-[9px] sm:text-[10px] text-amber-300 font-medium">
              O'rni: <strong className="text-amber-300 font-black font-mono">{certificate.rank}-o'rin</strong>
            </div>
          ) : null}
        </div>
      </div>

      
      <div className="relative z-10 pt-2 sm:pt-3 border-t border-amber-400/30 flex items-center justify-between text-[9px] sm:text-[11px] text-slate-400">
        
        <div className="space-y-0.5 text-left shrink-0">
          <p className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400">Berilgan sana</p>
          <p className="font-semibold text-white font-mono text-[10px] sm:text-xs">
            {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString('uz-UZ') : new Date().toLocaleDateString('uz-UZ')}
          </p>
          <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-emerald-400 font-semibold">
            <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>Davlat talablari asosida</span>
          </div>
        </div>

        
        <div className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-xl border border-white/20 shadow-sm mx-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0 shadow-inner">
            <img
              src={qrImageSrc}
              alt="QR Code Verification"
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>
          <div className="text-left hidden xs:block pr-0.5">
            <p className="text-[8px] sm:text-[9px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
              <QrCode className="w-2.5 h-2.5 text-amber-400" />
              <span>QR Haqiqiylik</span>
            </p>
            <p className="font-mono text-[8px] sm:text-[9px] text-slate-200">Skaner qiling</p>
            <p className="font-mono text-[8px] sm:text-[9px] text-amber-400 font-bold">{certificate.verificationCode}</p>
          </div>
        </div>

        
        <div className="space-y-0.5 text-right shrink-0">
          <p className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400">
            {config?.signatureRole || "Tashkiliy Qo'mita Raisi"}
          </p>
          <p className="font-semibold text-amber-400 italic text-[10px] sm:text-xs">
            {config?.signatureName || "Next Olymp Kengashi"}
          </p>
          <div className="w-16 sm:w-24 h-0.5 bg-gradient-to-l from-amber-400 to-transparent ml-auto mt-0.5" />
        </div>
      </div>
    </div>
  );
};

