import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  BarChart3,
  History,
  Award,
  Users,
  Home,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from './Logo';
import { clsx } from 'clsx';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const role = user.role;

  
  const studentLinks = [
    { label: 'Boshqaruv', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Olimpiadalar', path: '/student/olympiads', icon: Trophy },
    { label: 'Darajani Sinash', path: '/student/level-test', icon: Brain },
    { label: 'Milliy Sertifikat', path: '/dashboard/milliy-sertifikat', icon: Award },
    { label: 'Reyting', path: '/student/leaderboard', icon: BarChart3 },
    { label: 'Natijalar tarixi', path: '/results', icon: History },
    { label: 'Sertifikatlar', path: '/certificates', icon: Award },
    { label: 'Murojaat & Yordam', path: '/student/support', icon: HelpCircle },
  ];

  
  const teacherLinks = [
    { label: 'Kabinet', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'Milliy Sertifikat', path: '/dashboard/milliy-sertifikat', icon: Award },
    { label: 'O\'quvchilar', path: '/teacher/olympiads', icon: Users },
    { label: 'Olimpiadalar', path: '/student/olympiads', icon: Trophy },
    { label: 'Reyting', path: '/student/leaderboard', icon: BarChart3 },
  ];

  const links = role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <aside
      className={clsx(
        "sticky top-0 h-screen bg-[#0B1120] border-r border-[#1E293B] text-[#F1F5F9] p-4 flex flex-col justify-between shrink-0 shadow-xl transition-all duration-300 z-30 select-none overflow-x-hidden overflow-y-auto custom-scrollbar",
        isCollapsed ? "w-20" : "w-[260px]"
      )}
    >
      <div className="space-y-4">
        
        <div
          className={clsx(
            "pb-3 border-b border-[#1E293B] flex items-center transition-all",
            isCollapsed ? "flex-col gap-2 justify-center text-center" : "justify-between"
          )}
        >
          <Link
            to="/"
            className={clsx(
              "flex items-center overflow-hidden hover:opacity-90 transition-opacity",
              isCollapsed ? "justify-center" : "gap-2"
            )}
            title="Next Olymp Asosiy Sahifa"
          >
            <Logo showText={!isCollapsed} lightText size={isCollapsed ? "sm" : "md"} />
          </Link>

          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-7 h-7 rounded-lg bg-[#111827] hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#1E293B] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={isCollapsed ? "Menyuni kengaytirish" : "Menyuni kichraytirish"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-[#3B82F6]" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-[#3B82F6]" />
            )}
          </button>
        </div>

        
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onCloseMobile}
                title={isCollapsed ? link.label : undefined}
                className={clsx(
                  "flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                  isCollapsed ? "px-0 justify-center" : "px-3.5",
                  active
                    ? "bg-[#3B82F6] text-white font-semibold shadow-md shadow-[#3B82F6]/20"
                    : "text-[#94A3B8] hover:bg-[#111827] hover:text-[#F1F5F9]"
                )}
              >
                <Icon className={clsx("w-4 h-4 shrink-0", active ? "text-white" : "text-[#94A3B8]")} />
                {!isCollapsed && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      
      <div className="space-y-1.5 pt-4 border-t border-[#1E293B] mt-auto">
        <Link
          to="/"
          title={isCollapsed ? "Asosiy saytga qaytish" : undefined}
          className={clsx(
            "flex items-center gap-3 py-2 rounded-lg text-xs font-medium text-[#94A3B8] hover:bg-[#111827] hover:text-[#F1F5F9] transition-colors",
            isCollapsed ? "px-0 justify-center" : "px-3.5"
          )}
        >
          <Home className="w-4 h-4 text-[#3B82F6] shrink-0" />
          {!isCollapsed && <span>Asosiy sayt</span>}
        </Link>

        <button
          onClick={logout}
          title={isCollapsed ? "Tizimdan chiqish" : undefined}
          className={clsx(
            "w-full flex items-center gap-3 py-2 rounded-lg text-xs font-medium text-[#94A3B8] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors cursor-pointer",
            isCollapsed ? "px-0 justify-center" : "px-3.5"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Chiqish</span>}
        </button>
      </div>
    </aside>
  );
};
