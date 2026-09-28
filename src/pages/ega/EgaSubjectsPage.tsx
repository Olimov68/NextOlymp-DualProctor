import React from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { Card } from '../../components/common/Card';
import { BookOpen, Users, HelpCircle } from 'lucide-react';

export const EgaSubjectsPage: React.FC = () => {
  const subjectExperts = [
    { subject: 'Matematika va Algebra', expert: 'Prof. Anvar Hakimov', totalQuestions: 450, activeContests: 3 },
    { subject: 'Informatika va Dasturlash (ICPC)', expert: 'Dr. Sardor Toshpo\'latov', totalQuestions: 380, activeContests: 2 },
    { subject: 'Fizika va Mexanika', expert: 'Doc. Nigora Rahmonova', totalQuestions: 320, activeContests: 1 },
    { subject: 'Kimyo va Organika', expert: 'Prof. Jamshid Karimov', totalQuestions: 290, activeContests: 2 },
    { subject: 'Biologiya va Ekologiya', expert: 'Dr. Shahlo Boboyeva', totalQuestions: 240, activeContests: 1 },
  ];

  return (
    <EgaLayout>
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900">Fanlar va Yo'nalishlar Boshqaruvi</h1>
        <p className="text-xs text-slate-500">Matematika, Fizika, Kimyo, Biologiya va Informatika bo'yicha ekspertlar va savollar bazasi</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjectExperts.map((exp, idx) => (
          <Card key={idx} className="p-6 bg-white border border-slate-200 space-y-4 shadow-xs hover:border-blue-500 hover:shadow-md transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">{exp.subject}</h3>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Mas'ul Ekspert:</span>
                <strong className="text-slate-900">{exp.expert}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Savollar Bazasi:</span>
                <strong className="text-blue-600 font-mono font-bold">{exp.totalQuestions} ta savol</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Faol Musobaqalar:</span>
                <strong className="text-emerald-600 font-bold">{exp.activeContests} ta</strong>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </EgaLayout>
  );
};
