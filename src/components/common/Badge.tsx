import React from 'react';
import { clsx } from 'clsx';
import { Subject, OlympiadStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  status?: OlympiadStatus | string;
  subject?: Subject | string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'neutral' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  status,
  subject,
  variant,
  size = 'md',
  className,
}) => {
  let computedClass = "bg-zinc-800/60 text-zinc-300 border-white/10";
  let label = children;

  if (status) {
    const sLower = String(status).toLowerCase();
    if (sLower === 'active' || sLower === 'ochiq' || sLower === 'faol') {
      computedClass = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold";
      label = label || "Davom etmoqda";
    } else if (sLower === 'upcoming' || sLower === 'kutilmoqda' || sLower === 'kutilayotgan') {
      computedClass = "bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold";
      label = label || "Kutilmoqda";
    } else {
      computedClass = "bg-zinc-800/60 text-zinc-400 border-white/10";
      label = label || "Yakunlangan";
    }
  } else if (subject) {
    const sLower = String(subject).toLowerCase();
    let info = { class: "bg-zinc-800/60 text-zinc-300 border-white/10", label: String(subject) };

    if (sLower.includes('matematik') || sLower === 'math') {
      info = { class: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30", label: "Matematika" };
    } else if (sLower.includes('fizik') || sLower === 'physics') {
      info = { class: "bg-purple-500/15 text-purple-300 border-purple-500/30", label: "Fizika" };
    } else if (sLower.includes('kimyo') || sLower === 'chemistry') {
      info = { class: "bg-teal-500/15 text-teal-300 border-teal-500/30", label: "Kimyo" };
    } else if (sLower.includes('biolog') || sLower === 'biology') {
      info = { class: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", label: "Biologiya" };
    } else if (sLower.includes('informat') || sLower === 'informatics') {
      info = { class: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30", label: "Informatika" };
    } else if (sLower.includes('ingliz') || sLower.includes('english')) {
      info = { class: "bg-amber-500/15 text-amber-300 border-amber-500/30", label: "Ingliz tili" };
    } else if (sLower.includes('ona tili') || sLower.includes('adabiyot')) {
      info = { class: "bg-rose-500/15 text-rose-300 border-rose-500/30", label: "Ona tili" };
    } else if (sLower.includes('tarix') || sLower.includes('history')) {
      info = { class: "bg-orange-500/15 text-orange-300 border-orange-500/30", label: "Tarix" };
    }

    computedClass = info.class;
    label = label || info.label;
  } else if (variant) {
    const variantMap: Record<string, string> = {
      primary: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      secondary: "bg-zinc-800/60 text-zinc-300 border-white/10",
      success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      neutral: "bg-zinc-800/60 text-zinc-400 border-white/10",
      danger: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    };
    computedClass = variantMap[variant] || "bg-zinc-800/60 text-zinc-300 border-white/10";
  }

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-medium rounded-full border tracking-wide uppercase",
        sizes[size],
        computedClass,
        className
      )}
    >
      {label}
    </span>
  );
};
