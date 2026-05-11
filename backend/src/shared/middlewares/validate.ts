import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.parse(req.body);
    req.body = parsed as unknown as typeof req.body;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.parse(req.query);
    (req as unknown as { validatedQuery: T }).validatedQuery = parsed;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.parse(req.params);
    (req as unknown as { validatedParams: T }).validatedParams = parsed;
    next();
  };
}
