'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle sidebar"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-neutral-900 dark:bg-black border-r border-neutral-800 p-4 pt-16 overflow-y-auto transition-transform duration-300 z-40 lg:relative lg:pt-4 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="space-y-2">
          {items.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:bg-neutral-800 transition-colors',
                    expandedItems.includes(item.label) && 'bg-neutral-800'
                  )}
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-300 hover:bg-neutral-800'
                  )}
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}

              {/* Submenu */}
              {item.children && expandedItems.includes(item.label) && (
                <div className="ml-2 mt-1 space-y-1 border-l border-neutral-700 pl-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      href={child.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-colors',
                        isActive(child.href)
                          ? 'bg-primary-600 text-white'
                          : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300'
                      )}
                    >
                      {child.icon}
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
