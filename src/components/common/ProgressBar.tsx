import React from 'react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  progress: number; 
  color?: 'primary' | 'secondary' | 'success' | 'warning';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'primary',
  showLabel = false,
  className,
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  const colors = {
    primary: "bg-primary-600",
    secondary: "bg-secondary-600",
    success: "bg-emerald-600",
    warning: "bg-amber-500",
  };

  return (
    <div className={clsx("w-full flex flex-col gap-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-semibold text-accent-600">
          <span>Jarayon</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div className="w-full h-2.5 bg-accent-100 rounded-full overflow-hidden">
        <div
          className={clsx("h-full transition-all duration-300 rounded-full", colors[color])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
