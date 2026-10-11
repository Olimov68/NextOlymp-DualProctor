import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { examCatalogService as catalog, examKindLabels, type AssessmentResult, type CatalogExam,
  type PracticeSession, type ServerQuestion } from '../../services/examCatalogService';

const box = 'rounded-2xl border border-white/10 bg-zinc-900/70 p-5';
const button = 'rounded-xl bg-emerald-600 px-4 py-2 text-white text-sm disabled:opacity-40 hover:bg-emerald-500';
const input = 'rounded-xl border border-white/15 bg-zinc-900 p-3 text-sm text-white';
const errorMessage = (e: unknown) => e instanceof Error ? e.message : 'Server bilan aloqa xatosi';

export function AssessmentResultView({ result }: { result: AssessmentResult }) {
  return <section className={box + ' space-y-4'}>
    <h2 className="font-bold text-xl">{result.examTitle} — {result.mode === 'practice' ? 'mashq natijasi' : 'sinov natijasi'}</h2>
    <p>Xom ball: {result.score} / {result.maxScore} ({result.percentage}%)</p>
    {result.examKind === 'national_certificate' && <div className="rounded-xl bg-amber-500/10 p-4 text-amber-200">
      {result.rasch?.status === 'estimated' ? <p>Rasch 1PL/EAP: θ = {result.rasch.theta?.toFixed(3)} logit; posterior SD = {result.rasch.posteriorSd?.toFixed(3)}. Kalibrlash: {result.rasch.calibrationVersion}.</p>
        : <p>Rasch bali hisoblanmagan — kalibrlash parametrlari kutilmoqda.</p>}
      <p className="mt-2 text-sm">Xom foiz milliy sertifikat bali emas. Bu tayyorgarlik sinovi; rasmiy BMBA balli, darajasi yoki davlat sertifikati berilmaydi.</p>
    </div>}
    {result.mode === 'practice' && <p className="text-sm text-zinc-400">Bu urinish olimpiada reytingiga qo‘shilmaydi va sertifikat bermaydi.</p>}
    {result.analysis?.map((item, index) => <details className="border-t border-white/10 pt-3" key={item.questionId}>
      <summary className="cursor-pointer">{index + 1}. {item.isCorrect ? '✓' : '✕'} {item.questionText}</summary>
      <p className="mt-2">Sizning javobingiz: {item.userAnswer || 'Javob berilmagan'} · To‘g‘ri javob: {item.correctAnswer}</p>
      {item.explanation && <p className="text-zinc-300 mt-2">{item.explanation}</p>}
    </details>)}
  </section>;
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
