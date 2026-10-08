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
      <div className={`${iconSizes[size]} relative shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-700 p-1.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-white">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          <circle cx="12" cy="3" r="1" fill="currentColor" />
        </svg>
      </div>

      {showText && (
        <span className={`${textSizes[size]} font-black tracking-tight ${lightText ? 'text-white' : 'text-slate-100'}`}>
          Ibn <span className="text-emerald-400 font-extrabold">Sino</span>
          <span className="ml-1 text-[10px] font-semibold tracking-wider text-emerald-400/80 uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">Olympiad</span>
        </span>
      )}
    </Link>
  );
};
