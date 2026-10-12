import React, { useState, useMemo } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { CertificateCanvas } from '../certificate/CertificateCanvas';
import {
  raschService,
  buildNationalCertificate,
  GradeLevel,
  GRADE_BANDS,
  PDF_MATH_ITEMS_TABLE1
} from '../../services/raschAssessmentService';
import {
  Calculator,
  Award,
  Sparkles,
  BookOpen,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import confetti from 'canvas-confetti';

export const RaschCalculator: React.FC = () => {
  // Rejimlar: 'pdf_rasch' (PDF kitob asosida), 'prop' (xom ball interpolatsiyasi), 'rash' (nazariy Z va T)
  const [calcMode, setCalcMode] = useState<'pdf_rasch' | 'prop' | 'rash'>('pdf_rasch');

  // PDF Rash modeli holatlari (BMBA Axborotnoma 4/2023, M. Dj. Ermamatov)
  const [totalQuestions, setTotalQuestions] = useState<number>(45);
  const [correctCount, setCorrectCount] = useState<number>(32);
  const [candidateName, setCandidateName] = useState<string>('Azizbek Karimov');
  const [subjectName, setSubjectName] = useState<string>('Matematika');

  // Xom ball rejimi (legacy)
  const [selectedSubjectType, setSelectedSubjectType] = useState<'spec_1' | 'spec_2'>('spec_1');
  const [rawScore, setRawScore] = useState<number>(85.85);

  // Z va T rejimi (legacy)
  const [theta, setTheta] = useState<number>(1.5);
  const [mu, setMu] = useState<number>(0.0);
  const [sigma, setSigma] = useState<number>(1.0);

  // Yozma ish (ixtiyoriy)
  const [writingScore, setWritingScore] = useState<number>(68);
  const [includeWriting, setIncludeWriting] = useState<boolean>(false);

  // Sertifikat modali
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);

  // 1. PDF Rash modeli bo'yicha hisoblash (Asosiy)
  const pdfCalculation = useMemo(() => {
    return raschService.calcPdfRaschScore(correctCount, totalQuestions);
  }, [correctCount, totalQuestions]);

  // 2. Legacy BMBA va nazariy hisoblash
  const legacyCalculation = useMemo(() => {
    let stdScore = 0;
    let zScore = 0;
    let tScore = 0;

    if (calcMode === 'rash') {
      const res = raschService.calcRashScore(theta, mu, sigma);
      zScore = res.Z;
      tScore = res.T;
      stdScore = tScore;
    } else {
      stdScore = raschService.calcBMBAStandardScore(rawScore, selectedSubjectType);
    }

    const testGrade = raschService.getGrade(stdScore);
    const overallScore = includeWriting ? raschService.finalScore(stdScore, writingScore) : stdScore;
    const overallGrade = raschService.getGrade(overallScore);

    return {
      stdScore,
      zScore,
      tScore,
      testGrade,
      overallScore,
      overallGrade
    };
  }, [calcMode, selectedSubjectType, rawScore, theta, mu, sigma, writingScore, includeWriting]);

  // Hozirgi aktiv hisoblangan ball va daraja
  const currentResult = useMemo(() => {
    if (calcMode === 'pdf_rasch') {
      const score = includeWriting ? raschService.finalScore(pdfCalculation.standardScore, writingScore) : pdfCalculation.standardScore;
      const grade = raschService.getGrade(score);
      return {
        score,
        grade,
        isEligible: grade !== 'Fail' && score >= 46.0,
      };
    }
    return {
      score: legacyCalculation.overallScore,
      grade: legacyCalculation.overallGrade,
      isEligible: legacyCalculation.overallGrade !== 'Fail' && legacyCalculation.overallScore >= 46.0,
    };
  }, [calcMode, pdfCalculation, legacyCalculation, includeWriting, writingScore]);

  // Tayyor Milliy Sertifikat obyekti
  const generatedCertificate = useMemo(() => {
    return buildNationalCertificate({
      userName: candidateName.trim() || 'Talabgor',
      score: currentResult.score,
      grade: currentResult.grade,
      subject: subjectName.trim() || 'Matematika',
      examTitle: `Milliy Baholash Sinovi — ${subjectName.trim() || 'Matematika'}`,
    });
  }, [candidateName, currentResult, subjectName]);

  const maxRawLimit = selectedSubjectType === 'spec_1' ? 93 : 63;

  const getGradeBadgeClass = (g: GradeLevel) => {
    switch (g) {
      case 'A+':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-emerald-500/20';
      case 'A':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/60 shadow-emerald-500/15';
      case 'B+':
        return 'bg-teal-500/20 text-teal-300 border-teal-400 shadow-teal-500/20';
      case 'B':
        return 'bg-teal-500/15 text-teal-400 border-teal-500/60 shadow-teal-500/15';
      case 'C+':
        return 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-amber-500/20';
      case 'C':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/60 shadow-amber-500/15';
      default:
        return 'bg-rose-500/15 text-rose-300 border-rose-500/50 shadow-rose-500/15';
    }
  };

  const handleOpenCertificate = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
    setIsCertificateModalOpen(true);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const handleDownloadPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 850;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fon
    const grad = ctx.createLinearGradient(0, 0, 1200, 850);
    grad.addColorStop(0, '#070D1F');
    grad.addColorStop(0.5, '#0E1A38');
    grad.addColorStop(1, '#060A18');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 850);

    // Oltin hoshiyalar
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 1160, 810);

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, 1130, 780);

    // Header
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 26px serif';
    ctx.fillText('NEXT OLYMP', 60, 80);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText("O'ZBEKISTON RESPUBLIKASI MILLIY BAHOLASH PORTALI", 60, 102);

    // Badge
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(410, 140, 380, 42, 21);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MILLIY BAHOLASH SERTIFIKATI', 600, 167);

    // Ism
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 36px serif';
    ctx.fillText(generatedCertificate.userName, 600, 260);

    // Matn
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '18px sans-serif';
    ctx.fillText(`"${generatedCertificate.subject}" fanidan Rash modeli (1PL dixotomik) asosida o'tkazilgan sinovda,`, 600, 330);
    ctx.fillText(`75 ballik standart shkalada ${generatedCertificate.score} ball to'plab, "${currentResult.grade}" darajali sertifikat oldi.`, 600, 365);

    // Daraja medali
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(475, 420, 250, 70, 16);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`DARAJA: ${currentResult.grade}`, 600, 465);

    // Footer
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('BERILGAN SANA', 60, 750);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(new Date().toLocaleDateString('uz-UZ'), 60, 775);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('TASDIQLASH KODI', 1140, 750);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(generatedCertificate.verificationCode, 1140, 775);

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Milliy_Sertifikat_${generatedCertificate.userName.replace(/\s+/g, '_')}_${currentResult.grade}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Rejimni tanlash sarlavhasi */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <span>Milliy Baholash & Rasch Modeli</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Axborotnoma 4/2023
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              PDF metodikasi bo'yicha test natijalarini hisoblash va darajali (A, B, C, A+, B+, C+) Milliy Sertifikat chiqarish
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setCalcMode('pdf_rasch')}
            className={clsx(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5",
              calcMode === 'pdf_rasch'
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                : "text-zinc-400 hover:text-zinc-100"
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>PDF Rash Modeli (Asosiy)</span>
          </button>
          <button
            type="button"
            onClick={() => setCalcMode('prop')}
            className={clsx(
              "px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95",
              calcMode === 'prop'
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                : "text-zinc-400 hover:text-zinc-100"
            )}
          >
            BMBA Shkalasi (Xom ball)
          </button>
          <button
            type="button"
            onClick={() => setCalcMode('rash')}
            className={clsx(
              "px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95",
              calcMode === 'rash'
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                : "text-zinc-400 hover:text-zinc-100"
            )}
          >
            Nazariy (Z va T)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHAP USTUN: Kirish parametrlari */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 bg-zinc-900/60 border border-white/10 space-y-5 rounded-2xl backdrop-blur-md shadow-xl">
            <h4 className="text-sm font-black uppercase tracking-wider text-zinc-100 border-b border-white/10 pb-3 flex items-center justify-between">
              <span>Talabgor va Test Parametrlari</span>
              <span className="text-[11px] font-mono text-emerald-400 font-normal">
                {calcMode === 'pdf_rasch' ? '1PL Dixotomik Model • Max 75 ball' : 'BMBA Shkalasi'}
              </span>
            </h4>

            {/* Talabgor ma'lumotlari (Sertifikat uchun) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                  Talabgor F.I.Sh
                </label>
                <Input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Ism Familiya"
                  className="font-medium text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                  Imtihon Fani
                </label>
                <Input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Masalan: Matematika, Kimyo"
                  className="font-medium text-sm"
                />
              </div>
            </div>

            {/* 1-REJIM: PDF RASH MODELI */}
            {calcMode === 'pdf_rasch' && (
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>BMBA "Axborotnoma 4/2023" Metodikasi</span>
                  </div>
                  <p className="text-zinc-300">
                    Matematika fani 2022-yil 4-dekabr milliy sertifikat sinovi (4506 nafar talabgor) tajribasiga asoslangan dixotomik 1PL invariant qiyinlik modeli.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Jami Savollar Soni
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={totalQuestions}
                      onChange={(e) => setTotalQuestions(Math.max(1, parseInt(e.target.value) || 45))}
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-zinc-500">Standart variant: 45 ta topshiriq</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      To'g'ri Javoblar Soni
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={totalQuestions}
                      value={correctCount}
                      onChange={(e) => setCorrectCount(Math.min(Math.max(0, parseInt(e.target.value) || 0), totalQuestions))}
                      className="font-mono text-sm text-emerald-400 font-bold"
                    />
                    <span className="text-[11px] text-zinc-500">
                      To'g'rilik ko'rsatkichi: {pdfCalculation.rawPercentage}%
                    </span>
                  </div>
                </div>

                {/* Range Slider */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>To'g'ri javoblar ko'lami</span>
                    <span className="font-mono font-bold text-emerald-400">{correctCount} / {totalQuestions}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={totalQuestions}
                    step="1"
                    value={correctCount}
                    onChange={(e) => setCorrectCount(parseInt(e.target.value))}
                    className="w-full h-2.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* 2-REJIM: BMBA XOM BALL KONVERSIYASI */}
            {calcMode === 'prop' && (
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Mutaxassislik Fani</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSubjectType('spec_1')}
                      className={clsx(
                        "p-3 rounded-xl border text-left transition-all cursor-pointer active:scale-95",
                        selectedSubjectType === 'spec_1'
                          ? "bg-emerald-500/15 border-emerald-500 text-white shadow-sm shadow-emerald-500/10"
                          : "bg-zinc-950/80 border-white/10 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                      )}
                    >
                      <div className="text-xs font-bold">1-Fan (Asosiy)</div>
                      <div className="text-[11px] text-emerald-400 font-mono mt-0.5">MAX = 93 ball</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSubjectType('spec_2')}
                      className={clsx(
                        "p-3 rounded-xl border text-left transition-all cursor-pointer active:scale-95",
                        selectedSubjectType === 'spec_2'
                          ? "bg-emerald-500/15 border-emerald-500 text-white shadow-sm shadow-emerald-500/10"
                          : "bg-zinc-950/80 border-white/10 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                      )}
                    >
                      <div className="text-xs font-bold">2-Fan (Qo'shimcha)</div>
                      <div className="text-[11px] text-emerald-400 font-mono mt-0.5">MAX = 63 ball</div>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold uppercase tracking-wider text-zinc-400">
                      To'plangan Xom Ball (Raw Score)
                    </label>
                    <span className="font-mono text-zinc-100 font-bold">
                      {rawScore} / {maxRawLimit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={maxRawLimit}
                    step="0.05"
                    value={rawScore}
                    onChange={(e) => setRawScore(parseFloat(e.target.value))}
                    className="w-full h-2 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="pt-1">
                    <Input
                      type="number"
                      value={rawScore}
                      min={0}
                      max={maxRawLimit}
                      step={0.1}
                      onChange={(e) => setRawScore(Math.min(Math.max(parseFloat(e.target.value) || 0, 0), maxRawLimit))}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3-REJIM: NAZARIY RASCH */}
            {calcMode === 'rash' && (
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Input
                      label="θ (Qobiliyat logiti)"
                      type="number"
                      step={0.1}
                      value={theta}
                      onChange={(e) => setTheta(parseFloat(e.target.value) || 0)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Input
                      label="μ (O'rtacha mean)"
                      type="number"
                      step={0.1}
                      value={mu}
                      onChange={(e) => setMu(parseFloat(e.target.value) || 0)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Input
                      label="σ (Standart og'ish SD)"
                      type="number"
                      step={0.1}
                      min={0.1}
                      value={sigma}
                      onChange={(e) => setSigma(parseFloat(e.target.value) || 1)}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Ixtiyoriy yozma ish bloki */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-100">
                <input
                  type="checkbox"
                  checked={includeWriting}
                  onChange={(e) => setIncludeWriting(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
                <span>Yozma ish (ochiq topshiriq) natijasini ham qo'shib hisoblash</span>
              </label>

              {includeWriting && (
                <div className="space-y-1.5 pl-6">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Yozma ish bali (75 shkalada)</span>
                    <span className="font-mono font-bold text-zinc-100">{writingScore} / 75</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="75"
                    step="1"
                    value={writingScore}
                    onChange={(e) => setWritingScore(parseInt(e.target.value))}
                    className="w-full h-2 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Standart darajalar ma'lumotnomasi */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3 backdrop-blur-md shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Milliy Baholash Daraja Mezonlari</span>
              <span className="text-[11px] text-emerald-400 font-mono">BMBA 75.0 ball shkalasi</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GRADE_BANDS.slice(0, 6).map((band) => (
                <div key={band.grade} className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/10 text-xs flex items-center justify-between">
                  <span className="font-black text-zinc-100">{band.grade}</span>
                  <span className="font-mono text-zinc-400 font-semibold">{band.minStd} – {band.maxStd} ball</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* O'NG USTUN: O'quvchiga chiqadigan aniq Natija va Sertifikat */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 bg-zinc-900/90 border border-emerald-500/30 shadow-2xl space-y-6 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">O'quvchi Natijasi</span>
              <span className={clsx("px-3.5 py-1.5 rounded-full text-xs font-black border tracking-wider", getGradeBadgeClass(currentResult.grade))}>
                {currentResult.grade} Daraja
              </span>
            </div>

            {/* Asosiy Natija Kartasi: Faqat Ball va Daraja */}
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-zinc-950 border border-emerald-500/20 text-center space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="text-xs text-zinc-400 uppercase font-bold tracking-wider">
                  To'plangan Standart Ball
                </div>

                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 font-mono tracking-tight">
                  {currentResult.score}
                </div>

                <div className="text-xs text-zinc-400 font-mono">
                  Maksimal 75.0 ballik shkalada
                </div>

                {/* Katta va yorqin daraja belgisi */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-center gap-2">
                  <span className="text-xs text-zinc-400 font-medium">Belgilangan daraja:</span>
                  <span className={clsx("text-xl font-black px-3 py-0.5 rounded-lg border", getGradeBadgeClass(currentResult.grade))}>
                    {currentResult.grade}
                  </span>
                </div>
              </div>

              {/* Sertifikat holati va tugmasi */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 space-y-3">
                {currentResult.isEligible ? (
                  <>
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Milliy Sertifikat olish huquqiga ega bo'ldi!</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      To'plangan {currentResult.score} ball {currentResult.grade} darajali rasmiy Milliy Sertifikat bilan tasdiqlanadi.
                    </p>

                    <Button
                      type="button"
                      onClick={handleOpenCertificate}
                      className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      <Award className="w-4 h-4" />
                      <span>Milliy Sertifikatni Chiqarish</span>
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Sertifikat berish uchun minimal 46.0 ball talab qilinadi.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bell Curve / Normal taqsimotdagi o'rni */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Shkaladagi ko'rsatkich</span>
                <span className="font-mono text-emerald-400 font-bold">{currentResult.score} / 75.0</span>
              </div>

              <div className="relative w-full h-24 bg-zinc-950/80 rounded-xl border border-white/10 p-2 flex items-end justify-center overflow-hidden">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="bellGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,95 Q 75,95 100,70 T 150,15 T 200,70 Q 225,95 300,95 L 300,100 L 0,100 Z"
                    fill="url(#bellGrad)"
                  />
                  <path
                    d="M 0,95 Q 75,95 100,70 T 150,15 T 200,70 Q 225,95 300,95"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                  />
                  {(() => {
                    const normalizedX = Math.min(Math.max((currentResult.score / 75) * 300, 10), 290);
                    return (
                      <g>
                        <line x1={normalizedX} y1="0" x2={normalizedX} y2="100" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />
                        <circle cx={normalizedX} cy="30" r="4" fill="#F59E0B" />
                        <text x={normalizedX} y="15" fill="#F59E0B" fontSize="10" textAnchor="middle" fontWeight="bold">Siz: {currentResult.grade}</text>
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* MILLIY SERTIFIKAT MODALI */}
      {isCertificateModalOpen && (
        <Modal
          isOpen={isCertificateModalOpen}
          onClose={() => setIsCertificateModalOpen(false)}
          title="Rasmiy Milliy Baholash Sertifikati"
          size="xl"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>{candidateName} — {currentResult.grade} Daraja ({currentResult.score} ball)</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  QR-kod va unikal seriya raqami orqali tekshiriluvchi Milliy Sertifikat
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleDownloadPng}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG Yuklab Olish</span>
                </Button>
                <Button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Chop etish</span>
                </Button>
              </div>
            </div>

            {/* Sertifikat to'liq vizuali */}
            <div className="max-w-3xl mx-auto shadow-2xl rounded-2xl overflow-hidden border border-amber-400/30">
              <CertificateCanvas
                certificate={generatedCertificate}
                className="w-full"
              />
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Verifikatsiya kodi: <strong className="font-mono text-amber-300">{generatedCertificate.verificationCode}</strong>
                </span>
              </div>
              <span>QR-kod orqali platformada haqiqiyligi bir zumda tasdiqlanadi.</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
