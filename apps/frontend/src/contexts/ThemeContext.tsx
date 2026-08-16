'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { type Theme, getStoredTheme, saveThemePreference, applyTheme, watchSystemThemeChanges } from '@/lib/theme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);
  const [effectiveTheme, setEffectiveTheme] = useState<'dark' | 'light'>('dark');

  // Initialize theme from localStorage and apply
  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    applyTheme(stored);
    setMounted(true);

    // Calculate effective theme
    const effective = stored === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : stored;
    setEffectiveTheme(effective);
  }, []);

  // Watch for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const unwatch = watchSystemThemeChanges((newTheme) => {
      setEffectiveTheme(newTheme);
      applyTheme(theme);
    });

    return unwatch;
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    saveThemePreference(newTheme);
    applyTheme(newTheme);

    // Update effective theme
    const effective = newTheme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : newTheme;
    setEffectiveTheme(effective);
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
