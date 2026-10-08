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
  const base = "rounded-2xl bg-zinc-900/60 text-zinc-100 backdrop-blur-md transition-all duration-200";

  const variants = {
    border: "border border-white/10 shadow-sm shadow-black/20",
    shadow: "border border-white/10 shadow-xl shadow-black/40",
    flat: "border border-transparent",
    gradient: "bg-gradient-to-br from-zinc-900/80 via-zinc-900/50 to-zinc-950/80 border border-white/10 shadow-lg shadow-black/30",
  };

  const hover = hoverEffect ? "hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer active:scale-95" : "";

  return (
    <div className={clsx(base, variants[variant], hover, className)} {...props}>
      {children}
    </div>
  );
};
