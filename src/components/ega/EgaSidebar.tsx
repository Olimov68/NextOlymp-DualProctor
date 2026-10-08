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
        "h-screen sticky top-0 shrink-0 flex flex-col justify-between z-30 shadow-2xl overflow-x-hidden overflow-y-auto custom-scrollbar font-sans select-none bg-zinc-950 border-r border-white/10 text-zinc-100",
        isCollapsed ? "w-20 p-3" : "w-[260px] p-4"
      )}
    >
      <div className="space-y-6">
        <div
          className={clsx(
            "pb-3.5 border-b border-white/10 flex items-center",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link to="/ega" className="flex items-center gap-3 overflow-hidden group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-extrabold tracking-wider bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent uppercase leading-none truncate">
                  KHISO ADMIN
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase mt-1 text-zinc-400 truncate">
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
                <div className="px-3 text-[10px] uppercase font-bold tracking-widest mb-1.5 text-zinc-400">
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
                      "flex items-center gap-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150",
                      isCollapsed ? "px-0 justify-center" : "px-3",
                      active
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20"
                        : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100"
                    )}
                  >
                    <Icon className={clsx("w-4 h-4 shrink-0", active ? "text-white" : "text-zinc-400")} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <button
          onClick={logout}
          title={isCollapsed ? translateText('Chiqish', currentLang) : undefined}
          className={clsx(
            "w-full flex items-center gap-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer",
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
