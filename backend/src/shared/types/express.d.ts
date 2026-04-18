import 'express';

declare global {
  namespace Express {
    interface UserPayload {
      sub: number;
      usuario: string;
      email: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
