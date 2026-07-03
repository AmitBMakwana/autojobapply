'use client';

import { cn } from '@/lib/utils';
import { Card } from './Card';

export function StatsCard({ icon, label, value, change, changeLabel, className }) {
  const isPositive = change > 0;
  
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl" />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">{label}</p>
          <p className="text-3xl font-extrabold text-white mt-1">{value}</p>
          {change !== undefined && (
            <p className={cn(
              'text-xs font-semibold mt-2 flex items-center gap-1',
              isPositive ? 'text-emerald-400' : 'text-red-400'
            )}>
              <span>{isPositive ? '▲' : '▼'}</span>
              <span>{isPositive ? '+' : ''}{change}% {changeLabel}</span>
            </p>
          )}
        </div>
        <div className="text-2xl bg-white/5 p-3.5 rounded-2xl border border-white/5 text-gray-300">
          {icon}
        </div>
      </div>
    </Card>
  );
}
