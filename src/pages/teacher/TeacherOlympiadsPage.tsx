import React from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { UserPlus, Users } from 'lucide-react';
import { authService } from '../../services/authService';

export const TeacherOlympiadsPage: React.FC = () => {
  const registeredUsers = authService.getRegisteredUsers();
  const students = registeredUsers.filter((u) => u.role === 'student');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#F1F5F9]">O'quvchilar Boshqaruvi</h1>
        <Button variant="primary" leftIcon={<UserPlus className="w-4 h-4" />}>
          O'quvchi Qo'shish
        </Button>
      </div>

      <Card className="p-6 bg-[#111827] border border-[#1E293B]">
        {students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0B1120] text-[#94A3B8] font-bold uppercase text-xs border-b border-[#1E293B]">
                <tr>
                  <th className="p-3">O'quvchi F.I.SH</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Sinf</th>
                  <th className="p-3">Hudud</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B] text-[#F1F5F9]">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-[#1E293B]/40 transition-colors">
                    <td className="p-3 font-bold text-[#F1F5F9]">{s.fullName}</td>
                    <td className="p-3 font-mono text-xs text-[#94A3B8]">{s.email}</td>
                    <td className="p-3 text-[#94A3B8]">{s.grade ? `${s.grade}-sinf` : '-'}</td>
                    <td className="p-3 font-semibold text-[#60A5FA]">{s.region || 'Toshkent'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <Users className="w-10 h-10 text-[#64748B] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#F1F5F9]">Hozircha biriktirilgan o'quvchilar mavjud emas</h3>
              <p className="text-xs text-[#94A3B8]">O'quvchilar platformadan ro'yxatdan o'tganda ro'yxatda paydo bo'ladi.</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
