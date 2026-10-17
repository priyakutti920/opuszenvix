import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Theme } from '../lib/theme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: (e: React.MouseEvent) => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onToggle,
  className = '',
}) => {
  return (
    <button
      onClick={(e) => onToggle(e)}
      className={`relative inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-brand-400 transition-all hover:bg-white/[0.06] border border-white/5 active:scale-95 ${className}`}
      title={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
      aria-label={theme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
};
