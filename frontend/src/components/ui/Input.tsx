import React, { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || Math.random().toString(36).substring(2, 9);
    
    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-dark-700 dark:text-dark-300"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-dark-400 dark:text-dark-500 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
            'w-full h-11 rounded-[10px] bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-800 text-dark-800 dark:text-dark-100 px-4 text-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none placeholder-dark-400 disabled:opacity-50 disabled:bg-dark-50 dark:disabled:bg-dark-850',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              error && 'border-danger focus:border-danger focus:ring-danger',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-dark-400 dark:text-dark-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-[11px] font-medium text-danger animate-in fade-in slide-in-from-top-1 duration-150">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-[10px] text-dark-400 dark:text-dark-500 leading-snug">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
