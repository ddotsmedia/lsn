'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from './ui/Button';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode, isMounted]);

  const handleLogout = () => {
    localStorage.removeItem('lsn_token');
    localStorage.removeItem('lsn_user');
    router.push('/admin/login');
  };

  const pages = [
    { name: 'Home', slug: 'home' },
    { name: 'About', slug: 'about' },
    { name: 'Facilities', slug: 'facilities' },
    { name: 'Contact', slug: 'contact' },
    { name: 'Services', slug: 'services' },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50 transition-colors">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg lg:hidden"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Little Smarties
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Admin Dashboard</p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                title="Toggle dark mode"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Logout */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside
            className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-neutral-900 dark:bg-neutral-900 text-white border-r border-neutral-800 transform transition-transform duration-300 lg:relative lg:translate-x-0 z-30 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <nav className="p-4 space-y-2">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                Pages
              </p>
              {pages.map(page => (
                <a
                  key={page.slug}
                  href={`/admin/text-editor?page=${page.slug}`}
                  className="block px-4 py-3 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
                >
                  {page.name}
                </a>
              ))}
            </nav>
          </aside>

          {/* Close sidebar on mobile when clicking outside */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 top-16 bg-black/50 lg:hidden z-20"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 min-h-[calc(100vh-64px)] w-full overflow-auto">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-neutral-50">
                  {title}
                </h2>
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
