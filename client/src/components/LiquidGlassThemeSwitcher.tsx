import React, { useRef, useState, useEffect } from 'react';
import './LiquidGlassThemeSwitcher.css';

export type LiquidTheme = 'light' | 'dark' | 'dim';

export interface LiquidGlassThemeSwitcherProps {
  value?: LiquidTheme;
  defaultValue?: LiquidTheme;
  onChange?: (theme: LiquidTheme) => void;
  className?: string;
  name?: string;
}

const THEME_INDEX: Record<LiquidTheme, number> = {
  light: 0,
  dark: 1,
  dim: 2,
};

const THEMES: LiquidTheme[] = ['light', 'dark', 'dim'];

export const LiquidGlassThemeSwitcher: React.FC<LiquidGlassThemeSwitcherProps> = ({
  value,
  defaultValue = 'dark',
  onChange,
  className = '',
  name = 'liquid-theme-choice',
}) => {
  const [internalTheme, setInternalTheme] = useState<LiquidTheme>(value ?? defaultValue);
  const activeTheme = value ?? internalTheme;
  const activeIndex = THEME_INDEX[activeTheme] ?? 1;

  const [previousIndex, setPreviousIndex] = useState<number>(activeIndex);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const animTimerRef = useRef<number | null>(null);

  // Sync state if controlled
  useEffect(() => {
    if (value !== undefined && value !== activeTheme) {
      handleThemeChange(value);
    }
  }, [value]);

  const handleThemeChange = (newTheme: LiquidTheme) => {
    const newIdx = THEME_INDEX[newTheme];
    if (newIdx === activeIndex) return;

    const fromIdx = activeIndex;
    const dir = newIdx > fromIdx ? 'forward' : 'backward';

    setPreviousIndex(fromIdx);
    setDirection(dir);
    setIsAnimating(true);

    if (animTimerRef.current) {
      window.clearTimeout(animTimerRef.current);
    }
    animTimerRef.current = window.setTimeout(() => {
      setIsAnimating(false);
    }, 420);

    setInternalTheme(newTheme);
    onChange?.(newTheme);
  };

  return (
    <>
      {/* SVG Refraction Filter (rendered once globally or scoped) */}
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none', overflow: 'hidden' }}
        aria-hidden="true"
      >
        <defs>
          <filter id="switcher" primitiveUnits="objectBoundingBox" x="-15%" y="-15%" width="130%" height="130%">
            <feImage
              id="lensMap"
              result="lensMap"
              preserveAspectRatio="none"
              width="100%"
              height="100%"
              href="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='152' height='56' viewBox='0 0 152 56'%3E%3Cdefs%3E%3ClinearGradient id='gx' x1='0' y1='0' x2='1' y2='0'%3E%3Cstop offset='0%25' stop-color='%23ff8080'/%3E%3Cstop offset='14%25' stop-color='%23808080'/%3E%3Cstop offset='86%25' stop-color='%23808080'/%3E%3Cstop offset='100%25' stop-color='%23008080'/%3E%3C/linearGradient%3E%3ClinearGradient id='gy' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%2380ff80'/%3E%3Cstop offset='20%25' stop-color='%23808080'/%3E%3Cstop offset='80%25' stop-color='%23808080'/%3E%3Cstop offset='100%25' stop-color='%23800080'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='152' height='56' rx='28' fill='%23808080'/%3E%3Crect width='152' height='56' rx='28' fill='url(%23gx)' style='mix-blend-mode: screen'/%3E%3Crect width='152' height='56' rx='28' fill='url(%23gy)' style='mix-blend-mode: overlay'/%3E%3C/svg%3E"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="lensMap"
              scale="0.04"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Horizontal pill container */}
      <fieldset
        className={`liquid-glass-switcher ${isAnimating ? 'is-animating' : ''} ${className}`}
        data-active={activeIndex}
        data-previous={previousIndex}
        data-direction={direction}
        style={
          {
            '--from-index': previousIndex,
            '--to-index': activeIndex,
          } as React.CSSProperties
        }
        aria-label="Theme Selection"
      >
        <legend className="switcher-radio">Choose color theme</legend>

        {/* Sliding Liquid Glass Thumb Pill Indicator */}
        <div className="liquid-thumb" aria-hidden="true" />

        {/* Option 0: Light (Sun) */}
        <div className="switcher-option" data-index="0" data-checked={activeTheme === 'light'}>
          <input
            type="radio"
            name={name}
            id={`${name}-light`}
            value="light"
            checked={activeTheme === 'light'}
            onChange={() => handleThemeChange('light')}
            className="switcher-radio"
          />
          <label htmlFor={`${name}-light`} className="switcher-option-label" title="Light theme" aria-label="Light mode">
            <svg className="switcher-icon" viewBox="0 0 36 36" aria-hidden="true">
              <circle cx="18" cy="18" r="6.2" />
              <line x1="18" y1="4.5" x2="18" y2="7.5" />
              <line x1="18" y1="28.5" x2="18" y2="31.5" />
              <line x1="4.5" y1="18" x2="7.5" y2="18" />
              <line x1="28.5" y1="18" x2="31.5" y2="18" />
              <line x1="8.4" y1="8.4" x2="10.6" y2="10.6" />
              <line x1="25.4" y1="25.4" x2="27.6" y2="27.6" />
              <line x1="8.4" y1="27.6" x2="10.6" y2="25.4" />
              <line x1="25.4" y1="10.6" x2="27.6" y2="8.4" />
            </svg>
          </label>
        </div>

        {/* Option 1: Dark (Moon) */}
        <div className="switcher-option" data-index="1" data-checked={activeTheme === 'dark'}>
          <input
            type="radio"
            name={name}
            id={`${name}-dark`}
            value="dark"
            checked={activeTheme === 'dark'}
            onChange={() => handleThemeChange('dark')}
            className="switcher-radio"
          />
          <label htmlFor={`${name}-dark`} className="switcher-option-label" title="Dark theme" aria-label="Dark mode">
            <svg className="switcher-icon" viewBox="0 0 36 36" aria-hidden="true">
              <path d="M 23.2 8.4 C 21.9 7.8 20.4 7.5 18.8 7.5 C 12.5 7.5 7.5 12.5 7.5 18.8 C 7.5 25 12.5 30 18.8 30 C 24 30 28.3 26.6 29.7 21.8 C 26.8 22.8 23.6 22.1 21.3 19.8 C 19 17.5 18.3 14.3 19.3 11.4 C 20.2 9.9 21.5 8.9 23.2 8.4 Z" />
            </svg>
          </label>
        </div>

        {/* Option 2: Dim (Sun-with-horizon) */}
        <div className="switcher-option" data-index="2" data-checked={activeTheme === 'dim'}>
          <input
            type="radio"
            name={name}
            id={`${name}-dim`}
            value="dim"
            checked={activeTheme === 'dim'}
            onChange={() => handleThemeChange('dim')}
            className="switcher-radio"
          />
          <label htmlFor={`${name}-dim`} className="switcher-option-label" title="Dim theme" aria-label="Dim mode">
            <svg className="switcher-icon" viewBox="0 0 36 36" aria-hidden="true">
              <line x1="5.5" y1="23.5" x2="30.5" y2="23.5" />
              <path d="M 10.5 23.5 A 7.5 7.5 0 0 1 25.5 23.5" />
              <line x1="18" y1="7" x2="18" y2="10" />
              <line x1="10.5" y1="10.2" x2="12.8" y2="12.6" />
              <line x1="25.5" y1="10.2" x2="23.2" y2="12.6" />
              <line x1="6.5" y1="17.5" x2="9.5" y2="18.5" />
              <line x1="29.5" y1="17.5" x2="26.5" y2="18.5" />
              <line x1="13.5" y1="27.5" x2="22.5" y2="27.5" />
              <line x1="15.5" y1="31" x2="20.5" y2="31" />
            </svg>
          </label>
        </div>
      </fieldset>
    </>
  );
};
