import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/helpers';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors select-none',
  {
    variants: {
      variant: {
        primary:
          'border-transparent bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300',
        secondary:
          'border-transparent bg-secondary-100 text-secondary-800 dark:bg-secondary-900/40 dark:text-secondary-300',
        accent:
          'border-transparent bg-accent-100 text-accent-800 dark:bg-accent-900/40 dark:text-accent-300',
        success:
          'border-transparent bg-primary-100 text-primary-800 dark:bg-primary-950/40 dark:text-primary-300',
        warning:
          'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
        danger:
          'border-transparent bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
        outline: 'border-dark-200 dark:border-dark-800 text-dark-800 dark:text-dark-200',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge: React.FC<BadgeProps> = ({ className, variant, ...props }) => {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
};
