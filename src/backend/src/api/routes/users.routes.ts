import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { userService } from '../../services';
import { storeReturnTo } from '../../middleware';
import { catchAsync } from '../../utils';

const router = Router();

/**
 * GET /register - Render registration form
 */
router.get('/register', (_req: Request, res: Response) => {
  res.render('users/register');
});

/**
 * POST /register - Register new user
 */
router.post(
  '/register',
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, username, password } = req.body;
      const registeredUser = await userService.registerUser(email, username, password);

      if (!registeredUser) {
        req.flash('error', 'Registration failed');
        return res.redirect('/register');
      }

      req.login(registeredUser, (err) => {
        if (err) return next(err);
        req.flash('success', 'Welcome to ReCamp!');
        res.redirect('/campgrounds');
      });
    } catch (error: any) {
      req.flash('error', error.message);
      res.redirect('/register');
    }
  })
);

/**
 * GET /login - Render login form
 */
router.get('/login', (_req: Request, res: Response) => {
  res.render('users/login');
});

/**
 * POST /login - Login user
 */
router.post(
  '/login',
  storeReturnTo,
  passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/login',
  }),
  (req: Request, res: Response) => {
    req.flash('success', 'Welcome back!');
    const redirectUrl = (res.locals.returnTo as string) || '/campgrounds';
    res.redirect(redirectUrl);
  }
);

/**
 * GET /logout - Logout user
 */
router.get('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash('success', 'Goodbye!');
    res.redirect('/campgrounds');
  });
});

export default router;
