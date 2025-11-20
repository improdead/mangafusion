import React from 'react';
import { cn } from '../../utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'glass';
}

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'default' }) => {
  const variants = {
    default: "bg-white/80 backdrop-blur-sm text-black border border-gray-200",
    outline: "border border-gray-300 text-gray-600",
    glass: "bg-black/5 backdrop-blur-md text-black border border-white/20"
  };

  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
};
