import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, LogOut, Menu, X, Trophy, Award, Home, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { Logo } from './Logo';

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { to: '/olympiads', label: 'Olympiads', icon: <Trophy className="w-4 h-4" /> },
    { to: '/leaderboard', label: 'Leaderboard', icon: <Award className="w-4 h-4" /> },
    { to: '/verify/NO-2026-MATH-8921', label: 'Verify Certificate', icon: <CheckCircle className="w-4 h-4" /> },
    { to: '/about', label: 'About Us', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B1120] border-b border-[#1E293B] text-[#F1F5F9] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        
        <div className="shrink-0 flex items-center">
          <Link to="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
            <Logo size="md" lightText />
          </Link>
        </div>

        
        <nav className="hidden lg:flex items-center gap-7 justify-center">
          {navLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors duration-150 py-1 ${
                  active
                    ? 'text-[#3B82F6] font-semibold border-b-2 border-[#3B82F6]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        
        <div className="hidden lg:flex items-center gap-4">
          <LanguageSwitcher />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              
              <Link to="/dashboard">
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium"
                  leftIcon={<LayoutDashboard className="w-4 h-4" />}
                >
                  Dashboard
                </Button>
              </Link>

              <div className="flex items-center gap-2.5 pl-3 border-l border-[#1E293B]">
                
                <Link to="/profile" title={user.fullName || 'User Profile'}>
                  <Avatar name={user.fullName || 'User'} src={user.avatarUrl} size="sm" />
                </Link>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#1E293B] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link to="/auth/login">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E293B]"
                >
                  Kirish
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium"
                >
                  Ro'yxatdan o'tish
                </Button>
              </Link>
            </div>
          )}
        </div>

        
        <div className="lg:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg border border-[#1E293B] bg-[#111827] text-[#F1F5F9] hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#F59E0B]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bg-[#0B1120]/95 backdrop-blur-xl border-b border-[#1E293B] p-5 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto z-50">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#1E293B] text-[#3B82F6] font-semibold'
                      : 'text-[#94A3B8] hover:bg-[#111827] hover:text-[#F1F5F9]'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {isAuthenticated && user ? (
            <div className="pt-3 border-t border-[#1E293B] space-y-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30 text-sm font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
                <Avatar name={user.fullName || 'User'} src={user.avatarUrl} size="sm" />
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#94A3B8] hover:bg-[#111827] hover:text-[#F1F5F9]"
              >
                <span>Profil Sozlamalari</span>
              </Link>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-2"
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Chiqish
              </Button>
            </div>
          ) : (
            <div className="pt-3 border-t border-[#1E293B] flex flex-col gap-2">
              <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" variant="outline" className="w-full">
                  Kirish
                </Button>
              </Link>
              <Link to="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" variant="primary" className="w-full">
                  Ro'yxatdan o'tish
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
