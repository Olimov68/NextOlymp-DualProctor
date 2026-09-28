import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'shadow' | 'border' | 'flat' | 'gradient';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'border',
  hoverEffect = false,
  className,
  ...props
}) => {
  const base = "rounded-xl bg-[#111827] text-[#F1F5F9] transition-all duration-200";

  const variants = {
    border: "border border-[#1E293B] shadow-xs",
    shadow: "border border-[#1E293B] shadow-lg shadow-black/40",
    flat: "bg-[#111827] border border-transparent",
    gradient: "bg-gradient-to-br from-[#111827] to-[#0F172A] border border-[#1E293B] shadow-md",
  };

  const hover = hoverEffect ? "hover:-translate-y-0.5 hover:border-[#3B82F6]/50 hover:shadow-xl hover:shadow-[#3B82F6]/5 cursor-pointer" : "";

  return (
    <div className={clsx(base, variants[variant], hover, className)} {...props}>
      {children}
    </div>
  );
};
