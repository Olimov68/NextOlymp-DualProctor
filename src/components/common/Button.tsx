import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B1120] disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

  const variants = {
    primary: "bg-[#3B82F6] hover:bg-[#2563EB] text-white focus:ring-[#3B82F6] shadow-sm hover:shadow active:scale-[0.98]",
    secondary: "bg-[#1E293B] hover:bg-[#334155] text-[#F1F5F9] border border-[#334155] focus:ring-[#3B82F6] shadow-sm active:scale-[0.98]",
    accent: "bg-[#F59E0B] hover:bg-amber-600 text-slate-950 font-bold focus:ring-[#F59E0B] shadow-sm active:scale-[0.98]",
    ghost: "bg-transparent text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E293B] focus:ring-[#3B82F6]",
    outline: "border border-[#1E293B] bg-[#111827] text-[#F1F5F9] hover:bg-[#1E293B] hover:border-[#334155] focus:ring-[#3B82F6]",
    danger: "bg-[#EF4444] hover:bg-rose-600 text-white focus:ring-[#EF4444] shadow-sm active:scale-[0.98]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5 font-semibold",
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
