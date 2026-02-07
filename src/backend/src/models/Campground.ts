import mongoose, { Schema } from 'mongoose';
import { ICampground, IImage } from '../types';
import { Review } from './Review';

const imageSchema = new Schema<IImage>(
  {
    url: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual properties for different image sizes using Cloudinary transformations
imageSchema.virtual('thumbnail').get(function (this: IImage) {
  return this.url.replace('/upload', '/upload/w_200,h_200,c_fill,q_auto:low');
});

imageSchema.virtual('small').get(function (this: IImage) {
  return this.url.replace('/upload', '/upload/w_400,q_auto:good');
});

imageSchema.virtual('medium').get(function (this: IImage) {
  return this.url.replace('/upload', '/upload/w_800,q_auto:good');
});

const campgroundSchema = new Schema<ICampground>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    images: [imageSchema],
    geometry: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property for map popup markup
campgroundSchema.virtual('properties.popUpMarkup').get(function (this: ICampground) {
  const imageUrl =
    this.images && this.images[0] ? this.images[0].url : '/images/default-campground.jpg';

  return `
    <div class="map-popup" style="max-width: 250px;">
      <div class="popup-image" style="height: 120px; overflow: hidden; border-radius: 8px 8px 0 0;">
        <img src="${imageUrl}" 
             alt="${this.title}" 
             style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div class="popup-content" style="padding: 12px;">
        <h6 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">
          ${this.title}
        </h6>
        <p style="margin: 0 0 5px 0; color: #666; font-size: 12px;">
          📍 ${this.location}
        </p>
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #198754;">
          $${this.price}/night
        </p>
        <a href="/campgrounds/${this._id}" 
           class="btn-view" 
           style="display: inline-block; padding: 6px 12px; background: #198754; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">
          View Details
        </a>
      </div>
    </div>
  `;
});

// Middleware to delete associated reviews when a campground is deleted
campgroundSchema.post('findOneAndDelete', async function (doc: ICampground | null) {
  if (doc && doc.reviews.length > 0) {
    await Review.deleteMany({
      _id: { $in: doc.reviews },
    });
  }
});

export const Campground = mongoose.model<ICampground>('Campground', campgroundSchema);
