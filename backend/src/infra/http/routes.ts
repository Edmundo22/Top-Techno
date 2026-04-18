import { Router } from 'express';
import { authRoutes } from '../../modules/auth/routes/auth.routes';
import { usuarioRoutes } from '../../modules/usuarios/routes/usuario.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);

export { router };
