import React from 'react';
import { Card, CardContent } from './Card';
import { Skeleton } from './Skeleton';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../utils/helpers';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  loading?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  loading = false,
  className,
}) => {
  if (loading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const trendColor = trend
    ? trend.direction === 'up'
      ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-950/20'
      : trend.direction === 'down'
      ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20'
      : 'text-dark-500 bg-dark-50 dark:text-dark-400 dark:bg-dark-900/40'
    : '';

  const TrendIcon = trend
    ? trend.direction === 'up'
      ? ArrowUpRight
      : trend.direction === 'down'
      ? ArrowDownRight
      : Minus
    : null;

  return (
    <Card className={cn('group overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-300', className)}>
      <CardContent className="p-5 md:p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">
            {title}
          </span>
          {icon && (
            <div className="p-2 bg-dark-50 dark:bg-dark-800 rounded-[9px] text-dark-550 dark:text-dark-300 group-hover:bg-primary-50 dark:group-hover:bg-primary-950/25 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all duration-300">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className={cn(
            "font-bold tracking-tight text-dark-900 dark:text-white transition-all",
            String(value).length > 16 
              ? "text-md sm:text-lg" 
              : String(value).length > 11 
              ? "text-lg sm:text-xl" 
              : "text-2xl"
          )}>
            {value}
          </span>
          {trend && TrendIcon && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm',
                trendColor
              )}
            >
              <TrendIcon className="w-3.5 h-3.5" />
              <span>{Math.abs(trend.value)}%</span>
            </span>
          )}
        </div>

        {description && (
          <p className="mt-2 text-2xs text-dark-400 dark:text-dark-500 font-medium">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
