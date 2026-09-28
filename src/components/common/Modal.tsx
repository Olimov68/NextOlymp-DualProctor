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
          "relative w-full rounded-2xl border shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200",
          isDark
            ? "bg-[#111827] border-[#1E293B]"
            : "bg-white border-border",
          sizes[size]
        )}
      >
        {title && (
          <div className={clsx(
            "flex items-center justify-between px-6 py-4 border-b",
            isDark
              ? "border-[#1E293B] bg-[#0D1832]"
              : "border-border bg-surface"
          )}>
            <h3 className={clsx(
              "text-lg font-bold tracking-tight",
              isDark ? "text-white" : "text-accent-900"
            )}>{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={clsx(
                  "p-1 rounded-lg transition-colors",
                  isDark
                    ? "text-slate-400 hover:text-white hover:bg-[#1E293B]"
                    : "text-accent-400 hover:text-accent-700 hover:bg-accent-200/60"
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
