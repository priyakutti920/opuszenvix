import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'dim';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = (localStorage.getItem('opuszyra_theme') || localStorage.getItem('opusmax_theme')) as Theme | null;
    if (saved === 'light' || saved === 'dark' || saved === 'dim') return saved;
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'dim');
    if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'dim') {
      root.classList.add('dark', 'dim');
    } else {
      root.classList.add('dark');
    }
    root.setAttribute('data-theme', theme);
    localStorage.setItem('opuszyra_theme', theme);
  }, [theme]);

  const toggleTheme = (e?: React.MouseEvent) => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';

    const doc = document as any;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // If View Transitions API is supported and not reduced motion, run circular wipe
    if (doc.startViewTransition && !isReducedMotion) {
      const x = e ? e.clientX : window.innerWidth / 2;
      const y = e ? e.clientY : window.innerHeight / 2;

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = doc.startViewTransition(() => {
        const root = document.documentElement;
        if (nextTheme === 'light') {
          root.classList.remove('dark');
          root.classList.add('light');
        } else {
          root.classList.remove('light');
          root.classList.add('dark');
        }
        setTheme(nextTheme);
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];

        document.documentElement.animate(
          {
            clipPath: clipPath,
          },
          {
            duration: 500,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      });
      return;
    }

    // Fallback if View Transitions is not supported
    setTheme(nextTheme);
  };

  return { theme, toggleTheme, setTheme };
}

