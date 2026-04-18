import type { CookieOptions } from 'express';
import { env } from './env';

const maxAgeMs = env.COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

export const authConfig = {
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  cookie: {
    name: env.COOKIE_NAME,
    maxAgeMs,
    options: {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAMESITE,
      domain: env.COOKIE_DOMAIN || undefined,
      path: '/',
      maxAge: maxAgeMs,
    } satisfies CookieOptions,
  },
};
