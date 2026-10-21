import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'dim';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('opuszenvix_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'dim') return saved as Theme;
    } catch {
      // Ignore
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'dim');
    if (theme === 'light') {
      root.classList.add('light');
      root.style.colorScheme = 'light';
    } else if (theme === 'dim') {
      root.classList.add('dark', 'dim');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    }
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('opuszenvix_theme', theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  const toggleTheme = (_e?: React.MouseEvent) => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme, setTheme };
}
