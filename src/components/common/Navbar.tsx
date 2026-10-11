import React, { useState, useEffect } from 'react';
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { to: '/', label: 'Bosh sahifa', icon: <Home className="w-4 h-4" /> },
    { to: '/olympiads', label: 'Olimpiadalar', icon: <Trophy className="w-4 h-4" /> },
    { to: '/leaderboard', label: 'Reyting', icon: <Award className="w-4 h-4" /> },
    { to: '/verify-certificate', label: 'Sertifikat tekshirish', icon: <CheckCircle className="w-4 h-4" /> },
    { to: '/about', label: 'Biz haqimizda', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 select-none ${
        isScrolled
          ? 'py-2 bg-[#070b14]/85 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/40'
          : 'py-3.5 bg-[#070b14]/60 backdrop-blur-md border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="shrink-0 flex items-center">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-95 transition-opacity focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl p-1"
            aria-label="Ibn Sino School Bosh sahifa"
          >
            <Logo size="md" lightText />
          </Link>
        </div>

        {/* Central Floating Navigation Pill */}
        <nav
          aria-label="Asosiy navigatsiya"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-inner"
        >
          {navLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Cluster */}
        <div className="hidden lg:flex items-center gap-3">
          <LanguageSwitcher />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              <Link to="/dashboard">
                <Button
                  size="sm"
                  variant="primary"
                  className="font-bold shadow-md shadow-emerald-500/20"
                  leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
                >
                  Dashboard
                </Button>
              </Link>

              <div className="flex items-center gap-2 pl-2.5 border-l border-white/10">
                <Link
                  to="/profile"
                  title={user.fullName || 'User Profile'}
                  className="focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full"
                >
                  <Avatar name={user.fullName || 'User'} src={user.avatarUrl} size="sm" />
                </Link>
                <button
                  onClick={logout}
                  title="Chiqish"
                  aria-label="Tizimdan chiqish"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth/login">
                <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white font-medium">
                  Kirish
                </Button>
              </Link>
              <Link to="/auth/register">
                <Button size="sm" variant="primary" className="font-bold shadow-md shadow-emerald-500/20">
                  Ro'yxatdan o'tish
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="lg:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Menyuni yopish" : "Menyuni ochish"}
            className="p-2 rounded-xl border border-white/10 bg-slate-900/70 text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobil navigatsiya menyusi"
          className="lg:hidden fixed inset-x-0 top-[61px] bg-[#070b14]/95 backdrop-blur-2xl border-b border-white/10 p-5 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto z-50 animate-fade-in-up"
        >
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
                      ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <span className={active ? 'text-emerald-400' : 'text-slate-400'}>{link.icon}</span>
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
                  <span>Boshqaruv paneli (Dashboard)</span>
                </div>
                <Avatar name={user.fullName || 'User'} src={user.avatarUrl} size="sm" />
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white"
              >
                <span>Profil sozlamalari</span>
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
                Tizimdan chiqish
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
                <Button size="sm" variant="primary" className="w-full font-bold">
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

