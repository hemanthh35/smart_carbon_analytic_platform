import React from 'react';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { FolderOpen } from 'lucide-react';
import { cn } from '../../utils/helpers';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  className,
}) => {
  return (
    <Card className={cn('w-full border-dashed border-2 p-8 text-center', className)}>
      <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
        <div className="p-4 bg-dark-50 dark:bg-dark-800 rounded-full text-dark-400 dark:text-dark-500 shadow-inner">
          {icon || <FolderOpen className="w-10 h-10" />}
        </div>
        
        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-base font-bold text-dark-900 dark:text-dark-100">
            {title}
          </h3>
          <p className="text-xs text-dark-450 dark:text-dark-400 leading-normal">
            {description}
          </p>
        </div>

        {actionText && onAction && (
          <Button onClick={onAction} variant="outline" className="mt-2">
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
