import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes dynamically
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format numbers for human consumption
export function formatNumber(num: number | string | null | undefined, decimals = 0): string {
  if (num === null || num === undefined || isNaN(Number(num))) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(num));
}

// Format numbers compactly (e.g. 3.2M, 1.5B, 3T) for clean layouts
export function formatCompactNumber(num: number | string | null | undefined, decimals = 2): string {
  if (num === null || num === undefined || isNaN(Number(num))) return '0';
  const val = Number(num);
  if (Math.abs(val) < 1000000) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  }
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: decimals,
  }).format(val);
}

// Format percentage values
export function formatPercentage(num: number | null | undefined, decimals = 1): string {
  if (num === null || num === undefined || isNaN(Number(num))) return '0%';
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(num))}%`;
}

// Format ISO date strings to human-readable strings
export function formatDate(dateString: string | null | undefined, includeTime = false): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    return '-';
  }
}
