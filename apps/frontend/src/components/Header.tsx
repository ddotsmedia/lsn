'use client';

import React from 'react';
import { Moon, Sun, LogOut, Settings } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

// Admin header component (new design system)
export function AdminHeader({ title, subtitle, actions }: HeaderProps) {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left side - Title */}
        <div className="min-w-0 flex-1">
          {title && (
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Center - Custom actions */}
        {actions && <div className="flex-shrink-0 mx-4">{actions}</div>}

        {/* Right side - Controls */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            title={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
            className="hidden sm:flex"
          >
            {effectiveTheme === 'dark' ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/settings')}
            className="hidden sm:flex"
            title="Settings"
          >
            <Settings size={18} />
          </Button>

          {/* User info and logout */}
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-neutral-200 dark:border-neutral-700">
            <div className="hidden sm:block text-right">
              <p className="text-xs md:text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {user?.email || 'Admin'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Administrator
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Re-export the old public Header as default for compatibility with existing pages
// Public pages should use this, admin pages should use AdminHeader directly
import { Header as PublicHeader } from '../../components/Header';
export default PublicHeader;
