/**
 * User Types
 */

export interface User {
  _id: string;
  email: string;
  username: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}
