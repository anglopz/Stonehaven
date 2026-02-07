import { IUser } from './index';
import { Types } from 'mongoose';

/**
 * Extend Express types to include user and session properties
 */
declare global {
  namespace Express {
    interface User extends IUser {
      _id: Types.ObjectId;
    }

    interface Request {
      user?: User;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    returnTo?: string;
  }
}
