import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

// Run after express-validator chains to collect and forward errors uniformly
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  next(new ApiError(400, 'Validation failed', formatted));
};

export default validate;
