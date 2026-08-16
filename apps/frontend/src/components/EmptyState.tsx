import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {icon && (
          <div className="text-neutral-300 dark:text-neutral-600 mb-4">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-center max-w-sm">
            {description}
          </p>
        )}
        {action && <div>{action}</div>}
      </CardContent>
    </Card>
  );
}
