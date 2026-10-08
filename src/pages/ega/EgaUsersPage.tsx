import React, { useState, useMemo } from 'react';
import { EgaLayout } from '../../components/ega/EgaLayout';
import { useUserStore } from '../../store/useUserStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../i18n/translator';
import { UserItem } from '../../data/initialUsers';
import { clsx } from 'clsx';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  FileSpreadsheet,
  Columns,
  Trash2,
  Pencil,
  X,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const EgaUsersPage: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, toggleUserStatus } = useUserStore();
  const { viloyatlar, tumanlar } = useLocationStore();
  const { theme } = useThemeStore();
  const { i18n } = useTranslation();

  const isDark = theme === 'dark';
  const currentLang = i18n.language || 'uz';
  const t = (text: string) => translateText(text, currentLang);

  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    fullName: true,
    email: true,
    gender: true,
    phone: true,
    role: true,
    package: true,
    status: true,
    region: true,
    district: true,
    school: true,
    grade: true,
    createdAt: true,
    participation: true,
    actions: true
  });
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  
  const [newFullName, setNewFullName] = useState('');
  const [newGender, setNewGender] = useState<'male' | 'female'>('male');
  const [newPhone, setNewPhone] = useState('+998 ');
  const [newRole, setNewRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [newPackage, setNewPackage] = useState<'Bepul' | 'Standard' | 'Pro' | 'VIP'>('Bepul');
  const [newRegion, setNewRegion] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newSchool, setNewSchool] = useState('');
  const [newGrade, setNewGrade] = useState<number>(9);

  
  const totalUsersCount = users.length;
  const maleUsersCount = useMemo(() => users.filter((u) => u.gender === 'male').length, [users]);
  const femaleUsersCount = useMemo(() => users.filter((u) => u.gender === 'female').length, [users]);

  
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.school.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesGender = genderFilter === 'all' || u.gender === genderFilter;

      return matchesSearch && matchesRole && matchesGender;
    });
  }, [users, searchTerm, roleFilter, genderFilter]);

  
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  
  const availableDistricts = useMemo(() => {
    if (!newRegion) return tumanlar;
    return tumanlar.filter((t) => t.viloyatNomi.toLowerCase() === newRegion.toLowerCase());
  }, [tumanlar, newRegion]);

  const editAvailableDistricts = useMemo(() => {
    if (!editingUser || !editingUser.region) return tumanlar;
    return tumanlar.filter((t) => t.viloyatNomi.toLowerCase() === editingUser.region.toLowerCase());
  }, [tumanlar, editingUser?.region]);

  
  const toggleColumn = (colKey: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [colKey]: !prev[colKey] }));
  };

  
  const handleExportExcel = () => {
    const exportData = filteredUsers.map((u, index) => ({
      '№': index + 1,
      [t('ID')]: u.id,
      [t('F.I.Sh.')]: u.fullName,
      [t('Jins')]: u.gender === 'male' ? t("O'g'il bola") : t("Qiz bola"),
      [t('Telefon')]: u.phone,
      [t('Rol')]: t(u.role === 'student' ? "O'quvchi" : u.role === 'teacher' ? "O'qituvchi" : 'Admin'),
      [t('Paket')]: u.package,
      [t('Holati')]: t(u.status === 'active' ? 'Faol' : 'Bloklangan'),
      [t('Manzil')]: t(u.region),
      [t('Tuman')]: t(u.district),
      [t('Maktab')]: t(u.school),
      [t('Sinf')]: u.grade ? `${u.grade}-${t('sinf')}` : '-',
      [t('Ro\'yxatdan o\'tgan')]: u.createdAt,
      [t('Ishtirok')]: u.participationCount
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'FOYDALANUVCHILAR');
    XLSX.writeFile(workbook, 'Foydalanuvchilar_ruyhati.xlsx');
  };

  
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) return;

    addUser({
      fullName: newFullName.trim(),
      gender: newGender,
      phone: newPhone.trim(),
      role: newRole,
      package: newPackage,
      status: 'active',
      region: newRegion || 'Toshkent shahri',
      district: newDistrict || 'Yunusobod tumani',
      school: newSchool || '1-sonli maktab',
      grade: newRole === 'student' ? newGrade : undefined
    });

    setNewFullName('');
    setNewPhone('+998 ');
    setIsAddModalOpen(false);
  };

  
  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.fullName.trim()) return;

    updateUser(editingUser.id, {
      fullName: editingUser.fullName,
      gender: editingUser.gender,
      phone: editingUser.phone,
      role: editingUser.role,
      package: editingUser.package,
      region: editingUser.region,
      district: editingUser.district,
      school: editingUser.school,
      grade: editingUser.role === 'student' ? editingUser.grade : undefined
    });

    setEditingUser(null);
  };

  return (
    <EgaLayout>
      <div className="space-y-4 font-sans text-xs">
        
        <div
          className={clsx(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border shadow-sm transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div>
            <h1 className={clsx("text-base font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
              <Users className="w-4 h-4 text-amber-500" />
              {t("Foydalanuvchilar Boshqaruvi")}
            </h1>
            <p className={clsx("text-[11px] mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
              {t("Platformadagi barcha foydalanuvchilar, o'quvchilar va o'qituvchilar ro'yxati")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Foydalanuvchilar ro'yxatini Excel faylda yuklab olish"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{t("Excel'da yuklab olish")}</span>
            </button>

            
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("Foydalanuvchi qo'shish")}</span>
            </button>
          </div>
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div
            className={clsx(
              "p-4 rounded-xl border flex items-center justify-between shadow-xs transition-colors",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div>
              <p className={clsx("text-[11px] font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("Jami Foydalanuvchilar")}
              </p>
              <h3 className={clsx("text-xl font-black mt-1", isDark ? "text-white" : "text-slate-900")}>
                {totalUsersCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          
          <div
            className={clsx(
              "p-4 rounded-xl border flex items-center justify-between shadow-xs transition-colors",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div>
              <p className={clsx("text-[11px] font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("O'g'il bolalar")}
              </p>
              <h3 className={clsx("text-xl font-black mt-1 text-blue-500")}>
                {maleUsersCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          
          <div
            className={clsx(
              "p-4 rounded-xl border flex items-center justify-between shadow-xs transition-colors",
              isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
            )}
          >
            <div>
              <p className={clsx("text-[11px] font-medium uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("Qiz bolalar")}
              </p>
              <h3 className={clsx("text-xl font-black mt-1 text-pink-500")}>
                {femaleUsersCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-500 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        
        <div
          className={clsx(
            "flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-xl border transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={t("Qidiruv...")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={clsx(
                "w-full rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none border transition-colors",
                isDark
                  ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white placeholder:text-slate-500"
                  : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900 placeholder:text-slate-400"
              )}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-end">
            
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={clsx(
                "rounded-lg px-2.5 py-1.5 text-xs outline-none border transition-colors cursor-pointer",
                isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
              )}
            >
              <option value="all">{t("Barcha rollar")}</option>
              <option value="student">{t("O'quvchi")}</option>
              <option value="teacher">{t("O'qituvchi")}</option>
            </select>

            
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={clsx(
                "rounded-lg px-2.5 py-1.5 text-xs outline-none border transition-colors cursor-pointer",
                isDark ? "bg-[#091024] border-[#1A2F57] text-white" : "bg-slate-50 border-slate-300 text-slate-900"
              )}
            >
              <option value="all">{t("Barcha jinslar")}</option>
              <option value="male">{t("O'g'il bola")}</option>
              <option value="female">{t("Qiz bola")}</option>
            </select>

            
            <div className="relative">
              <button
                onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                  isDark
                    ? "bg-[#142447] hover:bg-[#1C325E] border-[#1E365E] text-slate-300"
                    : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                )}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>{t("Ustunlar")}</span>
              </button>

              
              {isColumnDropdownOpen && (
                <div
                  className={clsx(
                    "absolute right-0 mt-2 w-48 rounded-xl border shadow-xl p-3 z-30 space-y-1.5 transition-colors",
                    isDark ? "bg-[#0D1832] border-[#1E3563] text-slate-200" : "bg-white border-slate-200 text-slate-800"
                  )}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b mb-2 border-slate-700/50">
                    {t("Ustunlar sozlamasi")}
                  </p>

                  {Object.entries({
                    id: t("ID"),
                    fullName: t("F.I.Sh."),
                    email: t("Email"),
                    gender: t("Jinsi"),
                    phone: t("Telefon"),
                    role: t("Rol"),
                    package: t("Paket"),
                    status: t("Holati"),
                    region: t("Manzil"),
                    district: t("Tuman"),
                    school: t("Maktab"),
                    grade: t("Sinf"),
                    createdAt: t("Ro'yxatdan o'tgan"),
                    participation: t("Ishtirok"),
                    actions: t("Amallar")
                  }).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:text-amber-500 transition-colors select-none"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[key as keyof typeof visibleColumns]}
                        onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                        className="rounded accent-amber-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        
        <div
          className={clsx(
            "rounded-xl border overflow-hidden shadow-sm transition-colors",
            isDark ? "bg-[#0D1832] border-[#182A4D]" : "bg-white border-slate-200"
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={clsx(
                  "text-[11px] uppercase tracking-wider border-b font-semibold",
                  isDark
                    ? "bg-[#101E3C] text-slate-400 border-[#182A4D]"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                )}
              >
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">№</th>
                  {visibleColumns.id && <th className="py-2.5 px-3">{t("ID")}</th>}
                  {visibleColumns.fullName && <th className="py-2.5 px-3">{t("F.I.Sh.")}</th>}
                  {visibleColumns.gender && <th className="py-2.5 px-3">{t("Jinsi")}</th>}
                  {visibleColumns.phone && <th className="py-2.5 px-3">{t("Telefon")}</th>}
                  {visibleColumns.email && <th className="py-2.5 px-3">{t("Email")}</th>}
                  {visibleColumns.role && <th className="py-2.5 px-3">{t("Rol")}</th>}
                  {visibleColumns.package && <th className="py-2.5 px-3">{t("Paket")}</th>}
                  {visibleColumns.status && <th className="py-2.5 px-3">{t("Holati")}</th>}
                  {visibleColumns.region && <th className="py-2.5 px-3">{t("Manzil")}</th>}
                  {visibleColumns.district && <th className="py-2.5 px-3">{t("Tuman")}</th>}
                  {visibleColumns.school && <th className="py-2.5 px-3">{t("Maktab")}</th>}
                  {visibleColumns.grade && <th className="py-2.5 px-3">{t("Sinf")}</th>}
                  {visibleColumns.createdAt && <th className="py-2.5 px-3">{t("Ro'yxatdan o'tgan")}</th>}
                  {visibleColumns.participation && <th className="py-2.5 px-3">{t("Ishtirok")}</th>}
                  {visibleColumns.actions && <th className="py-2.5 px-3 text-right">{t("Amallar")}</th>}
                </tr>
              </thead>

              <tbody className={clsx("divide-y", isDark ? "divide-[#152545]" : "divide-slate-200")}>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-8 text-center text-slate-400">
                      {t("Foydalanuvchilar topilmadi")}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u, idx) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                    return (
                      <tr
                        key={u.id}
                        className={clsx("transition-colors", isDark ? "hover:bg-[#132244]" : "hover:bg-slate-50")}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-400 text-[11px] font-mono">
                          {rowNumber}
                        </td>

                        {visibleColumns.id && (
                          <td className={clsx("py-2.5 px-3 font-mono text-[11px]", isDark ? "text-amber-400" : "text-amber-600")}>
                            {u.id}
                          </td>
                        )}

                        {visibleColumns.fullName && (
                          <td className={clsx("py-2.5 px-3 font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                            <div
                              className={clsx(
                                "w-2 h-2 rounded-full shrink-0",
                                u.gender === 'female' ? "bg-pink-400" : "bg-blue-400"
                              )}
                            />
                            <span>{u.fullName}</span>
                          </td>
                        )}

                        {visibleColumns.gender && (
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={clsx(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border",
                                u.gender === 'female'
                                  ? isDark
                                    ? "bg-pink-950/70 text-pink-300 border-pink-800/60"
                                    : "bg-pink-50 text-pink-700 border-pink-200"
                                  : isDark
                                    ? "bg-blue-950/70 text-blue-300 border-blue-800/60"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                              )}
                            >
                              {u.gender === 'female' ? "👧 " + t("Qiz bola") : "👦 " + t("O'g'il bola")}
                            </span>
                          </td>
                        )}

                        {visibleColumns.phone && (
                          <td className={clsx("py-2.5 px-3 font-mono text-[11px]", isDark ? "text-slate-300" : "text-slate-700")}>
                            {u.phone}
                          </td>
                        )}

                        {visibleColumns.email && (
                          <td className={clsx("py-2.5 px-3 font-mono text-[11px]", isDark ? "text-cyan-400" : "text-cyan-700")}>
                            {u.email || (u.phone ? `${u.phone.replace(/\D/g, '')}@ibnsino.uz` : 'user@ibnsino.uz')}
                          </td>
                        )}

                        {visibleColumns.role && (
                          <td className="py-2.5 px-3">
                            <span
                              className={clsx(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                                u.role === 'student'
                                  ? isDark
                                    ? "bg-blue-950/70 text-blue-300 border-blue-800/60"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                  : u.role === 'teacher'
                                  ? isDark
                                    ? "bg-purple-950/70 text-purple-300 border-purple-800/60"
                                    : "bg-purple-50 text-purple-700 border-purple-200"
                                  : isDark
                                  ? "bg-amber-950/70 text-amber-300 border-amber-800/60"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              )}
                            >
                              {t(u.role === 'student' ? "O'quvchi" : u.role === 'teacher' ? "O'qituvchi" : "Admin")}
                            </span>
                          </td>
                        )}

                        {visibleColumns.package && (
                          <td className="py-2.5 px-3">
                            <span
                              className={clsx(
                                "px-2 py-0.5 rounded text-[11px] font-bold border",
                                u.package === 'VIP'
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                  : u.package === 'Pro'
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                  : u.package === 'Standard'
                                  ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                                  : "bg-slate-500/20 text-slate-400 border-slate-500/40"
                              )}
                            >
                              {u.package}
                            </span>
                          </td>
                        )}

                        {visibleColumns.status && (
                          <td className="py-2.5 px-3">
                            <span
                              className={clsx(
                                "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border",
                                u.status === 'active'
                                  ? "bg-emerald-950/70 text-emerald-400 border-emerald-800/60"
                                  : "bg-rose-950/70 text-rose-400 border-rose-800/60"
                              )}
                            >
                              {t(u.status === 'active' ? 'Faol' : 'Bloklangan')}
                            </span>
                          </td>
                        )}

                        {visibleColumns.region && (
                          <td className={clsx("py-2.5 px-3", isDark ? "text-slate-300" : "text-slate-700")}>
                            {t(u.region)}
                          </td>
                        )}

                        {visibleColumns.district && (
                          <td className={clsx("py-2.5 px-3", isDark ? "text-slate-300" : "text-slate-700")}>
                            {t(u.district)}
                          </td>
                        )}

                        {visibleColumns.school && (
                          <td className={clsx("py-2.5 px-3", isDark ? "text-slate-300" : "text-slate-700")}>
                            {t(u.school)}
                          </td>
                        )}

                        {visibleColumns.grade && (
                          <td className={clsx("py-2.5 px-3 font-semibold", isDark ? "text-amber-300" : "text-amber-700")}>
                            {u.grade ? `${u.grade}-${t('sinf')}` : '-'}
                          </td>
                        )}

                        {visibleColumns.createdAt && (
                          <td className="py-2.5 px-3 text-slate-400 text-[11px] font-mono">
                            {u.createdAt}
                          </td>
                        )}

                        {visibleColumns.participation && (
                          <td className="py-2.5 px-3">
                            <span className="bg-indigo-950/70 text-indigo-300 px-2 py-0.5 rounded text-[11px] font-bold border border-indigo-800/50">
                              {u.participationCount} ta olimpiada
                            </span>
                          </td>
                        )}

                        {visibleColumns.actions && (
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingUser(u)}
                                className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                                title={t("Tahrirlash")}
                              >
                                <Pencil className="w-3 h-3" />
                                <span>{t("Tahrirlash")}</span>
                              </button>

                              <button
                                onClick={() => toggleUserStatus(u.id)}
                                className={clsx(
                                  "px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all border shrink-0",
                                  u.status === 'active'
                                    ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30"
                                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                )}
                                title={u.status === 'active' ? t("Bloklash") : t("Blokdan chiqarish")}
                              >
                                <ShieldAlert className="w-3 h-3" />
                                <span>{u.status === 'active' ? t("Bloklash") : t("Ochish")}</span>
                              </button>

                              <button
                                onClick={() => deleteUser(u.id)}
                                className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                                title={t("O'chirish")}
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{t("O'chirish")}</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          
          {totalPages > 1 && (
            <div
              className={clsx(
                "flex items-center justify-between p-3 border-t text-xs font-semibold transition-colors",
                isDark ? "bg-[#101E3C] border-[#182A4D] text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
              )}
            >
              <div>
                <span>
                  {t("Sahifa")} {currentPage} {t("dan")} {totalPages} ({filteredUsers.length} {t("ta foydalanuvchi")})
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={clsx(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                    isDark ? "bg-[#142447] border-[#1E365E] text-slate-200" : "bg-white border-slate-300 text-slate-800"
                  )}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{t("Oldingisi")}</span>
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={clsx(
                        "w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        currentPage === pNum
                          ? "bg-amber-500 text-slate-950 shadow-sm"
                          : isDark
                          ? "bg-[#142447] hover:bg-[#1C325E] text-slate-300"
                          : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
                      )}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className={clsx(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                    isDark ? "bg-[#142447] border-[#1E365E] text-slate-200" : "bg-white border-slate-300 text-slate-800"
                  )}
                >
                  <span>{t("Keyingisi")}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div
              className={clsx(
                "rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 border transition-colors max-h-[90vh] overflow-y-auto custom-scrollbar",
                isDark ? "bg-[#0D1832] border-[#1E3563]" : "bg-white border-slate-200"
              )}
            >
              <div className={clsx("flex items-center justify-between border-b pb-3", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                <h3 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <Plus className="w-4 h-4 text-amber-500" />
                  {t("Yangi Foydalanuvchi Qo'shish")}
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("F.I.Sh. (To'liq ismingiz) *")}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Azizbek Karimov"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>

                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Jins *")}
                    </label>
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value as any)}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      <option value="male">{t("O'g'il bola")}</option>
                      <option value="female">{t("Qiz bola")}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Telefon *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>

                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Rol *")}
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      <option value="student">{t("O'quvchi")}</option>
                      <option value="teacher">{t("O'qituvchi")}</option>
                      <option value="admin">{t("Admin")}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Viloyat *")}
                    </label>
                    <select
                      required
                      value={newRegion}
                      onChange={(e) => {
                        setNewRegion(e.target.value);
                        setNewDistrict('');
                      }}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      <option value="">{t("Viloyatni tanlang...")}</option>
                      {viloyatlar.map((v) => (
                        <option key={v.id} value={v.nomi}>
                          {t(v.nomi)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Tuman *")}
                    </label>
                    <select
                      required
                      value={newDistrict}
                      onChange={(e) => setNewDistrict(e.target.value)}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      <option value="">{t("Tumanni tanlang...")}</option>
                      {availableDistricts.map((tum) => (
                        <option key={tum.id} value={tum.nomi}>
                          {t(tum.nomi)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Maktab *")}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: 12-sonli maktab"
                      value={newSchool}
                      onChange={(e) => setNewSchool(e.target.value)}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>

                  {newRole === 'student' && (
                    <div>
                      <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                        {t("Sinf")}
                      </label>
                      <select
                        value={newGrade}
                        onChange={(e) => setNewGrade(Number(e.target.value))}
                        className={clsx(
                          "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                          isDark
                            ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                            : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                        )}
                      >
                        {Array.from({ length: 11 }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}-{t("sinf")}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Paket")}
                  </label>
                  <select
                    value={newPackage}
                    onChange={(e) => setNewPackage(e.target.value as any)}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  >
                    <option value="Bepul">Bepul</option>
                    <option value="Standard">Standard</option>
                    <option value="Pro">Pro</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>

                <div className={clsx("flex justify-end gap-2 pt-2 border-t", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
                      isDark
                        ? "bg-[#162748] hover:bg-[#1D325C] text-slate-300 border-[#1E365E]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                    )}
                  >
                    {t("Bekor qilish")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md"
                  >
                    {t("Saqlash")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        
        {editingUser && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div
              className={clsx(
                "rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 border transition-colors max-h-[90vh] overflow-y-auto custom-scrollbar",
                isDark ? "bg-[#0D1832] border-[#1E3563]" : "bg-white border-slate-200"
              )}
            >
              <div className={clsx("flex items-center justify-between border-b pb-3", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                <h3 className={clsx("text-sm font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                  <Pencil className="w-4 h-4 text-blue-500" />
                  {t("Foydalanuvchini tahrirlash")} ({editingUser.id})
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditUserSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("F.I.Sh. *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingUser.fullName}
                      onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>

                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Jins *")}
                    </label>
                    <select
                      value={editingUser.gender}
                      onChange={(e) => setEditingUser({ ...editingUser, gender: e.target.value as any })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      <option value="male">{t("O'g'il bola")}</option>
                      <option value="female">{t("Qiz bola")}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Telefon *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>

                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Rol *")}
                    </label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      <option value="student">{t("O'quvchi")}</option>
                      <option value="teacher">{t("O'qituvchi")}</option>
                      <option value="admin">{t("Admin")}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Viloyat *")}
                    </label>
                    <select
                      required
                      value={editingUser.region}
                      onChange={(e) => setEditingUser({ ...editingUser, region: e.target.value })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      {viloyatlar.map((v) => (
                        <option key={v.id} value={v.nomi}>
                          {t(v.nomi)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Tuman *")}
                    </label>
                    <select
                      required
                      value={editingUser.district}
                      onChange={(e) => setEditingUser({ ...editingUser, district: e.target.value })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    >
                      {editAvailableDistricts.map((tum) => (
                        <option key={tum.id} value={tum.nomi}>
                          {t(tum.nomi)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      {t("Maktab *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingUser.school}
                      onChange={(e) => setEditingUser({ ...editingUser, school: e.target.value })}
                      className={clsx(
                        "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                        isDark
                          ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                          : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                      )}
                    />
                  </div>

                  {editingUser.role === 'student' && (
                    <div>
                      <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                        {t("Sinf")}
                      </label>
                      <select
                        value={editingUser.grade || 9}
                        onChange={(e) => setEditingUser({ ...editingUser, grade: Number(e.target.value) })}
                        className={clsx(
                          "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                          isDark
                            ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                            : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                        )}
                      >
                        {Array.from({ length: 11 }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}-{t("sinf")}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className={clsx("block text-[11px] font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                    {t("Paket")}
                  </label>
                  <select
                    value={editingUser.package}
                    onChange={(e) => setEditingUser({ ...editingUser, package: e.target.value as any })}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2 text-xs outline-none border",
                      isDark
                        ? "bg-[#091024] border-[#1A2F57] focus:border-amber-400 text-white"
                        : "bg-slate-50 border-slate-300 focus:border-amber-500 text-slate-900"
                    )}
                  >
                    <option value="Bepul">Bepul</option>
                    <option value="Standard">Standard</option>
                    <option value="Pro">Pro</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>

                <div className={clsx("flex justify-end gap-2 pt-2 border-t", isDark ? "border-[#182A4D]" : "border-slate-200")}>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
                      isDark
                        ? "bg-[#162748] hover:bg-[#1D325C] text-slate-300 border-[#1E365E]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                    )}
                  >
                    {t("Bekor qilish")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-md"
                  >
                    {t("Saqlash")}
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
