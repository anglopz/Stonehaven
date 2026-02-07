/**
 * Review Types
 */

import { User } from './user';

export interface Review {
  _id: string;
  body: string;
  rating: number;
  author: User | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewFormData {
  rating: number;
  body: string;
}
