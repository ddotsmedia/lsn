'use client';

import { useState } from 'react';
import { AuthProvider } from '../../lib/auth-context';
import { AdminGuard } from '../../components/admin/AdminGuard';
import { Sidebar } from '../../components/admin/Sidebar';
import { Topbar } from '../../components/admin/Topbar';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
          <div className={`transition-all duration-300 ${collapsed ? 'ml-[68px]' : 'ml-[260px]'}`}>
            <Topbar />
            <main className="p-6">{children}</main>
          </div>
        </div>
      </AdminGuard>
    </AuthProvider>
  );
}
