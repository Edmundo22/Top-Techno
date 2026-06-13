import { Router } from 'express';
import { authRoutes } from '../../modules/auth/routes/auth.routes';
import { historicoRoutes } from '../../modules/historico/routes/historico.routes';
import { localRoutes } from '../../modules/locais/routes/local.routes';
import { monitoramentoRoutes } from '../../modules/monitoramento/routes/monitoramento.routes';
import { motoristaRoutes } from '../../modules/motoristas/routes/motorista.routes';
import { usuarioRoutes } from '../../modules/usuarios/routes/usuario.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/monitoramento', monitoramentoRoutes);
router.use('/historico', historicoRoutes);
router.use('/locais', localRoutes);
router.use('/motoristas', motoristaRoutes);

export { router };
