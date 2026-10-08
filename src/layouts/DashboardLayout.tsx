import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { Avatar } from '../components/common/Avatar';
import { useAuth } from '../hooks/useAuth';
import { User, LogOut, ChevronDown, Award, Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    navigate('/');
  };

  const getRoleLabel = (role?: string) => {
    if (role === 'teacher') return 'O\'qituvchi';
    return 'O\'quvchi / Ishtirokchi';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      
      <div className="hidden lg:block shrink-0 h-full">
        <Sidebar />
      </div>

      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          
          <div className="relative z-10 w-[280px] max-w-[85vw] h-full bg-zinc-950 shadow-2xl flex flex-col border-r border-white/10">
            <div className="p-3 flex justify-end border-b border-white/10">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center border border-white/10"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0 bg-zinc-950 custom-scrollbar">
        
        <header className="sticky top-0 z-20 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl bg-zinc-900 text-zinc-400 hover:text-zinc-100 border border-white/10 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5 text-emerald-400" />
            </button>

            <span className="text-sm font-bold text-zinc-100 truncate">
              Ibn Sino Platform
            </span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 transition-all cursor-pointer select-none group"
                >
                  <Avatar name={user.fullName || 'User'} src={user.avatarUrl} size="sm" />
                  <div className="text-left hidden sm:flex flex-col">
                    <span className="text-xs font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors leading-tight">
                      {user.fullName}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium leading-none mt-0.5">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-2xl py-2 z-50">
                    
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-xs font-bold text-zinc-100 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {user.email || user.phone || 'Foydalanuvchi hisobi'}
                      </p>
                      <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {getRoleLabel(user.role)}
                      </div>
                    </div>

                    
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-zinc-200 hover:bg-white/5 hover:text-emerald-400 transition-colors"
                      >
                        <User className="w-4 h-4 text-zinc-400" />
                        <span>Profil sozlamalari</span>
                      </Link>

                      <Link
                        to="/certificates"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-zinc-200 hover:bg-white/5 hover:text-emerald-400 transition-colors"
                      >
                        <Award className="w-4 h-4 text-zinc-400" />
                        <span>Sertifikatlar</span>
                      </Link>
                    </div>

                    
                    <div className="pt-1 border-t border-white/10">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Tizimdan chiqish</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        
        <main className="p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto flex-1">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
