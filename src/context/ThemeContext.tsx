import React, { createContext, useContext, useState } from 'react';

export type Theme = {
  bg: string;
  card: string;
  card2: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  track: string;
  purple: string;
  pillBg: string;
  pillText: string;
  emojiBtnBg: string;
  overlay: string;
  tabBar: string;
  isDark: boolean;
  toggle: () => void;
};

const light: Omit<Theme, 'isDark' | 'toggle'> = {
  bg:            '#F2F2F7',
  card:          '#FFFFFF',
  card2:         '#F2F2F7',
  textPrimary:   '#000000',
  textSecondary: '#6C6C70',
  border:        'rgba(60,60,67,0.13)',
  track:         '#E5E5EA',
  purple:        '#AF52DE',
  pillBg:        '#F3E8FF',
  pillText:      '#AF52DE',
  emojiBtnBg:    '#EBEBF0',
  overlay:       'rgba(0,0,0,0.40)',
  tabBar:        'rgba(242,242,247,0.92)',
};

const dark: Omit<Theme, 'isDark' | 'toggle'> = {
  bg:            '#000000',
  card:          '#1C1C1E',
  card2:         '#2C2C2E',
  textPrimary:   '#FFFFFF',
  textSecondary: '#8E8E93',
  border:        'rgba(255,255,255,0.10)',
  track:         '#2C2C2E',
  purple:        '#BF5AF2',
  pillBg:        '#2D1F52',
  pillText:      '#D8A8F8',
  emojiBtnBg:    '#3A3A3C',
  overlay:       'rgba(0,0,0,0.70)',
  tabBar:        'rgba(28,28,30,0.92)',
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const toggle = () => setIsDark(d => !d);
  return (
    <ThemeContext.Provider value={{ ...(isDark ? dark : light), isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
