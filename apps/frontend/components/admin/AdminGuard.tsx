'use client';

import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

export function AdminGuard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
