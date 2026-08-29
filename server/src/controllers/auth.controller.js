import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from '../utils/tokens.js';
import { recordAudit } from '../services/auditLog.service.js';

// POST /api/auth/login  (FR-C1)
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required.');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw new ApiError(401, 'Invalid email or password.');
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated.');

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password.');

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());

  await recordAudit({
    userId: user._id,
    action: 'auth.login',
    entityType: 'User',
    entityId: user._id,
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: user.toSafeObject(), accessToken },
        'Logged in successfully'
      )
    );
});

// POST /api/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw new ApiError(401, 'No refresh token provided.');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token.');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'User no longer valid.');
  if ((user.refreshTokenVersion || 0) !== payload.v) {
    throw new ApiError(401, 'Refresh token has been revoked.');
  }

  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions());

  res.status(200).json(new ApiResponse(200, { accessToken }, 'Access token refreshed'));
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(200).json(new ApiResponse(200, null, 'Logged out'));
});

// POST /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'currentPassword and newPassword are required.');
  }
  if (newPassword.length < 8) {
    throw new ApiError(400, 'newPassword must be at least 8 characters.');
  }

  const user = await User.findById(req.user._id).select('+passwordHash');
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw new ApiError(401, 'Current password is incorrect.');

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;
  user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1; // invalidate old sessions
  await user.save();

  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });

  await recordAudit({
    userId: user._id,
    action: 'auth.change_password',
    entityType: 'User',
    entityId: user._id,
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, 'Password changed. Please log in again.'));
});

// GET /api/auth/me — quick way to fetch the current session's user
export const me = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { user: req.user.toSafeObject() }));
});
