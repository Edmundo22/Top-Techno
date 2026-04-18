import rateLimit from 'express-rate-limit';
import { ErrorMessages } from '../errors/errorMessages';

export const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: ErrorMessages.auth.tooManyAttempts },
});
