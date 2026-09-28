import React from 'react';
import { Sidebar } from '../../components/common/Sidebar';
import { Card } from '../../components/common/Card';
import { Users } from 'lucide-react';
import { authService } from '../../services/authService';

export const AdminUsersPage: React.FC = () => {
  const users = authService.getRegisteredUsers();

  return (
    <div className="flex bg-surface min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl">
        <h1 className="text-2xl font-black text-accent-900">Foydalanuvchilar (Users Management)</h1>

        <Card className="p-6">
          {users.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-accent-600 font-bold uppercase text-xs border-b border-border">
                <tr>
                  <th className="p-3">F.I.SH</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Hudud / Maktab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="p-3 font-bold text-accent-900">{u.fullName}</td>
                    <td className="p-3 font-mono text-xs">{u.email}</td>
                    <td className="p-3 uppercase font-bold text-xs text-primary">{u.role}</td>
                    <td className="p-3 text-xs">{u.region || 'Toshkent'} • {u.school || 'Maktab'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Ro'yxatdan o'tgan foydalanuvchilar yo'q</h3>
                <p className="text-xs text-slate-400">Saytga yangi foydalanuvchi a'zo bo'lganda bu yerda ko'rinadi.</p>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};
