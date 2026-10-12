import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { examCatalogService as catalog, examKindLabels, type AssessmentResult, type CatalogExam,
  type PracticeSession, type ServerQuestion } from '../../services/examCatalogService';
import { raschService, buildNationalCertificate, GradeLevel } from '../../services/raschAssessmentService';
import { Modal } from '../../components/common/Modal';
import { CertificateCanvas } from '../../components/certificate/CertificateCanvas';
import { Award, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

const box = 'rounded-2xl border border-white/10 bg-zinc-900/70 p-5';
const button = 'rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm disabled:opacity-40 hover:bg-emerald-500';
const input = 'rounded-xl border border-white/15 bg-zinc-900 p-3 text-sm text-white';
const errorMessage = (e: unknown) => e instanceof Error ? e.message : 'Server bilan aloqa xatosi';

export function AssessmentResultView({ result }: { result: AssessmentResult }) {
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // PDF Rash modeli bo'yicha ball va darajani aniqlash
  const calculated = useMemo(() => {
    if (result.examKind === 'national_certificate') {
      const correctCount = result.analysis?.filter(a => a.isCorrect).length ?? result.score;
      const totalQ = result.analysis?.length || 45;
      const res = raschService.calcPdfRaschScore(correctCount, totalQ);
      return res;
    }
    return null;
  }, [result]);

  const certificate = useMemo(() => {
    if (!calculated) return null;
    return buildNationalCertificate({
      userName: "Talabgor",
      score: calculated.standardScore,
      grade: calculated.grade,
      subject: "Matematika",
      examTitle: result.examTitle,
    });
  }, [calculated, result.examTitle]);

  const getGradeColor = (g: GradeLevel) => {
    if (g === 'A+' || g === 'A') return 'bg-emerald-500/20 text-emerald-300 border-emerald-400';
    if (g === 'B+' || g === 'B') return 'bg-teal-500/20 text-teal-300 border-teal-400';
    if (g === 'C+' || g === 'C') return 'bg-amber-500/20 text-amber-300 border-amber-400';
    return 'bg-rose-500/20 text-rose-300 border-rose-400';
  };

  return (
    <section className={box + ' space-y-5'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-black text-xl text-zinc-100">{result.examTitle}</h2>
          <p className="text-xs text-zinc-400">{result.mode === 'practice' ? 'Mashq sinovi' : 'Rasmiy sinov natijasi'}</p>
        </div>

        {calculated && calculated.isEligibleForCertificate && (
          <button
            type="button"
            onClick={() => setIsCertModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Milliy Sertifikatni Ko'rish</span>
          </button>
        )}
      </div>

      {/* O'quvchiga ko'rsatiladigan asosiy natija kartasi (Faqat Ball va Daraja) */}
      {result.examKind === 'national_certificate' && calculated ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-950 border border-emerald-500/30 text-center space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Rasch Standart Bali</div>
            <div className="text-4xl font-black text-emerald-400 font-mono">{calculated.standardScore}</div>
            <div className="text-[11px] text-zinc-500 font-mono">Maksimal 75.0 ball</div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-emerald-500/30 text-center space-y-2 flex flex-col justify-center items-center">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Natijaviy Daraja</div>
            <div className={clsx("text-2xl font-black px-4 py-1 rounded-xl border shadow-sm", getGradeColor(calculated.grade))}>
              {calculated.grade} Daraja
            </div>
            <div className="text-[11px] text-zinc-400">{calculated.gradeDescription}</div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 text-sm">
          <span>To'plangan ball: <strong className="text-emerald-400 font-mono text-base">{result.score}</strong> / {result.maxScore} ({result.percentage}%)</span>
        </div>
      )}

      {/* Savollar tahlili */}
      {result.analysis && result.analysis.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Topshiriqlar bo'yicha tahlil</h3>
          {result.analysis.map((item, index) => (
            <details className="border border-white/5 rounded-xl p-3 bg-zinc-950/60" key={item.questionId}>
              <summary className="cursor-pointer text-xs font-semibold text-zinc-200">
                {index + 1}. {item.isCorrect ? '✓' : '✕'} {item.questionText}
              </summary>
              <div className="mt-2 text-xs space-y-1 text-zinc-300 pl-4 border-l border-white/10">
                <p>Sizning javobingiz: <span className={item.isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400'}>{item.userAnswer || 'Javob berilmagan'}</span></p>
                <p>To‘g‘ri javob: <span className="text-emerald-400 font-bold">{item.correctAnswer}</span></p>
                {item.explanation && <p className="text-zinc-400 mt-1 italic">{item.explanation}</p>}
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Sertifikat Modali */}
      {isCertModalOpen && certificate && (
        <Modal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          title="Rasmiy Milliy Baholash Sertifikati"
          size="xl"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>{calculated?.grade} Darajali Milliy Sertifikat ({calculated?.standardScore} ball)</span>
                </h3>
                <p className="text-xs text-zinc-400">BMBA 75 ballik standart shkalasi va Rash modeli bo'yicha</p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 active:scale-95"
              >
                Chop etish
              </button>
            </div>

            <div className="max-w-3xl mx-auto shadow-2xl rounded-2xl overflow-hidden border border-amber-400/30">
              <CertificateCanvas certificate={certificate} className="w-full" />
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}

export function PracticeLibraryPage({ nationalOnly = false }: { nationalOnly?: boolean }) {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('practice');
  const resultId = params.get('result');
  const [exams, setExams] = useState<CatalogExam[]>([]);
  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [questions, setQuestions] = useState<ServerQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [finishRequested, setFinishRequested] = useState(false);
  const clockRef = useRef({ server: 0, local: 0 });
  const autoFinished = useRef(false);
  const refresh = useCallback(async () => {
    const [list, results] = await Promise.all([catalog.list(nationalOnly ? 'national_certificate' : undefined), catalog.history()]);
    setExams(list); setHistory(results.filter(r => nationalOnly ? r.examKind === 'national_certificate' : r.mode === 'practice'));
  }, [nationalOnly]);
  useEffect(() => { void refresh().catch(e => setError(errorMessage(e))); }, [refresh]);
  useEffect(() => {
    let active = true;
    setSession(null); setQuestions([]); setResult(null); setError(''); setFinishRequested(false);
    if (resultId) {
      setBusy(true);
      void catalog.result(resultId).then(r => { if (active) setResult(r); })
        .catch(e => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setBusy(false); });
      return () => { active = false; };
    }
    if (!selectedId) return;
    setBusy(true);
    void (async () => {
      const started = await catalog.startPractice(selectedId);
      if (!active) return;
      if (started.completed) { setParams({ result: started.data.id }, { replace: true }); return; }
      const receivedAt = performance.now();
      const list = await catalog.questions(selectedId, started.sessionId);
      if (!active) return;
      clockRef.current = { server: started.serverTime, local: receivedAt };
      autoFinished.current = false;
      setSession(started); setQuestions(list); setAnswers(started.answers); setDrafts(started.answers);
      setRemaining(Math.max(0, Math.ceil((started.expiresAt - started.serverTime) / 1000)));
    })().catch(e => { if (active) setError(errorMessage(e)); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [selectedId, resultId, setParams]);
  const finish = useCallback(async () => {
    if (!selectedId || !session) return;
    setBusy(true); setError('');
    try { const saved = await catalog.finish(selectedId, session.sessionId); setSession(null); setFinishRequested(false);
      setParams({ result: saved.id }, { replace: true }); await refresh(); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }, [selectedId, session, refresh, setParams]);
  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((session.expiresAt - clockRef.current.server - (performance.now() - clockRef.current.local)) / 1000));
      setRemaining(left);
      if (left === 0 && !busy && !autoFinished.current) { autoFinished.current = true; void finish(); }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session, busy, finish]);
  const saveAnswer = async (questionId: string, answer: string) => {
    if (!session || !selectedId || busy) return;
    setBusy(true); setError('');
    try { await catalog.answer(selectedId, session.sessionId, questionId, answer); setAnswers(a => ({ ...a, [questionId]: answer })); setDrafts(a => ({ ...a, [questionId]: answer })); }
    catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  };
  const unsaved = questions.some(q => !q.options.length && (drafts[q.id] ?? '') !== (answers[q.id] ?? ''));
  const visible = exams.filter(e => (nationalOnly || e.practiceAvailable) && (!subject || e.subject === subject) &&
    (e.title + ' ' + (e.sourceYear ?? '')).toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6 text-zinc-100">
    <header><h1 className="text-2xl font-bold">{nationalOnly ? 'Milliy sertifikatga tayyorgarlik' : 'Doimiy mashq kutubxonasi'}</h1>
      <p className="text-zinc-400 mt-2">O‘tgan testlar va daraja savollarini mustaqil ishlang. Javoblar serverda saqlanadi; sahifani yangilash urinishni yo‘qotmaydi.</p></header>
    {error && <div role="alert" className="border border-red-400/40 rounded-xl p-4 text-red-300">{error}</div>}
    {(selectedId || resultId) && <button className={button} disabled={busy} onClick={() => { setParams({}); setResult(null); }}>Kutubxonaga qaytish</button>}
    {busy && <p role="status">Server javobi kutilmoqda…</p>}
    {result && <AssessmentResultView result={result} />}
    {session && <>
      <div className="sticky top-0 z-10 rounded-xl bg-zinc-950 p-4 border border-white/10 flex flex-wrap justify-between gap-3">
        <p>Qolgan vaqt: {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')} · Saqlangan javoblar: {Object.values(answers).filter(Boolean).length}/{questions.length}</p>
        <button className={button} disabled={busy || unsaved} onClick={() => setFinishRequested(true)}>Yakunlash</button>
      </div>
      {finishRequested && <section role="alertdialog" aria-label="Urinishni yakunlash" className={box + ' space-y-3'}>
        <p>Urinishni yakunlaysizmi? Javobsiz savollar xato hisoblanadi.</p>
        <div className="flex gap-3"><button className={button} disabled={busy} onClick={() => void finish()}>Ha, natijani hisoblash</button>
          <button className={button} disabled={busy} onClick={() => setFinishRequested(false)}>Davom ettirish</button></div>
      </section>}
      {unsaved && <p className="text-amber-300">Yozma javobni “Javobni saqlash” bilan tasdiqlang.</p>}
      {questions.map((q, index) => <fieldset key={q.id} className={box + ' space-y-3'} disabled={busy || remaining === 0}>
        <legend className="px-2 text-emerald-300">Savol {index + 1}</legend><p className="whitespace-pre-wrap">{q.content}</p>
        {q.imageUrl && <img src={q.imageUrl} alt={`${index + 1}-savol chizmasi`} referrerPolicy="no-referrer" className="max-h-80 max-w-full object-contain" />}
        {q.options.length ? q.options.map(o => <label key={o.id} className="flex items-center gap-3 border border-white/10 rounded-xl p-3 cursor-pointer">
          <input type="radio" name={q.id} checked={answers[q.id] === o.id} onChange={() => void saveAnswer(q.id, o.id)} />{o.text}
          {o.imageUrl && <img src={o.imageUrl} alt="Variant chizmasi" referrerPolicy="no-referrer" className="max-h-32 max-w-40 object-contain" />}
        </label>) : <><textarea aria-label={`${index + 1}-savol javobi`} className={input + ' w-full'} maxLength={10000} value={drafts[q.id] ?? ''} onChange={e => setDrafts(d => ({ ...d, [q.id]: e.target.value }))} />
          <button className={button} onClick={() => void saveAnswer(q.id, drafts[q.id] ?? '')}>Javobni saqlash</button></>}
      </fieldset>)}
    </>}
    {!selectedId && !resultId && !result && <>
      <div className="flex flex-wrap gap-3"><input aria-label="Test nomi yoki yili" className={input} placeholder="Test nomi yoki yili…" value={search} onChange={e => setSearch(e.target.value)} />
        <select aria-label="Fan" className={input} value={subject} onChange={e => setSubject(e.target.value)}><option value="">Barcha fanlar</option>{[...new Set(exams.map(e => e.subject))].map(s => <option key={s}>{s}</option>)}</select></div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{visible.map(exam => <article className={box + ' space-y-3'} key={exam.id}>
        <p className="text-sm text-emerald-300">{examKindLabels[exam.kind]} · {exam.sourceYear ?? '—'}</p><h2 className="text-lg font-semibold">{exam.title}</h2>
        <p className="text-zinc-400 text-sm">{exam.subject} · {exam.totalQuestions} savol · {exam.durationMinutes} daqiqa</p>
        {exam.practiceAvailable ? <button className={button} disabled={busy} onClick={() => setParams({ practice: exam.id })}>Mashqni boshlash / davom ettirish</button>
          : <p className="text-sm text-zinc-400">Arxiv mashqi hali ochilmagan.</p>}
        {nationalOnly && ['active', 'ochiq'].includes(exam.status) && <Link className={button + ' inline-block'} to={`/olympiads/${encodeURIComponent(exam.id)}/participate`}>Rejali sinovga kirish</Link>}
      </article>)}</div>
      {!visible.length && <p className="text-zinc-400">Hozircha ochilgan test yo‘q. Admin daraja testini yoki tugagan olimpiadani mashq uchun ochishi mumkin.</p>}
    </>}
    {!session && !selectedId && !resultId && <section className={box + ' space-y-3'}><h2 className="font-bold">Saqlangan urinishlar</h2>
      {history.slice(0, 100).map(r => <button className="block w-full text-left border-t border-white/10 py-3" key={r.id} onClick={() => setParams({ result: r.id })}>{r.examTitle} · {new Date(r.submittedAt).toLocaleString()} · {r.mode === 'practice' ? 'Mashq' : 'Sinov'} — ko‘rish</button>)}
      {!history.length && <p className="text-zinc-400">Hali yakunlangan urinish yo‘q.</p>}
      {result && <button className={button} onClick={() => setResult(null)}>Testlar ro‘yxati</button>}
    </section>}
  </div>;
}
