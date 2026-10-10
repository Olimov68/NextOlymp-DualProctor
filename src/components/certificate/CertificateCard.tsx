import React, { useState } from 'react';
import { Certificate } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { CertificateCanvas } from './CertificateCanvas';
import { Award, Download, CheckCircle2, ExternalLink, Printer, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';

interface CertificateCardProps {
  certificate: Certificate;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({ certificate }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  
  const handleDownloadPng = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 850;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    
    const grad = ctx.createLinearGradient(0, 0, 1200, 850);
    grad.addColorStop(0, '#070D1F');
    grad.addColorStop(0.5, '#0E1A38');
    grad.addColorStop(1, '#060A18');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 850);

    
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 1160, 810);

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, 1130, 780);

    
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 26px serif';
    ctx.fillText('NEXT OLYMP', 60, 80);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('RESPUBLIKA ILMIY-AKADEMIK OLIMPIADA PORTALI', 60, 102);

    
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(430, 140, 340, 42, 21);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    const typeText = certificate.type === 'winner' ? "G'OLIBLIK DIPLOMI" : certificate.type === 'round_passed' ? "BOSQICH G'OLIBI SERTIFIKATI" : "MUVAFFAQIYAT SERTIFIKATI";
    ctx.fillText(typeText, 600, 167);

    
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 36px serif';
    ctx.fillText(certificate.userName, 600, 260);

    
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '18px sans-serif';
    ctx.fillText(`"${certificate.olympiadTitle}" fan olimpiadasida faol qatnashib,`, 600, 330);
    ctx.fillText(`${certificate.score} ball to'pladi ${certificate.rank > 0 ? `va faxrli ${certificate.rank}-o'rinni egalladi.` : 'va muvaffaqiyat bilan yakunladi.'}`, 600, 365);

    
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('BERILGAN SANA', 60, 750);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(new Date(certificate.issuedAt).toLocaleDateString('uz-UZ'), 60, 775);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('TASDIQLASH KODI', 1140, 750);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(certificate.verificationCode, 1140, 775);

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Sertifikat_${certificate.userName.replace(/\s+/g, '_')}_${certificate.verificationCode}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handlePrintPdf = async () => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });
    
    const verifyUrl = `${window.location.origin}/verify-certificate/${certificate.verificationCode}`;
    let qrSrc = '';
    try {
      qrSrc = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 4 });
    } catch {
      qrSrc = '';
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Sertifikat - ${certificate.userName} (${certificate.verificationCode})</title>
            <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Great+Vibes&family=Montserrat:wght@400;600;800&family=Playfair+Display:ital,wght@0,700;1,400&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
            <style>
              @page { size: A4 landscape; margin: 0; }
              body { margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0b1226; font-family: 'Cinzel', Georgia, serif; color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .cert-box { width: 1000px; height: 700px; box-sizing: border-box; background: linear-gradient(135deg, #0b1226 0%, #111c3a 50%, #080d1d 100%); border: 4px solid #f59e0b; border-radius: 16px; padding: 40px; display: flex; flex-direction: column; justify-content: space-between; position: relative; }
              h1 { font-size: 32px; color: #fde68a; margin: 15px 0; text-align: center; }
              p { text-align: center; color: #e2e8f0; line-height: 1.6; font-size: 15px; }
              .footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid rgba(245, 158, 11, 0.4); padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="cert-box">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(245, 158, 11, 0.4); padding-bottom: 15px;">
                <div>
                  <div style="font-size: 22px; font-weight: 900; color: #fbbf24; letter-spacing: 2px;">NEXT OLYMP</div>
                  <div style="font-size: 10px; color: #94a3b8; letter-spacing: 1px;">RESPUBLIKA ILMIY-AKADEMIK OLIMPIADA PORTALI</div>
                </div>
                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.4); color: #fcd34d; padding: 6px 12px; border-radius: 8px; font-family: monospace; font-size: 12px; font-weight: bold;">
                  ID: ${certificate.verificationCode}
                </div>
              </div>

              <div style="text-align: center;">
                <div style="display: inline-block; background: #f59e0b; color: #0f172a; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 10px;">
                  ${certificate.type === 'winner' ? "G'OLIBLIK DIPLOMI" : certificate.type === 'round_passed' ? "BOSQICH G'OLIBI SERTIFIKATI" : certificate.type === 'round_failed' ? "ISHTIROKCHI SERTIFIKATI" : "MUVAFFAQIYAT SERTIFIKATI"}
                </div>
                <h1>${certificate.userName}</h1>
                <p style="max-width: 800px; margin: 0 auto; font-size: 14px;">
                  "${certificate.olympiadTitle || 'Olimpiada'}" fan musobaqasida yuqori intellektual salohiyat namoyon etib, ${certificate.rank && certificate.rank > 0 ? `faxrli ${certificate.rank}-o'rinni egalladi va` : ''} g'oliblik diplomi bilan taqdirlanadi.
                </p>
                <div style="margin-top: 15px; display: flex; justify-content: center; gap: 15px;">
                  <span style="background: rgba(255,255,255,0.08); padding: 4px 12px; border-radius: 6px; font-size: 13px;">To'plangan ball: <strong style="color: #fbbf24;">${certificate.score}</strong> / ${certificate.maxScore || 100}</span>
                  ${certificate.rank && certificate.rank > 0 ? `<span style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #fcd34d; padding: 4px 12px; border-radius: 6px; font-size: 13px;">O'rni: <strong>${certificate.rank}-o'rin</strong></span>` : ''}
                </div>
              </div>

              <div class="footer">
                <div>
                  <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Berilgan sana</div>
                  <div style="font-weight: bold; color: white;">${new Date(certificate.issuedAt).toLocaleDateString('uz-UZ')}</div>
                  <div style="font-size: 10px; color: #34d399; margin-top: 4px;">✓ Davlat talablari asosida</div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 6px 12px; border-radius: 8px;">
                  <img src="${qrSrc}" width="60" height="60" style="background: white; border-radius: 4px;" />
                  <div style="font-size: 10px; text-align: left;">
                    <div style="color: #fcd34d; font-weight: bold;">Haqiqiylik kodi</div>
                    <div style="font-family: monospace; color: white;">${certificate.verificationCode}</div>
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Tashkiliy Qo'mita Raisi</div>
                  <div style="font-weight: bold; color: #fbbf24; font-style: italic;">Next Olymp Kengashi</div>
                </div>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getTypeName = () => {
    switch (certificate.type) {
      case 'winner':
        return "G'oliblik Diplomi";
      case 'round_passed':
        return "1-bosqichdan o'tgan";
      case 'round_failed':
        return "Ishtirokchi Sertifikati";
      default:
        return "Muvaffaqiyat Sertifikati";
    }
  };

  return (
    <>
      <Card hoverEffect className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tasdiqlangan</span>
          </span>
        </div>

        <div className="space-y-1">
          <span className="text-xs uppercase font-bold text-accent-400 tracking-wider">
            {certificate.subject} • {getTypeName()}
          </span>
          <h3 className="font-bold text-accent-900 dark:text-white text-base leading-snug line-clamp-2">
            {certificate.olympiadTitle}
          </h3>
        </div>

        <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-accent-600 dark:text-slate-300">
          <div>
            <span className="text-accent-400 dark:text-slate-400">Natija: </span>
            <span className="font-bold text-amber-500">{certificate.score} ball</span> {certificate.rank > 0 ? `(${certificate.rank}-o'rin)` : ''}
          </div>
          <div className="font-mono text-accent-500 dark:text-amber-400 font-bold">{certificate.verificationCode}</div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)} leftIcon={<ExternalLink className="w-4 h-4" />}>
            Ko'rish
          </Button>
          <Button variant="primary" size="sm" onClick={handleDownloadPng} leftIcon={<Download className="w-4 h-4" />}>
            Yuklab Olish
          </Button>
        </div>
      </Card>

      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="Rasmiy Sertifikat" size="xl">
        <div className="space-y-6 p-2">
          <CertificateCanvas certificate={certificate} />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
            <span className="text-xs text-accent-500 font-mono">
              Verifikatsiya kodi: <strong>{certificate.verificationCode}</strong>
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrintPdf} leftIcon={<Printer className="w-4 h-4" />}>
                Chop etish (PDF)
              </Button>
              <Button variant="primary" onClick={handleDownloadPng} leftIcon={<Download className="w-4 h-4" />}>
                Rasm (PNG) Yuklash
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

