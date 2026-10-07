import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/helpers';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-[10px] text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[.98] select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-dark-900 dark:bg-primary-500 text-white hover:bg-dark-800 dark:hover:bg-primary-600 shadow-sm',
        secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 shadow-sm',
        accent: 'bg-accent-500 text-white hover:bg-accent-600 shadow-sm',
        outline: 'border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-900 text-dark-800 dark:text-dark-205 hover:bg-dark-50 dark:hover:bg-dark-800',
        danger: 'bg-danger text-white hover:bg-danger/90 shadow-md shadow-danger/10',
        ghost: 'text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-dark-100 hover:bg-dark-100 dark:hover:bg-dark-800/80',
      },
      size: {
        sm: 'h-9 px-3.5 rounded-[9px] text-xs',
        md: 'h-10.5 px-4.5 rounded-[10px]',
        lg: 'h-12 px-6 rounded-[10px] text-sm',
        icon: 'h-10 w-10 p-0 rounded-[10px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button: React.FC<ButtonProps> = ({ className, variant, size, ...props }) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
};
