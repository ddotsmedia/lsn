import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100',
        secondary: 'bg-secondary-100 dark:bg-secondary-900 text-secondary-900 dark:text-secondary-100',
        success: 'bg-success-100 dark:bg-success-900 text-success-900 dark:text-success-100',
        warning: 'bg-accent-100 dark:bg-accent-900 text-accent-900 dark:text-accent-100',
        destructive: 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100',
        outline: 'border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
