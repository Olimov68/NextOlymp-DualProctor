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
  lightText = false,
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
      
      <div className={`${iconSizes[size]} relative shrink-0 flex items-center justify-center`}>
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full drop-shadow-md group-hover:scale-105 transition-transform duration-300">
          <defs>
            <linearGradient id="logoPeakCenter" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95"/>
              <stop offset="50%" stopColor="#B8C5FF" stopOpacity="0.75"/>
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.4"/>
            </linearGradient>
            <linearGradient id="logoPeakLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E2E8FF" stopOpacity="0.85"/>
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.3"/>
            </linearGradient>
            <linearGradient id="logoPeakRight" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.85"/>
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.3"/>
            </linearGradient>
          </defs>

          
          <polygon points="18,72 38,36 54,72" fill="url(#logoPeakLeft)" stroke="#A5B4FC" strokeWidth="1.8" strokeLinejoin="round" />
          <line x1="38" y1="36" x2="38" y2="72" stroke="#C7D2FE" strokeWidth="1.2"/>

          
          <polygon points="46,72 64,40 82,72" fill="url(#logoPeakRight)" stroke="#C084FC" strokeWidth="1.8" strokeLinejoin="round" />
          <line x1="64" y1="40" x2="64" y2="72" stroke="#E9D5FF" strokeWidth="1.2"/>

          
          <polygon points="30,72 50,16 70,72" fill="url(#logoPeakCenter)" stroke="#6366F1" strokeWidth="2" strokeLinejoin="round" />
          <line x1="50" y1="16" x2="50" y2="72" stroke="#FFFFFF" strokeWidth="2"/>
          <line x1="18" y1="72" x2="82" y2="72" stroke="#818CF8" strokeWidth="2"/>
        </svg>
      </div>

      {showText && (
        <span className={`${textSizes[size]} font-black tracking-tight ${lightText ? 'text-white' : 'text-slate-900'}`}>
          Next <span className="text-indigo-400 font-extrabold">Olymp</span>
        </span>
      )}
    </Link>
  );
};
