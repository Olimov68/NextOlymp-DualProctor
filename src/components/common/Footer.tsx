import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-white/10 pt-16 pb-8 w-full font-sans select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          
          <div className="space-y-4">
            <Link to="/" className="inline-block hover:opacity-95 transition-opacity">
              <Logo size="md" lightText />
            </Link>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Abu Ali ibn Sino nomidagi tibbiyot, biologiya, kimyo va aniq fanlar bo'yicha saralash, mock imtihon va nufuzli onlayn olimpiada platformasi.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#10B981] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>Ibn Sino ExamGuard & Verifikatsiyalangan Tizim</span>
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
                <Link to="/verify/IS-2026-MED-8921" className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
                  Sertifikatni tekshirish
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">
                  Biz haqimizda
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider mb-4">Fanlar</h4>
            <ul className="space-y-2.5 text-xs text-[#94A3B8]">
              <li className="hover:text-[#F1F5F9] transition-colors cursor-pointer">Biologiya va Inson Anatomiyasi</li>
              <li className="hover:text-[#F1F5F9] transition-colors cursor-pointer">Farmatsevtika va Kimyo</li>
              <li className="hover:text-[#F1F5F9] transition-colors cursor-pointer">Matematika va Mantiq</li>
              <li className="hover:text-[#F1F5F9] transition-colors cursor-pointer">Fizika va Tibbiy Texnologiyalar</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider mb-4">Bog'lanish</h4>
            <ul className="space-y-3 text-xs text-[#94A3B8]">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[#F1F5F9]">support@ibnsino.uz</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[#F1F5F9]">+998 71 200-00-26</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[#F1F5F9]">Toshkent sh., Ibn Sino Ilmiy Akademiyasi</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4 font-medium">
          <p>© {new Date().getFullYear()} Ibn Sino Mock Exam & Olympiad Platform. Barcha huquqlar himoyalangan.</p>
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
