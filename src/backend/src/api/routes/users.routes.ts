import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { userService } from '../../services';
import { storeReturnTo } from '../../middleware';
import { catchAsync } from '../../utils';

const router = Router();

/**
 * GET /api/user/me - Current user (for React frontend)
 */
router.get('/api/user/me', (req: Request, res: Response) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  const user = req.user as { _id: unknown; username?: string; email?: string };
  return res.json({ _id: user._id, username: user.username, email: user.email });
});

/**
 * GET /register - 404 (React serves the page)
 */
router.get('/register', (_req: Request, res: Response) => {
  return res.status(404).json({ success: false, message: 'Not found' });
});

/**
 * POST /register - Register new user (JSON API)
 */
router.post(
  '/register',
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, username, password } = req.body;
      const registeredUser = await userService.registerUser(email, username, password);

      if (!registeredUser) {
        return res.status(400).json({ success: false, message: 'Registration failed' });
      }

      req.login(registeredUser, (err) => {
        if (err) return next(err);
        const user = registeredUser as { _id: unknown; username?: string; email?: string };
        res.status(201).json({ _id: user._id, username: user.username, email: user.email });
      });
      return;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      return res.status(400).json({ success: false, message });
    }
  })
);

/**
 * GET /login - 404 (React serves the page)
 */
router.get('/login', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

/**
 * POST /login - Login user (JSON API)
 */
router.post(
  '/login',
  storeReturnTo,
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: Error | null, user: Express.User | false) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const u = user as { _id: unknown; username?: string; email?: string };
        res.json({ _id: u._id, username: u.username, email: u.email });
      });
    })(req, res, next);
  }
);

/**
 * GET /logout - Logout user (JSON API)
 */
router.get('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.json({ success: true, message: 'Goodbye!' });
  });
});

export default router;
