import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-[#94A3B8] pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={twMerge(
            clsx(
              "w-full rounded-lg border border-[#1E293B] bg-[#111827] text-[#F1F5F9] text-sm placeholder:text-[#64748B] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] disabled:bg-[#0B1120] disabled:opacity-50",
              leftIcon ? "pl-10" : "pl-3.5",
              rightIcon ? "pr-10" : "pr-3.5",
              "py-2.5",
              error && "border-[#EF4444] focus:ring-[#EF4444] focus:border-[#EF4444]",
              className
            )
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-[#94A3B8] flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <span className="text-xs text-[#EF4444] font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-[#94A3B8]">{helperText}</span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
