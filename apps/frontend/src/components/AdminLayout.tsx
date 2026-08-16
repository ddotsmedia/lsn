'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Image,
  BarChart3,
  Settings,
  HelpCircle,
  BookOpen,
  Calendar,
  Zap,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { AdminHeader } from '@/components/Header';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const SIDEBAR_ITEMS = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'CRM',
    href: '/admin/crm',
    icon: <Users size={18} />,
    children: [
      {
        label: 'Children',
        href: '/admin/children',
        icon: <Users size={16} />,
      },
      {
        label: 'Parents',
        href: '/admin/parents',
        icon: <Users size={16} />,
      },
      {
        label: 'Registrations',
        href: '/admin/registrations',
        icon: <FileText size={16} />,
      },
      {
        label: 'Classes',
        href: '/admin/classes',
        icon: <BookOpen size={16} />,
      },
    ],
  },
  {
    label: 'Operations',
    href: '/admin/operations',
    icon: <Calendar size={18} />,
    children: [
      {
        label: 'Bookings',
        href: '/admin/bookings',
        icon: <Calendar size={16} />,
      },
      {
        label: 'Attendance',
        href: '/admin/attendance',
        icon: <BarChart3 size={16} />,
      },
      {
        label: 'Staff',
        href: '/admin/staff',
        icon: <Users size={16} />,
      },
    ],
  },
  {
    label: 'Content',
    href: '/admin/content',
    icon: <FileText size={18} />,
    children: [
      {
        label: 'Pages',
        href: '/admin/pages',
        icon: <FileText size={16} />,
      },
      {
        label: 'Media',
        href: '/admin/media',
        icon: <Image size={16} />,
      },
      {
        label: 'Events',
        href: '/admin/events',
        icon: <Calendar size={16} />,
      },
      {
        label: 'Testimonials',
        href: '/admin/testimonials',
        icon: <Users size={16} />,
      },
    ],
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: <BarChart3 size={18} />,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: <Settings size={18} />,
    children: [
      {
        label: 'General',
        href: '/admin/settings',
        icon: <Settings size={16} />,
      },
      {
        label: 'Users',
        href: '/admin/users',
        icon: <Users size={16} />,
      },
      {
        label: 'SEO',
        href: '/admin/seo',
        icon: <Zap size={16} />,
      },
    ],
  },
];

export function AdminLayout({
  children,
  title,
  subtitle,
  actions,
}: AdminLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-neutral-950">
      {/* Sidebar */}
      <Sidebar items={SIDEBAR_ITEMS} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader title={title} subtitle={subtitle} actions={actions} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
