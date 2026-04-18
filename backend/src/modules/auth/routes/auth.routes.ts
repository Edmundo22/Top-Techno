import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';
import { loginRateLimiter } from '../../../shared/middlewares/rateLimitMiddleware';
import { validateBody } from '../../../shared/middlewares/validate';
import { AuthController } from '../controllers/AuthController';
import { loginSchema } from '../schemas/login.schema';

const authRoutes = Router();
const controller = new AuthController();

authRoutes.post('/login', loginRateLimiter, validateBody(loginSchema), controller.login);
authRoutes.get('/me', authMiddleware, controller.me);
authRoutes.post('/logout', controller.logout);

export { authRoutes };
