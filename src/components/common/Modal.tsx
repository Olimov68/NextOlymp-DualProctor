import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { useThemeStore } from '../../store/useThemeStore';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      
      <div
        className={clsx(
          "relative w-full rounded-2xl border shadow-2xl shadow-black/50 z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200",
          isDark
            ? "bg-zinc-900/95 backdrop-blur-xl border-white/10 text-zinc-100"
            : "bg-white border-slate-200 text-slate-900",
          sizes[size]
        )}
      >
        {title && (
          <div className={clsx(
            "flex items-center justify-between px-6 py-4 border-b",
            isDark
              ? "border-white/10 bg-zinc-900/70"
              : "border-slate-200 bg-slate-50"
          )}>
            <h3 className={clsx(
              "text-lg font-bold tracking-tight",
              isDark ? "text-white" : "text-slate-900"
            )}>{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={clsx(
                  "p-1.5 rounded-lg transition-colors cursor-pointer",
                  isDark
                    ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
