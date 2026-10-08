import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  Users,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  Package,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Award,
  Calculator,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { translateText } from '../../i18n/translator';
import { clsx } from 'clsx';

interface EgaNavbarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const EgaNavbar: React.FC<EgaNavbarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const { i18n } = useTranslation();

  const currentLang = (i18n.language || 'uz').toUpperCase() as 'UZ' | 'EN' | 'RU';

  const changeLanguage = (newLang: 'UZ' | 'EN' | 'RU') => {
    const langCode = newLang.toLowerCase();
    i18n.changeLanguage(langCode);
    try {
      localStorage.setItem('next_olymp_lang', langCode);
    } catch (e) {
      console.error('Failed to save language in localStorage', e);
    }
  };

  const getPageTitle = () => {
    if (path === '/ega' || path === '/ega/dashboard') {
      return { title: translateText('Boshqaruv paneli', currentLang.toLowerCase()), icon: LayoutDashboard };
    }
    if (path.startsWith('/ega/competitions')) {
      return { title: translateText('Olimpiadalar', currentLang.toLowerCase()), icon: Trophy };
    }
    if (path.startsWith('/ega/baholash')) {
      return { title: translateText('Baholash Moduli (Rasch)', currentLang.toLowerCase()), icon: Calculator };
    }
    if (path.startsWith('/ega/leaderboard')) {
      return { title: translateText('Reytinglar', currentLang.toLowerCase()), icon: Award };
    }
    if (path.startsWith('/ega/users')) {
      return { title: translateText('Foydalanuvchilar', currentLang.toLowerCase()), icon: Users };
    }
    if (path.startsWith('/ega/locations')) {
      return { title: translateText('Hududlar', currentLang.toLowerCase()), icon: MapPin };
    }
    if (path.startsWith('/ega/finance')) {
      return { title: translateText('To\'lovlar', currentLang.toLowerCase()), icon: CreditCard };
    }
    if (path.startsWith('/ega/notifications')) {
      return { title: translateText('Xabarnomalar', currentLang.toLowerCase()), icon: Bell };
    }
    if (path.startsWith('/ega/support')) {
      return { title: translateText('Yordam xizmati', currentLang.toLowerCase()), icon: HelpCircle };
    }
    if (path.startsWith('/ega/packages')) {
      return { title: translateText('Paketlar', currentLang.toLowerCase()), icon: Package };
    }
    if (path.startsWith('/ega/security')) {
      return { title: translateText('Kiberxavfsizlik', currentLang.toLowerCase()), icon: ShieldAlert };
    }
    return { title: translateText('Boshqaruv paneli', currentLang.toLowerCase()), icon: LayoutDashboard };
  };

  const pageInfo = getPageTitle();
  const PageIcon = pageInfo.icon;

  return (
    <header className="sticky top-0 z-20 w-full h-16 px-6 flex items-center justify-between shadow-md font-sans bg-zinc-900/80 backdrop-blur-md border-b border-white/10 text-zinc-100 shrink-0">
      
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
          <PageIcon className="w-4 h-4 text-emerald-400" />
          <span>{pageInfo.title}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-xl border border-white/10 bg-zinc-950/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
          title="Menyuni ko'rsatish / berkitish"
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        <div className="inline-flex items-center p-1 rounded-xl border border-white/10 bg-zinc-950/80 text-xs font-semibold">
          {(['UZ', 'EN', 'RU'] as const).map((l) => (
            <button
              key={l}
              onClick={() => changeLanguage(l)}
              className={clsx(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                currentLang === l
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-100"
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/10 bg-zinc-950/80 text-xs font-bold text-zinc-100">
          <User className="w-4 h-4 text-emerald-400" />
          <span>{user?.fullName || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
};
