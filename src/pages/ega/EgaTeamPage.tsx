import React, { useState } from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import {
  ShieldCheck,
  UserPlus,
  Search,
  UserCog,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Mail,
  ShieldAlert,
  X,
  Users
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: 'super_admin' | 'content_creator' | 'proctor' | 'auditor';
  roleTitle: string;
  assignedSubject?: string;
  status: 'active' | 'inactive';
  lastActive: string;
  avatarBg: string;
}

export const EgaTeamPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  
  const [newAdmin, setNewAdmin] = useState({
    fullName: '',
    email: '',
    role: 'content_creator',
    assignedSubject: 'Matematika',
  });

  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    return [
      {
        id: currentUser?.id || 'adm-01',
        fullName: currentUser?.fullName || 'Super Admin',
        email: currentUser?.email || 'admin@nextolymp.uz',
        role: 'super_admin',
        roleTitle: 'Super Admin (Ega)',
        status: 'active',
        lastActive: 'Hozirda faol',
        avatarBg: 'bg-purple-600',
      },
    ];
  });

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.fullName || !newAdmin.email) return;

    const roleMap: Record<string, string> = {
      super_admin: 'Super Admin (Ega)',
      content_creator: 'Savol Tuzuvchi (Editor)',
      proctor: 'Proctor (Nazoratchi)',
      auditor: 'Hisobchi (Auditor)',
    };

    const roleBgMap: Record<string, string> = {
      super_admin: 'bg-purple-600',
      content_creator: 'bg-blue-600',
      proctor: 'bg-emerald-600',
      auditor: 'bg-amber-600',
    };

    const created: AdminUser = {
      id: `adm-${Date.now()}`,
      fullName: newAdmin.fullName,
      email: newAdmin.email,
      role: newAdmin.role as AdminUser['role'],
      roleTitle: roleMap[newAdmin.role] || 'Admin',
      assignedSubject: newAdmin.assignedSubject,
      status: 'active',
      lastActive: 'Hozirgina qo‘shildi',
      avatarBg: roleBgMap[newAdmin.role] || 'bg-blue-600',
    };

    setAdmins([created, ...admins]);
    setNewAdmin({
      fullName: '',
      email: '',
      role: 'content_creator',
      assignedSubject: 'Matematika',
    });
    setIsAddModalOpen(false);
  };

  const filteredAdmins = admins.filter((adm) => {
    const matchesSearch =
      adm.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adm.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || adm.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: AdminUser['role']) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Super Admin</span>;
      case 'content_creator':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1"><Edit2 className="w-3.5 h-3.5" /> Savol Tuzuvchi</span>;
      case 'proctor':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Proctor</span>;
      case 'auditor':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5" /> Hisobchi</span>;
    }
  };

  return (
    <EgaLayout>
      <div className="space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <UserCog className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Adminlar va Ruxsatlar (RBAC)</h1>
            </div>
            <p className="text-sm font-medium text-slate-400 mt-1">
              Tizim administratorlari, proctorlar va content creatorlar huquqlarini boshqarish
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yangi Admin Qo‘shish</span>
          </button>
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>SUPER ADMINS</span>
              <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600"><ShieldCheck className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-black text-slate-900">{admins.filter(a => a.role === 'super_admin').length} nafar</div>
            <p className="text-[11px] text-slate-500 font-medium">To'liq platforma nazorati huquqi</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>SAVOL TUZUVCHILAR</span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Edit2 className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-black text-slate-900">{admins.filter(a => a.role === 'content_creator').length} nafar</div>
            <p className="text-[11px] text-slate-500 font-medium">Musobaqa va savollar banki tahriri</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>PROCTORLAR</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><ShieldAlert className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-black text-slate-900">{admins.filter(a => a.role === 'proctor').length} nafar</div>
            <p className="text-[11px] text-slate-500 font-medium">Live anti-cheat & kamera kuzatuvi</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>HISOBCHILAR</span>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600"><FileSpreadsheet className="w-4 h-4" /></span>
            </div>
            <div className="text-2xl font-black text-slate-900">{admins.filter(a => a.role === 'auditor').length} nafar</div>
            <p className="text-[11px] text-slate-500 font-medium">Moliyaviy audit va to'lovlar tahlili</p>
          </div>
        </div>

        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Admin ismi yoki emailini kiriting..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Rol bo'yicha:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="all">Barchasi</option>
              <option value="super_admin">Super Admin</option>
              <option value="content_creator">Savol Tuzuvchi (Editor)</option>
              <option value="proctor">Proctor (Nazoratchi)</option>
              <option value="auditor">Hisobchi (Auditor)</option>
            </select>
          </div>
        </div>

        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {filteredAdmins.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="p-4">Admin Foydalanuvchi</th>
                    <th className="p-4">Tayinlangan Rol (RBAC)</th>
                    <th className="p-4">Biriktirilgan Sohasi / Fan</th>
                    <th className="p-4">Holati</th>
                    <th className="p-4">Oxirgi Faollik</th>
                    <th className="p-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredAdmins.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${adm.avatarBg} text-white font-bold flex items-center justify-center text-xs shadow-xs`}>
                            {adm.fullName[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{adm.fullName}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{adm.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getRoleBadge(adm.role)}
                      </td>
                      <td className="p-4 text-slate-600 font-semibold">
                        {adm.assignedSubject || 'Barcha Fanlar & Cheksiz'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            adm.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${adm.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {adm.status === 'active' ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {adm.lastActive}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
            <div className="py-12 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Admin foydalanuvchilar topilmadi</h3>
                <p className="text-xs text-slate-400">"Yangi Admin Qo'shish" tugmasini bosib admin biriktirishingiz mumkin.</p>
              </div>
            </div>
          )}
        </div>

        
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Yangi Admin Qo‘shish</h3>
                    <p className="text-xs text-slate-400">Rol va ruxsat darajasini biriktirish</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAdmin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">To'liq Ism-Sharif</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Sardor Rustamov"
                    value={newAdmin.fullName}
                    onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Elektron Pochtasi (Email)</label>
                  <input
                    type="email"
                    required
                    placeholder="sardor@nextolymp.uz"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tayinlanadigan Rol (RBAC)</label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 bg-slate-50 font-medium"
                  >
                    <option value="super_admin">Super Admin (Ega) — To'liq Huquq</option>
                    <option value="content_creator">Savol Tuzuvchi (Editor) — Savollar va Testlar</option>
                    <option value="proctor">Proctor (Nazoratchi) — Kamera va Anti-Cheat</option>
                    <option value="auditor">Hisobchi (Auditor) — Moliyaviy Hisobotlar</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Biriktirilgan Fan / Musobaqa Sohasi</label>
                  <input
                    type="text"
                    placeholder="Masalan: Matematika & Fizika"
                    value={newAdmin.assignedSubject}
                    onChange={(e) => setNewAdmin({ ...newAdmin, assignedSubject: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-slate-50"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                  >
                    Adminni Qo'shish
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </EgaLayout>
  );
};
