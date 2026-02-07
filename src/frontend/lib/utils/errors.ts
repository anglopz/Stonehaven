/**
 * Error handling utilities
 */

import { ApiError } from '@/types';
import axios, { AxiosError } from 'axios';

/**
 * Parse error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    return axiosError.response?.data?.message || axiosError.message || 'An error occurred';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

/**
 * Parse validation errors from API response
 */
export function getValidationErrors(error: unknown): Record<string, string> | null {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    const errors = axiosError.response?.data?.errors;
    
    if (errors) {
      // Convert array of errors to single string per field
      return Object.entries(errors).reduce((acc, [key, messages]) => {
        acc[key] = Array.isArray(messages) ? messages[0] : messages;
        return acc;
      }, {} as Record<string, string>);
    }
  }

  return null;
}
