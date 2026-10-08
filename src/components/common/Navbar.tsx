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
    { to: '/verify/IS-2026-MED-8921', label: 'Verify Certificate', icon: <CheckCircle className="w-4 h-4" /> },
    { to: '/about', label: 'About Us', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 text-zinc-100 select-none">
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
                    ? 'text-emerald-400 font-semibold border-b-2 border-emerald-500'
                    : 'text-zinc-400 hover:text-zinc-100'
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
                  leftIcon={<LayoutDashboard className="w-4 h-4" />}
                >
                  Dashboard
                </Button>
              </Link>

              <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
                
                <Link to="/profile" title={user.fullName || 'User Profile'}>
                  <Avatar name={user.fullName || 'User'} src={user.avatarUrl} size="sm" />
                </Link>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 transition-colors cursor-pointer"
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
                >
                  Kirish
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button
                  size="sm"
                  variant="primary"
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
            className="p-2 rounded-xl border border-white/10 bg-zinc-900/60 text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bg-zinc-950/95 backdrop-blur-xl border-b border-white/10 p-5 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto z-50">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20'
                      : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-100'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {isAuthenticated && user ? (
            <div className="pt-3 border-t border-white/10 space-y-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-semibold"
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
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
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
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
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
