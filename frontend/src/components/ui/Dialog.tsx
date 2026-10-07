import React, { useEffect } from 'react';
import { Button } from './Button';
import { X } from 'lucide-react';
import { cn } from '../../utils/helpers';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
}) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-dark-950/45 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Dialog Body */}
      <div
        className={cn(
          'relative w-full bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-800 rounded-3xl p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 z-10 text-left',
          sizeClasses[size],
          className
        )}
      >
        {/* Close Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-dark-500 hover:text-dark-950 dark:hover:text-white hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="space-y-1 mb-5">
          <h2 className="text-xl font-bold text-dark-900 dark:text-white leading-none">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-dark-450 dark:text-dark-500 leading-snug">
              {description}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="relative text-sm text-dark-800 dark:text-dark-250 select-text">
          {children}
        </div>
      </div>
    </div>
  );
};
export default Dialog;
