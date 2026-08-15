'use client';

import AdminLayout from '../../components/admin/AdminLayout';

/**
 * Admin Routes Layout
 * Wraps all admin routes with AdminLayout component
 * Handles authentication, navigation, and theme
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return <AdminLayout>{children}</AdminLayout>;
}
