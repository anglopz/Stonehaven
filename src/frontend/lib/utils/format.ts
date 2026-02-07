/**
 * Formatting utility functions
 */

import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format price to currency
 */
export function formatPrice(price: number, currency = '€'): string {
  return `${currency}${price.toFixed(2)}`;
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, formatStr = 'PPP'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Format date to relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Format location (capitalize words)
 */
export function formatLocation(location: string): string {
  return location
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
