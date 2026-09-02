import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  ...new Set([
    ...configuredOrigins,
    ...(process.env.NODE_ENV !== 'production'
      ? defaultDevOrigins
      : []),
  ]),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, '');

      console.log('[CORS] Origin:', normalizedOrigin);
      console.log('[CORS] Allowed:', allowedOrigins);

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.error(
        `[CORS] BLOCKED origin: ${normalizedOrigin}`
      );

      return callback(
        new Error(`CORS: origin ${normalizedOrigin} not allowed`)
      );
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PATCH',
      'PUT',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],

    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Basic protection against brute-force login/refresh abuse
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/refresh', authLimiter);

app.use('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Api is healthy and working and ready for work thanks."
  })
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
