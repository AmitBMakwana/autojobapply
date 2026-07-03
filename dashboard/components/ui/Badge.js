'use client';

import { cn } from '@/lib/utils';

export function Badge({ children, variant = 'info', className }) {
  const variants = {
    success: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
    warning: 'bg-orange-500/10 border border-orange-500/20 text-orange-400',
    danger: 'bg-red-500/10 border border-red-500/20 text-red-400',
    info: 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400',
    primary: 'bg-purple-500/10 border border-purple-500/20 text-purple-400',
  };
  
  return (
    <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider', variants[variant], className)}>
      {children}
    </span>
  );
}
