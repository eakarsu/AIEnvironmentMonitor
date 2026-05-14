import rateLimit from 'express-rate-limit';
import { Request } from 'express';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req: Request & { user?: { id: number } }) =>
    req.user ? `user:${req.user.id}` : req.ip || 'unknown',
  message: { error: 'AI rate limit exceeded. Max 20 requests/hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});
