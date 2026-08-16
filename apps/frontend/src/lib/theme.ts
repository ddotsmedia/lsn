/**
 * Theme System for LSN Admin
 * Supports: Dark (default), Light, System preference
 * Persists to localStorage
 */

export type Theme = 'dark' | 'light' | 'system';

const THEME_STORAGE_KEY = 'lsn-theme-preference';
const SYSTEM_PREFERS_DARK = '(prefers-color-scheme: dark)';

/**
 * Get the effective theme (resolved if system)
 */
export function getEffectiveTheme(theme: Theme): Exclude<Theme, 'system'> {
  if (theme !== 'system') return theme;

  if (typeof window === 'undefined') return 'dark';

  return window.matchMedia(SYSTEM_PREFERS_DARK).matches ? 'dark' : 'light';
}

/**
 * Get stored theme preference
 */
export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light' || stored === 'system') {
    return stored;
  }

  return 'system';
}

/**
 * Save theme preference to localStorage
 */
export function saveThemePreference(theme: Theme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Apply theme to DOM
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const effectiveTheme = getEffectiveTheme(theme);
  const root = document.documentElement;

  // Remove both classes first
  root.classList.remove('dark', 'light');

  // Add the effective theme class
  root.classList.add(effectiveTheme);

  // Set data attribute for CSS variables
  root.setAttribute('data-theme', effectiveTheme);
}

/**
 * Watch for system theme changes
 */
export function watchSystemThemeChanges(callback: (theme: 'dark' | 'light') => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia(SYSTEM_PREFERS_DARK);

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', handler);

  return () => mediaQuery.removeEventListener('change', handler);
}
