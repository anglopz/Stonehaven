import mongoose, { Schema } from 'mongoose';
import { IReview } from '../types';

const reviewSchema = new Schema<IReview>(
  {
    body: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Review = mongoose.model<IReview>('Review', reviewSchema);
