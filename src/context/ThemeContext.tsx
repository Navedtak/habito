import React, { createContext, useContext, useState } from 'react';

export type Theme = {
  bg: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  track: string;
  purple: string;
  pillBg: string;
  pillText: string;
  emojiBtnBg: string;
  overlay: string;
  isDark: boolean;
  toggle: () => void;
};

const light: Omit<Theme, 'isDark' | 'toggle'> = {
  bg: '#F8F7FF',
  card: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#9CA3AF',
  border: '#E5E7EB',
  track: '#E5E7EB',
  purple: '#7C3AED',
  pillBg: '#EDE9FE',
  pillText: '#7C3AED',
  emojiBtnBg: '#F3F4F6',
  overlay: 'rgba(0,0,0,0.40)',
};

const dark: Omit<Theme, 'isDark' | 'toggle'> = {
  bg: '#0D0D14',
  card: '#1A1A28',
  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF', // was #6B7280 — too dark on dark cards (~3.9:1), now ~6.5:1
  border: '#3A3A58',        // was #2A2A3E — future day numbers were near-invisible
  track: '#252545',         // was #2A2A3E — calendar cells need contrast against day numbers
  purple: '#9061F9',        // was #7C3AED — brighter for dark surfaces, keeps AA at small sizes
  pillBg: '#2D1F52',
  pillText: '#C4B5FD',      // was #A78BFA — slightly brighter for pill labels
  emojiBtnBg: '#262645',    // was #252535 — more distinct from card background
  overlay: 'rgba(0,0,0,0.65)',
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
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
