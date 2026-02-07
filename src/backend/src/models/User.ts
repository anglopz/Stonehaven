import mongoose, { Schema } from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add passport-local-mongoose plugin
// This adds username, hash, and salt fields automatically
userSchema.plugin(passportLocalMongoose);

export const User = mongoose.model<IUser>('User', userSchema);
