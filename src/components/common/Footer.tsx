import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B1120] text-[#94A3B8] border-t border-[#1E293B] pt-[60px] pb-[20px] w-full font-sans select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          
          <div className="space-y-4">
            <Link to="/" className="inline-block hover:opacity-95 transition-opacity">
              <Logo size="md" lightText />
            </Link>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              O'zbekiston va MDH davlatlari o'quvchilari uchun mo'ljallangan birinchi raqamli akademik olimpiada va musobaqalar platformasi.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#10B981] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>Anti-Cheat & Verifikatsiyalangan Tizim</span>
            </div>
          </div>

          
          <div>
            <h4 className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider mb-4">Platforma</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/olympiads" className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
                  Barcha musobaqalar
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
                  Milliy reyting
                </Link>
              </li>
              <li>
                <Link to="/verify/NO-2026-MATH-8921" className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
                  Sertifikatni tekshirish
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
                  Biz haqimizda
                </Link>
              </li>
              <li>
                <Link to="/swagger" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1">
                  <span>REST API (Swagger)</span>
                </Link>
              </li>
            </ul>
          </div>

          
          <div>
            <h4 className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider mb-4">Fanlar</h4>
            <ul className="space-y-2.5 text-xs text-[#94A3B8]">
              <li className="hover:text-[#F1F5F9] transition-colors cursor-pointer">Matematika va Geometriya</li>
              <li className="hover:text-[#F1F5F9] transition-colors cursor-pointer">Informatika va Algoritmlar</li>
              <li className="hover:text-[#F1F5F9] transition-colors cursor-pointer">Fizika va Mexanika</li>
              <li className="hover:text-[#F1F5F9] transition-colors cursor-pointer">Kimyo va Biologiya</li>
            </ul>
          </div>

          
          <div>
            <h4 className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider mb-4">Bog'lanish</h4>
            <ul className="space-y-3 text-xs text-[#94A3B8]">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <span className="text-[#F1F5F9]">support@nextolymp.uz</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <span className="text-[#F1F5F9]">+998 99-174-99-33</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <span className="text-[#F1F5F9]">Toshkent sh., Yunusobod t., Amir Temur 108</span>
              </li>
            </ul>
          </div>
        </div>

        
        <div className="border-t border-[#1E293B] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4 font-medium">
          <p>© {new Date().getFullYear()} Next Olymp. Barcha huquqlar himoyalangan.</p>
          <div className="flex items-center gap-6 text-[#94A3B8]">
            <Link to="/terms" className="hover:text-[#F1F5F9] transition-colors">Foydalanish shartlari</Link>
            <Link to="/privacy" className="hover:text-[#F1F5F9] transition-colors">Maxfiylik siyosati</Link>
            <Link to="/rules" className="hover:text-[#F1F5F9] transition-colors">Nizom va qoidalar</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
