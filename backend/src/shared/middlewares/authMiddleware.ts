import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { authConfig } from '../../config/auth';
import { AppError } from '../errors/AppError';
import { ErrorMessages } from '../errors/errorMessages';

interface TokenPayload extends JwtPayload {
  usuario: string;
  email: string;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[authConfig.cookie.name];

  if (!token) {
    throw new AppError(ErrorMessages.auth.notAuthenticated, 401);
  }

  try {
    const decoded = jwt.verify(token, authConfig.jwt.secret) as unknown as TokenPayload;
    if (!decoded.sub || !decoded.usuario || !decoded.email) {
      throw new AppError(ErrorMessages.auth.notAuthenticated, 401);
    }
    req.user = {
      sub: Number(decoded.sub),
      usuario: decoded.usuario,
      email: decoded.email,
    };
    return next();
  } catch {
    throw new AppError(ErrorMessages.auth.notAuthenticated, 401);
  }
}
