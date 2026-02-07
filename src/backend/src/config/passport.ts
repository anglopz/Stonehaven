import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../models/User';

/**
 * Passport authentication configuration
 */
export const configurePassport = (): void => {
  // Use the local strategy with passport-local-mongoose
  passport.use(new LocalStrategy(User.authenticate()));

  // Serialize and deserialize user instances to and from the session
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
};
