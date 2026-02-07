import { Document, Types } from 'mongoose';

/**
 * TypeScript interfaces for Mongoose models
 */

export interface IImage {
  url: string;
  filename: string;
  thumbnail?: string;
  small?: string;
  medium?: string;
}

export interface IGeometry {
  type: 'Point';
  coordinates: [number, number];
}

export interface IReview extends Document {
  _id: Types.ObjectId;
  body: string;
  rating: number;
  author: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICampground extends Document {
  _id: Types.ObjectId;
  title: string;
  images: IImage[];
  geometry: IGeometry;
  price: number;
  description: string;
  location: string;
  author: Types.ObjectId;
  reviews: Types.ObjectId[];
  properties?: {
    popUpMarkup: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
