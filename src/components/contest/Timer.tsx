import React from 'react';
import { Clock, ShieldAlert } from 'lucide-react';
import { useTimer } from '../../hooks/useTimer';
import { clsx } from 'clsx';

export const Timer: React.FC = () => {
  const { formattedTime, timeRemainingSeconds } = useTimer();

  const isLowTime = timeRemainingSeconds <= 300; 

  return (
    <div
      className={clsx(
        "flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm shadow-xs transition-all",
        isLowTime
          ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
          : "bg-surface border-border text-accent-900"
      )}
    >
      <Clock className={clsx("w-4 h-4", isLowTime ? "text-rose-600" : "text-primary")} />
      <span>{formattedTime}</span>
    </div>
  );
};
