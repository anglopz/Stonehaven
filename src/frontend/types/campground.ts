/**
 * Campground Types
 */

import { User } from './user';
import { Review } from './review';

export interface Image {
  url: string;
  filename: string;
  thumbnail?: string;
  small?: string;
  medium?: string;
  card?: string;
}

export interface Geometry {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Campground {
  _id: string;
  title: string;
  images: Image[];
  geometry: Geometry;
  price: number;
  description: string;
  location: string;
  author: User | string;
  reviews: Review[] | string[];
  properties?: {
    popUpMarkup: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CampgroundFormData {
  title: string;
  location: string;
  price: number;
  description: string;
  images?: File[];
  deleteImages?: string[];
}

export interface CampgroundFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
}
