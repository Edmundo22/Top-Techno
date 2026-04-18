import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { ErrorMessages } from '../errors/errorMessages';
import { logger } from '../utils/logger';

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: ErrorMessages.validation.invalidBody,
      details: err.flatten().fieldErrors,
    });
  }

  logger.error({ err, path: req.path, method: req.method }, 'Erro não tratado');
  return res.status(500).json({ error: ErrorMessages.internal.unexpected });
}
