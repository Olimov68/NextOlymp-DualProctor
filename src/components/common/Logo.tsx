import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  lightText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  lightText = true,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group cursor-pointer ${className}`}>
      <div className={`${iconSizes[size]} relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden bg-white/10 p-0.5 border border-white/15 shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-transform duration-300`}>
        <img
          src="/favicon.png"
          alt="Ibn Sino Logo"
          className="w-full h-full object-contain rounded-lg"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${textSizes[size]} font-black tracking-wider uppercase ${lightText ? 'text-white' : 'text-slate-100'}`}>
            IBN <span className="text-emerald-400 font-extrabold">SINO</span>
          </span>
          <span className="text-[9px] font-bold tracking-widest uppercase text-emerald-400/90 mt-0.5">
            O'quv Markazi
          </span>
        </div>
      )}
    </Link>
  );
};
