import React, { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[] | string[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, id, ...props }, ref) => {
    const selectId = id || Math.random().toString(36).substring(2, 9);

    const selectOptions = options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-dark-700 dark:text-dark-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'w-full h-11 rounded-xl bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-800 text-dark-800 dark:text-dark-100 px-4 pr-10 text-sm transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none disabled:opacity-50 disabled:bg-dark-50 dark:disabled:bg-dark-850 appearance-none cursor-pointer',
              error && 'border-danger focus:border-danger focus:ring-danger',
              className
            )}
            {...props}
          >
            {selectOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-dark-900">
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom Arrow Icon */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-dark-400 dark:text-dark-500">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
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

Select.displayName = 'Select';
