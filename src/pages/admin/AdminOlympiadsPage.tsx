import React, { useState } from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Plus, Edit, Trash2, HelpCircle, Code2, CheckCircle2, FileText, ListFilter, Sparkles, Layers } from 'lucide-react';
import { useOlympiadList, useOlympiadQuestions } from '../../hooks/useOlympiad';
import { olympiadService } from '../../services/olympiadService';
import { Olympiad, Question, QuestionType, Subject } from '../../types';
import { MOCK_QUESTIONS } from '../../services/mockData';

export const AdminOlympiadsPage: React.FC = () => {
  const { data: olympiads, refetch } = useOlympiadList();
  const [selectedOlympiadId, setSelectedOlympiadId] = useState<string>('olymp-math-2026');

  
  const [isOlympiadModalOpen, setIsOlympiadModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

  
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<Subject>('math');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [description, setDescription] = useState('');

  
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice');
  const [questionContent, setQuestionContent] = useState('');
  const [points, setPoints] = useState(20);
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('cpp');
  const [codeTemplate, setCodeTemplate] = useState('');

  
  const currentQuestions = MOCK_QUESTIONS[selectedOlympiadId] || MOCK_QUESTIONS['olymp-math-2026'] || [];
  const selectedOlympiad = olympiads?.find((o) => o.id === selectedOlympiadId) || olympiads?.[0];

  const handleCreateOlympiad = async (e: React.FormEvent) => {
    e.preventDefault();
    await olympiadService.createOlympiad({
      title,
      subject,
      durationMinutes,
      description,
    });
    setIsOlympiadModalOpen(false);
    setTitle('');
    setDescription('');
    refetch();
    alert("Yangi olimpiada yaratildi!");
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const newQuestion: Question = {
      id: `q-gen-${Date.now()}`,
      olympiadId: selectedOlympiadId,
      roundId: 'r1',
      type: questionType,
      content: questionContent,
      points,
      order: currentQuestions.length + 1,
      options: questionType === 'multiple_choice' ? [optionA, optionB, optionC, optionD].filter(Boolean) : undefined,
      codeLanguage: questionType === 'code' ? codeLanguage : undefined,
      codeTemplate: questionType === 'code' ? codeTemplate : undefined,
    };

    if (!MOCK_QUESTIONS[selectedOlympiadId]) {
      MOCK_QUESTIONS[selectedOlympiadId] = [];
    }
    MOCK_QUESTIONS[selectedOlympiadId].push(newQuestion);

    setIsQuestionModalOpen(false);
    setQuestionContent('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCodeTemplate('');
    alert("Savol muvaffaqiyatli qo'shildi!");
  };

  return (
    <div className="flex bg-surface min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold mb-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin Studio • Olympiad & Question Creator</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Musobaqalar va Savollar Boshqaruvi
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsOlympiadModalOpen(true)}
              variant="primary"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Yangi Musobaqa Yaratish
            </Button>
          </div>
        </div>

        
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>1. Musobaqalar Ro'yxati</span>
            <span className="text-xs text-slate-500 font-normal">(Boshqarish uchun tanlang)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {olympiads?.map((o) => {
              const isSelected = o.id === selectedOlympiadId;
              const questionCount = (MOCK_QUESTIONS[o.id] || []).length || o.totalQuestions;

              return (
                <div
                  key={o.id}
                  onClick={() => setSelectedOlympiadId(o.id)}
                  className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-blue-900 text-white border-blue-700 shadow-lg ring-2 ring-blue-500/30'
                      : 'bg-white text-slate-900 border-slate-200 hover:border-blue-400 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge subject={o.subject} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isSelected ? 'bg-blue-800 text-blue-200 border-blue-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {o.status}
                      </span>
                    </div>

                    <h4 className={`font-bold text-base line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {o.title}
                    </h4>
                  </div>

                  <div className={`pt-3 border-t flex items-center justify-between text-xs font-medium ${
                    isSelected ? 'border-blue-800 text-blue-200' : 'border-slate-100 text-slate-500'
                  }`}>
                    <span>{o.durationMinutes} daq</span>
                    <span className="font-bold text-cyan-400">{questionCount} ta savol</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
            <div className="space-y-1">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                Savollar Boshqaruvi
              </span>
              <h2 className="text-xl font-extrabold text-white">
                {selectedOlympiad?.title || "Tanlangan Musobaqa"}
              </h2>
              <p className="text-xs text-slate-300">
                Fan: <strong className="text-white uppercase">{selectedOlympiad?.subject}</strong> • {currentQuestions.length} ta savol kiritilgan
              </p>
            </div>

            <Button
              onClick={() => setIsQuestionModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold shrink-0"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Yangi Savol Qo'shish
            </Button>
          </div>

          
          <Card className="p-6 bg-white border border-slate-200 shadow-xs">
            {currentQuestions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3"># Order</th>
                      <th className="p-3">Tur</th>
                      <th className="p-3">Savol Mazmuni (Preview)</th>
                      <th className="p-3">Ball</th>
                      <th className="p-3 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentQuestions.map((q, idx) => (
                      <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-900 font-mono">#{idx + 1}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                            {q.type === 'multiple_choice' ? 'Test (A/B/C/D)' : q.type === 'open_text' ? 'Ochiq Savol' : q.type === 'code' ? 'Algoritmik Kod' : 'Fayl Yuklash'}
                          </span>
                        </td>
                        <td className="p-3 max-w-md">
                          <p className="text-xs text-slate-800 font-medium line-clamp-2">{q.content}</p>
                          {q.options && (
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              Variantlar: {q.options.join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-blue-600 font-mono">{q.points} ball</td>
                        <td className="p-3 text-right space-x-2">
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-900">Ushbu olimpiada uchun hali savollar qo'shilmagan</h4>
                <p className="text-xs text-slate-500">Yuqoridagi "Yangi Savol Qo'shish" tugmasini bosib savol kiriting.</p>
              </div>
            )}
          </Card>
        </div>

        
        <Modal isOpen={isOlympiadModalOpen} onClose={() => setIsOlympiadModalOpen(false)} title="Yangi Musobaqa Yaratish">
          <form onSubmit={handleCreateOlympiad} className="space-y-4">
            <Input
              label="Musobaqa Sarlavhasi"
              placeholder="Masalan: Respublika Fizika Iqtidorlari I Bosqichi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Fan</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
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
                label="Davomiyligi (Daqiqada)"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Tavsifi (Description)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Musobaqa haqida batafsil ma'lumot yozing..."
                className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold">
              Musobaqani Yaratish
            </Button>
          </form>
        </Modal>

        
        <Modal isOpen={isQuestionModalOpen} onClose={() => setIsQuestionModalOpen(false)} title="Yangi Savol Qo'shish (Question Builder)" size="lg">
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Savol Turi (Question Type)</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-white font-bold"
                >
                  <option value="multiple_choice">Variantli Test (A / B / C / D)</option>
                  <option value="open_text">Ochiq Savol (Text / Math)</option>
                  <option value="code">Algoritmik Kod (C++ / Python / Java)</option>
                  <option value="file_upload">Fayl Yuklash (PDF / ZIP)</option>
                </select>
              </div>

              <Input
                label="Savol Balli (Points)"
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">Savol Matni / Sharti (LaTeX va Math qo'llab-quvvatlanadi)</label>
              <textarea
                rows={4}
                value={questionContent}
                onChange={(e) => setQuestionContent(e.target.value)}
                placeholder="Savol matnini shu yerga yozing..."
                className="w-full p-3 text-sm border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            
            {questionType === 'multiple_choice' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase text-slate-700">Test Variantlari:</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="A Variant" value={optionA} onChange={(e) => setOptionA(e.target.value)} required />
                  <Input label="B Variant" value={optionB} onChange={(e) => setOptionB(e.target.value)} required />
                  <Input label="C Variant" value={optionC} onChange={(e) => setOptionC(e.target.value)} required />
                  <Input label="D Variant" value={optionD} onChange={(e) => setOptionD(e.target.value)} required />
                </div>
              </div>
            )}

            
            {questionType === 'code' && (
              <div className="space-y-3 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-cyan-400">Dasturlash Tili & Boshlang'ich Shablon (Code Template):</label>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="p-1 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg"
                  >
                    <option value="cpp">C++</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                </div>
                <textarea
                  rows={5}
                  value={codeTemplate}
                  onChange={(e) => setCodeTemplate(e.target.value)}
                  placeholder={`// Boshlang'ich kod shabloni...\n#include <iostream>\nusing namespace std;`}
                  className="w-full p-3 text-xs bg-slate-950 text-emerald-400 font-mono rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold">
              Savolni Saqlash va Qo'shish
            </Button>
          </form>
        </Modal>
      </main>
    </div>
  );
};
