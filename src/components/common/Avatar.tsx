import React from 'react';
import { clsx } from 'clsx';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className,
}) => {
  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base font-semibold",
    xl: "w-20 h-20 text-xl font-bold",
  };

  const isImageUrl = src && (src.startsWith('http') || src.startsWith('data:image') || src.startsWith('/'));
  const isEmoji = src && !isImageUrl;

  if (isImageUrl) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx("rounded-full object-cover border border-border shadow-xs", sizes[size], className)}
      />
    );
  }

  if (isEmoji) {
    return (
      <div
        className={clsx(
          "rounded-full bg-gradient-to-tr from-blue-900 via-indigo-950 to-slate-900 text-white flex items-center justify-center border border-cyan-400/40 shadow-sm select-none",
          sizes[size],
          className
        )}
      >
        <span>{src}</span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 text-white font-medium flex items-center justify-center border border-white/20 shadow-xs select-none",
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};
