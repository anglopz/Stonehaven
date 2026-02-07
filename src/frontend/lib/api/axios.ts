/**
 * Axios configuration with interceptors
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_URL } from '../constants';

/**
 * Create Axios instance with base configuration
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token or modify requests
 */
apiClient.interceptors.request.use(
  (config) => {
    // You can add additional headers here if needed
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle responses and errors
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle specific error codes
    if (error.response?.status === 401) {
      // Unauthorized - could redirect to login
      console.error('Unauthorized access');
    }

    if (error.response?.status === 403) {
      // Forbidden
      console.error('Forbidden access');
    }

    if (error.response?.status === 404) {
      // Not found
      console.error('Resource not found');
    }

    return Promise.reject(error);
  }
);
