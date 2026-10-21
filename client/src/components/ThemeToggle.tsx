import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Theme } from '../lib/theme';

interface ThemeToggleProps {
  theme?: Theme;
  onToggle?: (e: React.MouseEvent) => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme = 'dark',
  onToggle,
  className = '',
}) => {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={(e) => onToggle && onToggle(e)}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        isDark
          ? 'border-white/10 bg-white/5 text-amber-400 hover:bg-white/10 hover:text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
          : 'border-slate-200 bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 hover:text-brand-600 shadow-sm'
      } ${className}`}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
};
