'use client';

import { cn } from '@/lib/utils';

export function Card({ children, className, hover = true, glow = false }) {
  return (
    <div
      className={cn(
        'glass-panel p-6 rounded-2xl shadow-lg transition-all duration-300',
        hover && 'glass-panel-hover',
        glow && 'glow-indigo',
        className
      )}
    >
      {children}
    </div>
  );
}
