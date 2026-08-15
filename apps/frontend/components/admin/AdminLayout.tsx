'use client';

/**
 * Admin Layout Component
 * Main layout for admin panel with authentication, sidebar, and header
 */

import { useState, ReactNode } from 'react';
import { AuthProvider } from '../../lib/auth-context';
import { AdminGuard } from './AdminGuard';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { usePathname } from 'next/navigation';

/**
 * Admin Layout wrapper component
 * Provides authentication, navigation, and main layout structure
 *
 * @param children - Page content to render
 */
export default function AdminLayout({ children }: { children: ReactNode }): ReactNode {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Login page has no shell
  if (pathname === '/admin/login') {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <AuthProvider>
      <AdminGuard>
        <div className="min-h-screen bg-[#0a0a0f] text-zinc-100">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
          <div
            className={`transition-all duration-300 ${collapsed ? 'ml-[68px]' : 'ml-[260px]'}`}
          >
            <Topbar />
            <main className="p-6">{children}</main>
          </div>
        </div>
      </AdminGuard>
    </AuthProvider>
  );
}
