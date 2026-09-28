import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  Users,
  MapPin,
  Package,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Award,
  Brain
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../i18n/translator';
import { clsx } from 'clsx';

interface EgaSidebarProps {
  isCollapsed: boolean;
}

export const EgaSidebar: React.FC<EgaSidebarProps> = ({ isCollapsed }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'uz';

  const menuGroups = [
    {
      title: translateText('UMUMIY', currentLang),
      items: [
        { label: translateText('Boshqaruv paneli', currentLang), path: '/ega', icon: LayoutDashboard },
        { label: translateText('Olimpiadalar', currentLang), path: '/ega/competitions', icon: Trophy },
        { label: translateText('Daraja Testlari (O\'tgan Yillar)', currentLang), path: '/ega/level-tests', icon: Brain },
        { label: translateText('Baholash Moduli (Rasch)', currentLang), path: '/ega/baholash', icon: Award },
        { label: translateText('Reytinglar', currentLang), path: '/ega/leaderboard', icon: Award },
        { label: translateText('Foydalanuvchilar', currentLang), path: '/ega/users', icon: Users },
        { label: translateText('Hududlar', currentLang), path: '/ega/locations', icon: MapPin },
        { label: translateText('To\'lovlar', currentLang), path: '/ega/finance', icon: CreditCard },
        { label: translateText('Xabarnomalar', currentLang), path: '/ega/notifications', icon: Bell },
        { label: translateText('Yordam xizmati', currentLang), path: '/ega/support', icon: HelpCircle },
        { label: translateText('Paketlar', currentLang), path: '/ega/packages', icon: Package },
        { label: translateText('Kiberxavfsizlik', currentLang), path: '/ega/security', icon: ShieldAlert },
      ]
    }
  ];

  return (
    <aside
      className={clsx(
        "h-screen sticky top-0 shrink-0 flex flex-col justify-between z-30 shadow-xl overflow-x-hidden overflow-y-auto custom-scrollbar font-sans select-none bg-[#0B1120] border-r border-[#1E293B] text-[#F1F5F9]",
        isCollapsed ? "w-20 p-3" : "w-[260px] p-4"
      )}
    >
      <div className="space-y-6">
        
        <div
          className={clsx(
            "pb-3 border-b border-[#1E293B] flex items-center",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link to="/ega" className="flex items-center gap-3 overflow-hidden group">
            <div className="w-9 h-9 rounded-xl bg-[#F59E0B] text-slate-950 font-black flex items-center justify-center text-sm shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-extrabold tracking-wider text-[#F59E0B] uppercase leading-none truncate">
                  KHISO ADMIN
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase mt-1 text-[#94A3B8] truncate">
                  Control System
                </span>
              </div>
            )}
          </Link>
        </div>

        
        <div className="space-y-5">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] uppercase font-bold tracking-widest mb-1.5 text-[#64748B]">
                  {group.title}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path || (item.path !== '/ega' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.label : undefined}
                    className={clsx(
                      "flex items-center gap-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150",
                      isCollapsed ? "px-0 justify-center" : "px-3",
                      active
                        ? "bg-[#3B82F6] text-white font-bold shadow-md shadow-[#3B82F6]/20"
                        : "text-[#94A3B8] hover:bg-[#111827] hover:text-[#F1F5F9]"
                    )}
                  >
                    <Icon className={clsx("w-4 h-4 shrink-0", active ? "text-white" : "text-[#94A3B8]")} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      
      <div className="pt-4 border-t border-[#1E293B]">
        <button
          onClick={logout}
          title={isCollapsed ? translateText('Chiqish', currentLang) : undefined}
          className={clsx(
            "w-full flex items-center gap-3 py-2 rounded-lg text-xs font-semibold text-[#94A3B8] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors cursor-pointer",
            isCollapsed ? "px-0 justify-center" : "px-3"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{translateText('Chiqish', currentLang)}</span>}
        </button>
      </div>
    </aside>
  );
};
