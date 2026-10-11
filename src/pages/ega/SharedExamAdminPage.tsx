import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { OlympiadFullEditor } from '../../components/ega/OlympiadFullEditor';
import { toAdminExam } from '../../services/adminExamAdapter';
import { apiClient } from '../../services/api';
import { examCatalogService as catalog, examKindLabels, type AssessmentResult, type CatalogExam, type ExamKind } from '../../services/examCatalogService';
import type { OlympiadItem } from '../../data/initialOlympiads';

const paths: Record<ExamKind, string> = { olympiad: '/ega/olympiads', level_test: '/ega/level-tests', national_certificate: '/ega/baholash' };
const control = 'rounded-xl border border-white/15 bg-zinc-900 p-3 text-sm';
const action = 'rounded-xl border border-emerald-500/30 px-3 py-2 text-sm hover:bg-emerald-500/15 disabled:opacity-40';
const message = (e: unknown) => e instanceof Error ? e.message : 'Server bilan aloqa xatosi';

export function SharedExamAdminPage({ kind }: { kind: ExamKind }) {
  const { id: routeId } = useParams();
  const [exams, setExams] = useState<CatalogExam[]>([]);
  const [selected, setSelected] = useState<CatalogExam | null>(null);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Matematika');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [practiceEnabled, setPracticeEnabled] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [raschText, setRaschText] = useState('');
  const [editKind, setEditKind] = useState<ExamKind>(kind);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const refresh = useCallback(async () => setExams(await catalog.list(kind)), [kind]);
  useEffect(() => { setSelected(null); void refresh().catch(e => setError(message(e))); }, [refresh]);
  const run = async (task: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await task(); } catch (e) { setError(message(e)); } finally { setBusy(false); }
  };
  const select = async (id: string) => {
    const [exam, attempts] = await Promise.all([catalog.adminExam(id), catalog.examResults(id)]);
    setResults(attempts);
    setSelected(exam); setPracticeEnabled(exam.practiceEnabled === true);
    setEditKind(exam.kind);
    setYear(exam.sourceYear ?? new Date().getFullYear());
    setRaschText(exam.raschConfig ? JSON.stringify(exam.raschConfig, null, 2) : '');
  };
  useEffect(() => { if (routeId) void select(routeId).catch(e => setError(message(e))); }, [routeId]);
  const save = async (id: string, fields: Partial<OlympiadItem>) => {
    if (busy) throw new Error('Oldingi amal tugashini kuting');
    setBusy(true);
    try {
      let raschConfig: unknown = null;
      if (editKind === 'national_certificate' && raschText.trim()) {
        try { raschConfig = JSON.parse(raschText); } catch { throw new Error('Rasch JSON formati noto‘g‘ri'); }
      }
      await catalog.update(id, { ...fields, kind: editKind, practiceEnabled, sourceYear: year, raschConfig });
      await refresh();
    } finally { setBusy(false); }
  };
  const clone = async (exam: CatalogExam) => {
    const full = await catalog.adminExam(exam.id);
    const questions = (await apiClient.get<{ questions: Array<Record<string, unknown>> }>(`/exams/${encodeURIComponent(exam.id)}/questions`)).questions;
    const saved = await catalog.create({ ...full, title: full.title + ' — nusxa', status: 'yopiq', practiceEnabled: false,
      raschConfig: null, questions: questions.map((q, i) => ({ ...q, id: String(i + 1) })) });
    await refresh(); await select(saved.id);
  };
  if (selected) {
    return (
      <EgaLayout>
        {error && <div role="alert" className="rounded-xl border border-red-400/30 p-4 text-red-300 mb-4">{error}</div>}
        <OlympiadFullEditor
          key={selected.id}
          olympiad={toAdminExam(selected)}
          onSave={save}
          participantsEnabled={true}
          onBack={() => {
            setSelected(null);
            void refresh().catch(e => setError(message(e)));
          }}
        />
      </EgaLayout>
    );
  }

  return (
    <EgaLayout>
      <nav className="flex flex-wrap gap-2 mb-4" aria-label="Test turi">
        {(Object.keys(paths) as ExamKind[]).map(k => (
          <Link
            key={k}
            to={paths[k]}
            className={action + (k === kind ? ' bg-emerald-500/20 text-emerald-300 font-bold' : '')}
          >
            {examKindLabels[k]}
          </Link>
        ))}
      </nav>
      <h1 className="text-xl sm:text-2xl font-bold mb-4">{examKindLabels[kind]}</h1>
      {error && <div role="alert" className="rounded-xl border border-red-400/30 p-4 text-red-300 mb-4">{error}</div>}

      <form className="flex flex-wrap items-end gap-3 mb-4" onSubmit={e => { e.preventDefault(); void run(async () => {
        const exam = await catalog.create({ kind, title, subject, status: 'yopiq', practiceEnabled: false,
          sourceYear: new Date().getFullYear(), questions: [], durationMinutes: 60 });
        setTitle(''); await refresh(); await select(exam.id);
      }); }}>
        <label className="flex flex-col gap-1 flex-1 min-w-[200px]">Test nomi<input className={control} required minLength={3} maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></label>
        <label className="flex flex-col gap-1">Fan<select className={control} value={subject} onChange={e => setSubject(e.target.value)}>{['Matematika', 'Kimyo', 'Biologiya', 'Fizika', 'Informatika'].map(s => <option key={s}>{s}</option>)}</select></label>
        <button className={action} disabled={busy}>Yangi test yaratish</button>
      </form>
      <input aria-label="Testlarni qidirish" className={control + ' w-full mb-4'} placeholder="Nomi yoki fan bo‘yicha qidirish…" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {exams.filter(e => (e.title + e.subject).toLowerCase().includes(search.toLowerCase())).map(exam => <article key={exam.id} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 sm:p-5 space-y-3 sm:space-y-4">
          <p className="text-xs text-emerald-300">{exam.subject} · {exam.sourceYear ?? 'Yil belgilanmagan'}</p>
          <h2 className="font-bold text-base sm:text-lg">{exam.title}</h2>
          <p className="text-sm text-zinc-400">{exam.totalQuestions ?? 0} savol · {exam.durationMinutes} daqiqa · {exam.status}</p>
          <p className="text-sm">Mashq: {exam.practiceAvailable ? 'ochiq' : exam.practiceEnabled ? 'muddat tugashi kutilmoqda' : 'yopiq'}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button className={action} disabled={busy} onClick={() => void run(() => select(exam.id))}>Tahrirlash</button>
            <button className={action} disabled={busy} onClick={() => void run(() => clone(exam))}>Nusxa olish</button>
            <button className={action} disabled={busy} onClick={() => void run(async () => { await catalog.update(exam.id, { status: ['active', 'ochiq', 'upcoming'].includes(exam.status) ? 'yopiq' : 'ochiq' }); await refresh(); })}>Ochish / yopish</button>
            <button className={action} disabled={busy} onClick={() => { if (confirm('Tarixi yo‘q ushbu testni o‘chirasizmi?')) void run(async () => { await catalog.remove(exam.id); await refresh(); }); }}>O‘chirish</button>
          </div>
        </article>)}
      </div>
      {!exams.length && <p className="text-zinc-400">Hozircha test yo‘q. Avval test yarating, keyin savollarini kiriting.</p>}
    </EgaLayout>
  );
}
