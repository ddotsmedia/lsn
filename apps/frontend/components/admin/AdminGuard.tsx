'use client';

import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/admin/login');
      } else {
        setChecked(true);
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
