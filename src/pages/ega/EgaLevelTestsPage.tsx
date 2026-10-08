import React, { useState, useMemo } from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { useLevelTestStore, LevelTestSet, LevelQuestion } from '../../store/useLevelTestStore';
import { useThemeStore } from '../../store/useThemeStore';
import {
  Brain,
  Plus,
  Trash2,
  Edit,
  Clock,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Search,
  FileSpreadsheet,
  X,
  Eye,
  Calendar,
  Layers,
  HelpCircle,
  Pencil,
  Check,
  Grid,
  List
} from 'lucide-react';
import { clsx } from 'clsx';
import * as XLSX from 'xlsx';

export const EgaLevelTestsPage: React.FC = () => {
  const { testSets, addTestSet, deleteTestSet } = useLevelTestStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<'math' | 'physics' | 'chemistry' | 'biology' | 'informatics'>('math');
  const [year, setYear] = useState(2025);
  const [grade, setGrade] = useState(9);
  const [difficulty, setDifficulty] = useState<'boshlangich' | 'orta' | 'yuqori' | 'olimpiada'>('olimpiada');
  const [durationMinutes, setDurationMinutes] = useState(45);

  
  const [viewingTest, setViewingTest] = useState<LevelTestSet | null>(null);

  
  const [questions, setQuestions] = useState<Omit<LevelQuestion, 'id'>[]>([
    {
      questionText: "9-sinf olimpiada savoli namuna: 2^10 + 2^10 nimaga teng?",
      options: ['2^11', '4^10', '2^20', '4^20'],
      correctAnswer: 'A',
      explanation: "2^10 + 2^10 = 2 * (2^10) = 2^11.",
      points: 20
    }
  ]);

  
  const totalCount = testSets.length;
  const totalQuestionsSum = useMemo(() => testSets.reduce((sum, t) => sum + t.questions.length, 0), [testSets]);
  const mathCount = useMemo(() => testSets.filter((t) => t.subject === 'math').length, [testSets]);
  const physicsCount = useMemo(() => testSets.filter((t) => t.subject === 'physics').length, [testSets]);
  const informaticsCount = useMemo(() => testSets.filter((t) => t.subject === 'informatics').length, [testSets]);

  const handleOpenAddModal = () => {
    setEditingTestId(null);
    setTitle('');
    setSubject('math');
    setYear(2025);
    setGrade(9);
    setDifficulty('olimpiada');
    setDurationMinutes(45);
    setQuestions([
      {
        questionText: "Savol matni namuna...",
        options: ['Variant A', 'Variant B', 'Variant C', 'Variant D'],
        correctAnswer: 'A',
        explanation: "Yechim tushuntirishi va izoh...",
        points: 20
      }
    ]);
    setIsModalOpen(true);
  };

  const handleAddQuestionField = () => {
    setQuestions((prev) => [
      ...prev,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 'A',
        explanation: '',
        points: 20
      }
    ]);
  };

  const handleRemoveQuestionField = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const newOpts = [...q.options];
        newOpts[optIndex] = value;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleSaveNewTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTestSet({
      title: title.trim(),
      subject,
      year: Number(year),
      grade: Number(grade),
      difficulty,
      durationMinutes: Number(durationMinutes),
      totalQuestions: questions.length,
      questions: questions.map((q, idx) => ({ ...q, id: `q-${Date.now()}-${idx}` }))
    });

    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const exportData = testSets.map((t) => ({
      'Test ID': t.id,
      'Test Nomi': t.title,
      'Fani': t.subject.toUpperCase(),
      'Sinf': `${t.grade}-sinf`,
      'Yili': `${t.year}-yil`,
      'Murakkablik': t.difficulty,
      'Savollar Soni': t.questions.length,
      'Vaqt (Daqiqa)': t.durationMinutes
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daraja_Testlari');
    XLSX.writeFile(workbook, `IbnSino_Daraja_Testlari_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredTests = testSets.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchSubject = subjectFilter === 'all' || t.subject === subjectFilter;
    const matchGrade = gradeFilter === 'all' || String(t.grade) === gradeFilter;
    return matchSearch && matchSubject && matchGrade;
  });

  return (
    <EgaLayout>
      <div className="space-y-5 font-sans text-xs text-slate-100 pb-12">
        
        <div
          className={clsx(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border shadow-sm transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div>
            <h1 className={clsx("text-base font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
              <Brain className="w-4 h-4 text-amber-400" />
              <span>O'tgan Yillar Savollari va Daraja Testlari Boshqaruvi</span>
            </h1>
            <p className={clsx("text-[11px] mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
              O'quvchilar darajasini sinash va o'tgan yillardagi olimpiada savollari bazasini yaratish hamda tahrirlash
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel'da yuklab olish</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Yangi Daraja Testi Qo'shish</span>
            </button>
          </div>
        </div>

        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs flex items-center gap-2.5",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Jami Test Toplamlari</div>
              <div className="text-base font-black text-white mt-0.5 font-mono">{totalCount} ta</div>
            </div>
          </div>

          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs flex items-center gap-2.5",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Jami Savollar Soni</div>
              <div className="text-base font-black text-emerald-400 mt-0.5 font-mono">{totalQuestionsSum} ta</div>
            </div>
          </div>

          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs flex items-center gap-2.5",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Matematika / Fizika</div>
              <div className="text-base font-black text-amber-400 mt-0.5 font-mono">{mathCount + physicsCount} ta</div>
            </div>
          </div>

          <div
            className={clsx(
              "p-3 rounded-xl border shadow-xs flex items-center gap-2.5",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Informatika / Boshqa</div>
              <div className="text-base font-black text-purple-300 mt-0.5 font-mono">{informaticsCount} ta</div>
            </div>
          </div>
        </div>

        
        <div
          className={clsx(
            "p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#091024] border border-[#1A2F57] text-xs font-semibold text-white focus:outline-none"
            >
              <option value="all">Barcha fanlar</option>
              <option value="math">Matematika</option>
              <option value="physics">Fizika</option>
              <option value="chemistry">Kimyo</option>
              <option value="biology">Biologiya</option>
              <option value="informatics">Informatika</option>
            </select>

            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#091024] border border-[#1A2F57] text-xs font-semibold text-white focus:outline-none"
            >
              <option value="all">Barcha sinflar</option>
              {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                <option key={g} value={String(g)}>{g}-sinf</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Test nomi bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-[#091024] border border-[#1A2F57] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center p-0.5 rounded-lg bg-[#091024] border border-[#1A2F57]">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  "p-1.5 rounded-md transition-colors cursor-pointer",
                  viewMode === 'grid' ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
                )}
                title="Grid ko'rinishi"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={clsx(
                  "p-1.5 rounded-md transition-colors cursor-pointer",
                  viewMode === 'table' ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
                )}
                title="Jadval ko'rinishi"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        
        {filteredTests.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
            <Brain className="w-12 h-12 text-zinc-500 mx-auto opacity-60" />
            <h3 className="text-base font-bold text-zinc-100">Daraja testlari topilmadi</h3>
            <p className="text-xs text-zinc-400">Yangi daraja testi qo'shish uchun yuqoridagi tugmani bosing</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-900/60 overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Test Nomi</th>
                  <th className="py-3.5 px-4">Fan & Sinf</th>
                  <th className="py-3.5 px-4">Yili</th>
                  <th className="py-3.5 px-4">Savollar Soni</th>
                  <th className="py-3.5 px-4">Vaqt</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTests.map((test) => (
                  <tr key={test.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-zinc-100 whitespace-nowrap">
                      {test.title}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase mr-2">
                        {test.subject}
                      </span>
                      <span className="text-amber-400 font-bold">{test.grade}-sinf</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-100 whitespace-nowrap">
                      {test.year}-yil
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300 whitespace-nowrap">
                      {test.questions.length} ta
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300 whitespace-nowrap">
                      {test.durationMinutes} daqiqa
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingTest(test)}
                          className="p-1.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title="Savollarni ko'rish"
                        >
                          <Eye className="w-4 h-4 text-emerald-400" />
                        </button>
                        <button
                          onClick={() => deleteTestSet(test.id)}
                          className="p-1.5 rounded-xl bg-zinc-950/80 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTests.map((test) => (
              <div key={test.id} className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-xl">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      {test.subject} • {test.grade}-sinf
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-400">{test.year}-yil</span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100">{test.title}</h3>
                  <div className="text-xs text-zinc-400 font-mono space-y-1">
                    <div>Savollar soni: <strong className="text-emerald-400">{test.questions.length} ta</strong></div>
                    <div>Vaqt sohasi: <strong className="text-teal-300">{test.durationMinutes} daqiqa</strong></div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setViewingTest(test)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 text-xs font-bold text-emerald-300 transition-all flex items-center gap-1 cursor-pointer border border-white/10"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ko'rish</span>
                  </button>
                  <button
                    onClick={() => deleteTestSet(test.id)}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Yangi Test Qo'shish */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-3xl w-full text-zinc-100 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-xl font-black text-zinc-100 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-emerald-400" />
                  Yangi Daraja Testi / O'tgan Yillar Savoli Qo'shish
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNewTest} className="space-y-5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-300">Test Sarlavhasi (Nomi)</label>
                  <input
                    type="text"
                    required
                    placeholder="masalan: 2025-yil 9-sinf Matematika Respublika Savollari"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 bg-zinc-950/80 border border-white/10 rounded-xl text-zinc-100 outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Fan</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value as any)}
                      className="w-full p-2 bg-zinc-950/80 border border-white/10 rounded-xl text-zinc-100 outline-none font-bold"
                    >
                      <option value="math">Matematika</option>
                      <option value="physics">Fizika</option>
                      <option value="chemistry">Kimyo</option>
                      <option value="biology">Biologiya</option>
                      <option value="informatics">Informatika</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Yil</label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full p-2 bg-zinc-950/80 border border-white/10 rounded-xl text-zinc-100 outline-none font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Sinf</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(Number(e.target.value))}
                      className="w-full p-2 bg-zinc-950/80 border border-white/10 rounded-xl text-zinc-100 outline-none font-bold"
                    >
                      {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                        <option key={g} value={g}>{g}-sinf</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-300 block mb-1">Vaqt (daqiqa)</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full p-2 bg-zinc-950/80 border border-white/10 rounded-xl text-zinc-100 outline-none font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-amber-400">Savollar Ro'yxati ({questions.length} ta)</h3>
                    <button
                      type="button"
                      onClick={handleAddQuestionField}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Savol Qo'shish
                    </button>
                  </div>

                  {questions.map((q, qIdx) => (
                    <div key={qIdx} className="p-4 bg-zinc-950/80 border border-white/10 rounded-2xl space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-300">Savol #{qIdx + 1}</span>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestionField(qIdx)}
                            className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                          >
                            O'chirish
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Savol matnini kiriting..."
                        value={q.questionText}
                        onChange={(e) => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                        className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 font-medium"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          return (
                            <div key={optIdx} className="flex items-center gap-2">
                              <span className="font-bold text-zinc-400 w-4">{letter})</span>
                              <input
                                type="text"
                                placeholder={`Variant ${letter}`}
                                value={opt}
                                onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 text-xs"
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="font-bold text-emerald-400 block mb-1">To'g'ri javob</label>
                          <select
                            value={q.correctAnswer}
                            onChange={(e) => handleQuestionChange(qIdx, 'correctAnswer', e.target.value)}
                            className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-emerald-400 font-bold"
                          >
                            <option value="A">A varianti</option>
                            <option value="B">B varianti</option>
                            <option value="C">C varianti</option>
                            <option value="D">D varianti</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-zinc-300 block mb-1">Yechim izohi / Tahlili</label>
                          <input
                            type="text"
                            placeholder="Yechim tushuntirishi..."
                            value={q.explanation}
                            onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                            className="w-full p-2 bg-zinc-900 border border-white/10 rounded-xl text-zinc-100 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-zinc-950/80 text-zinc-300 font-bold rounded-xl hover:bg-zinc-800 cursor-pointer border border-white/10"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all"
                  >
                    Saqlash va Nashr Etish
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Savollarni ko'rish */}
        {viewingTest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-2xl w-full text-zinc-100 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">{viewingTest.subject.toUpperCase()} • {viewingTest.grade}-sinf ({viewingTest.year})</span>
                  <h3 className="text-base font-bold text-zinc-100">{viewingTest.title}</h3>
                </div>
                <button
                  onClick={() => setViewingTest(null)}
                  className="p-1.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-xs font-bold text-zinc-300">Savollar ro'yxati ({viewingTest.questions.length} ta):</div>
                {viewingTest.questions.map((q, idx) => (
                  <div key={q.id} className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/10 space-y-2">
                    <div className="font-bold text-zinc-100 text-xs">
                      #{idx + 1}. {q.questionText}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-zinc-300">
                      {q.options.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isCorrect = q.correctAnswer === letter;
                        return (
                          <div
                            key={optIdx}
                            className={clsx(
                              "p-1.5 rounded-lg border",
                              isCorrect ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold" : "bg-zinc-900 border-white/10"
                            )}
                          >
                            {letter}) {opt} {isCorrect && "✓"}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div className="text-[11px] text-teal-300 bg-teal-500/10 p-2 rounded-lg border border-teal-500/20">
                        💡 Tahlil: {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-3 border-t border-white/10">
                <button
                  onClick={() => setViewingTest(null)}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white font-bold rounded-xl active:scale-95 transition-all"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EgaLayout>
  );
};

export default EgaLevelTestsPage;
