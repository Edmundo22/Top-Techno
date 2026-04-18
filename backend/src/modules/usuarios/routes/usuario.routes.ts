import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';
import { UsuarioController } from '../controllers/UsuarioController';

const usuarioRoutes = Router();
const controller = new UsuarioController();

usuarioRoutes.use(authMiddleware);

usuarioRoutes.get('/', controller.list);

export { usuarioRoutes };
