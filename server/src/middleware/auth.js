import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/tokens.js';
import User from '../models/User.js';

/**
 * Verifies the Bearer access token on the Authorization header and attaches
 * the authenticated user document to req.user.
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Authentication required. No access token provided.');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired access token.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'User belonging to this token no longer exists.');
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated.');

  req.user = user;
  next();
});

/**
 * Role-based access control middleware factory (FR-C1).
 * Usage: authorize('admin'), authorize('admin', 'supervisor')
 */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required.'));
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Role '${req.user.role}' is not permitted to perform this action.`)
      );
    }
    next();
  };
