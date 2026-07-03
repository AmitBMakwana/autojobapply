'use client';

import { cn } from '@/lib/utils';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  loading, 
  disabled, 
  ...props 
}) {
  const variants = {
    primary: 'bg-purple-600 border-purple-600 hover:bg-purple-500 text-white shadow-purple-500/10 hover:shadow-purple-500/20 hover:scale-105',
    secondary: 'bg-white/5 border-white/5 text-gray-200 hover:bg-white/10 hover:text-white',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
    danger: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-sm',
  };
  
  return (
    <button
      className={cn(
        'font-bold rounded-xl tracking-wider uppercase transition-all duration-300 border cursor-pointer flex items-center justify-center gap-2 select-none disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
