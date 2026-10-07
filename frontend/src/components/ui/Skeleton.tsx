import React from 'react';
import { cn } from '../../utils/helpers';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-dark-200 dark:bg-dark-800',
        className
      )}
      {...props}
    />
  );
};
