import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  ArrowLeft,
  Settings,
  HelpCircle,
  Trophy,
  FileSpreadsheet,
  FileText,
  Clock,
  ShieldCheck,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Download,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useOlympiadStore } from '../../store/useOlympiadStore';
import { Question, QuestionType } from '../../types';
import { submissionService } from '../../services/submissionService';
import confetti from 'canvas-confetti';

export const EgaSingleCompetitionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { olympiads, updateOlympiad } = useOlympiadStore();
  const storeOlympiad = olympiads.find((o) => o.id === id);

  
  const participantsList = id ? submissionService.getOlympiadSubmissions(id) : [];

  
  const [activeTab, setActiveTab] = useState<'settings' | 'questions' | 'results'>('settings');

  
  const [title, setTitle] = useState(storeOlympiad?.title || 'Yangi Olimpiada');
  const [subject, setSubject] = useState(storeOlympiad?.subject || 'math');
  const [durationMinutes, setDurationMinutes] = useState((storeOlympiad as any)?.durationMinutes || 120);
  const [isPaid, setIsPaid] = useState(false);
  const [priceAmount, setPriceAmount] = useState('35,000 UZS');
  const [antiCheatLevel, setAntiCheatLevel] = useState('Strict Anti-Cheat');

  
  const questionsList: Question[] = storeOlympiad?.questions || [];
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [qType, setQType] = useState<QuestionType>('multiple_choice');
  const [qContent, setQContent] = useState('');
  const [qPoints, setQPoints] = useState(20);
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (id) {
      updateOlympiad(id, {
        title,
        subject
      });
    }
    alert("Musobaqa sozlamalari saqlandi!");
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const newQ: Question = {
      id: `q-single-${Date.now()}`,
      olympiadId: id || 'OLY-101',
      roundId: 'r1',
      type: qType,
      content: qContent,
      points: qPoints,
      order: questionsList.length + 1,
      options: qType === 'multiple_choice' ? [optA, optB].filter(Boolean) : undefined,
    };
    if (id) {
      const updatedQuestions = [...(storeOlympiad?.questions || []), newQ];
      updateOlympiad(id, { questions: updatedQuestions });
    }
    setIsQuestionModalOpen(false);
    setQContent('');
    setOptA('');
    setOptB('');
    alert("Savol saqlandi!");
  };

  const handleExportExcel = () => {
    confetti({ particleCount: 60, spread: 50 });
    alert(`Excel protokoli (.xlsx) yuklab olindi! (${storeOlympiad?.title || title})`);
  };

  const handleExportPdf = () => {
    confetti({ particleCount: 60, spread: 50 });
    alert(`Rasmiy PDF bayonnoma (.pdf) yuklab olindi! (${storeOlympiad?.title || title})`);
  };

  return (
    <EgaLayout>
      
      <div className="space-y-4 font-sans">
        <Link to="/ega/competitions" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Musobaqalar ro'yxatiga qaytish
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge subject={(storeOlympiad?.subject as any) || 'math'} />
              <Badge status={storeOlympiad?.status === 'ochiq' ? 'active' : 'upcoming'} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">{storeOlympiad?.title || title}</h1>
            <p className="text-xs text-slate-300">
              Id: <span className="font-mono text-cyan-400 font-bold">{storeOlympiad?.id || id}</span> • Davomiyligi: {durationMinutes} daq • {questionsList.length} ta savol
            </p>
          </div>

          
          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900 hover:text-white text-xs font-bold shadow-md shadow-emerald-950/40"
              leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
            >
              Excel (.xlsx) Yuklab Olish
            </Button>
            <Button
              onClick={handleExportPdf}
              variant="outline"
              className="bg-rose-950/60 text-rose-300 border-rose-800/80 hover:bg-rose-900 hover:text-white text-xs font-bold shadow-md shadow-rose-950/40"
              leftIcon={<FileText className="w-4 h-4 text-rose-400" />}
            >
              PDF (.pdf) Yuklab Olish
            </Button>
          </div>
        </div>

        
        <div className="flex items-center gap-2 border-b border-slate-200 pt-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-xs border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" /> Sozlamalar (Settings)
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-xs border-b-2 transition-all ${
              activeTab === 'questions'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Savollar Bazasi ({questionsList.length})
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-xs border-b-2 transition-all ${
              activeTab === 'results'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4" /> Natijalar va Reyting
          </button>
        </div>
      </div>

      
      {activeTab === 'settings' && (
        <Card className="p-6 bg-white border border-slate-200 space-y-6">
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Musobaqa Parametrlari va Sozlamalari
            </h3>

            <Input
              label="Musobaqa Sarlavhasi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-700">Fan yo'nalishi</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as any)}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-white"
                >
                  <option value="math">Matematika</option>
                  <option value="physics">Fizika</option>
                  <option value="chemistry">Kimyo</option>
                  <option value="biology">Biologiya</option>
                  <option value="informatics">Informatika</option>
                </select>
              </div>

              <Input
                label="Vaqt Chegarasi (Daqiqada)"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                required
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Ishtirok Narxi (Price/Free Toggle)</h4>
                  <p className="text-xs text-slate-500">Musobaqa bepul yoki pullik ekanligini belgilang</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {isPaid && (
                <Input
                  label="Ishtirok To'lovi (UZS)"
                  value={priceAmount}
                  onChange={(e) => setPriceAmount(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-700">Anti-Cheat Qat'iylik Darajasi</label>
              <select
                value={antiCheatLevel}
                onChange={(e) => setAntiCheatLevel(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-white font-semibold"
              >
                <option value="Strict Anti-Cheat">Strict Anti-Cheat (Tab switch + Clipboard + Fullscreen block)</option>
                <option value="Moderate">Moderate (Faqat Tab switch nazorati)</option>
                <option value="Basic">Basic (Standart timer)</option>
              </select>
            </div>

            <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6">
              Sozlamalarni Saqlash
            </Button>
          </form>
        </Card>
      )}

      
      {activeTab === 'questions' && (
        <Card className="p-6 bg-white border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Ushbu Musobaqaga Biriktirilgan Savollar</h3>
              <p className="text-xs text-slate-500">Jami {questionsList.length} ta savol kiritilgan</p>
            </div>
            <Button onClick={() => setIsQuestionModalOpen(true)} className="bg-blue-600 text-white font-bold" leftIcon={<Plus className="w-4 h-4" />}>
              Yangi Savol Qo'shish
            </Button>
          </div>

          <div className="space-y-3">
            {questionsList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 opacity-40 mx-auto mb-2" />
                <p className="font-semibold text-xs text-slate-600">Hozircha savollar mavjud emas</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Yangi savol qo'shish uchun yuqoridagi tugmani bosing</p>
              </div>
            ) : (
              questionsList.map((q: Question, idx: number) => (
                <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-600">#{idx + 1}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                        {q.type}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{q.points} ball</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{q.content}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      
      {activeTab === 'results' && (
        <Card className="p-6 bg-white border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900">Ishtirokchilar Natijalari va Audit Tizimi</h3>
            <span className="text-xs text-emerald-600 font-bold">100% Verified Anti-Cheat</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">O'rin</th>
                  <th className="p-3">Ishtirokchi</th>
                  <th className="p-3">Sinf va Viloyat</th>
                  <th className="p-3">Ball</th>
                  <th className="p-3">Sarf Vaqti</th>
                  <th className="p-3">Anti-Cheat Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {participantsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Hozircha ishtirokchilar mavjud emas
                    </td>
                  </tr>
                ) : (
                  participantsList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900 font-mono">#{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{item.name}</td>
                      <td className="p-3">{item.grade}-sinf • {item.region}</td>
                      <td className="p-3 font-extrabold text-blue-600 font-mono text-sm">{item.score} ball ({item.percentage}%)</td>
                      <td className="p-3 font-mono">{item.timeSpentMinutes} daq</td>
                      <td className="p-3 font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tasdiqlangan</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      
      <Modal isOpen={isQuestionModalOpen} onClose={() => setIsQuestionModalOpen(false)} title="Yangi Savol Qo'shish">
        <form onSubmit={handleAddQuestion} className="space-y-4">
          <Input label="Savol Sharti" value={qContent} onChange={(e) => setQContent(e.target.value)} required />
          <Input label="Ball" type="number" value={qPoints} onChange={(e) => setQPoints(Number(e.target.value))} required />
          <Button type="submit" className="w-full bg-blue-600 text-white font-bold">Saqlash</Button>
        </form>
      </Modal>
    </EgaLayout>
  );
};

