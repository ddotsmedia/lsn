import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm',
  {
    variants: {
      variant: {
        default: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
        secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800',
        outline: 'border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700',
        ghost: 'text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700',
        destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);

Button.displayName = 'Button';

export { Button, buttonVariants };
