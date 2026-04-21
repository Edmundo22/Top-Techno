import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';
import { HistoricoController } from '../controllers/HistoricoController';

const historicoRoutes = Router();
const controller = new HistoricoController();

historicoRoutes.use(authMiddleware);

historicoRoutes.get('/posicoes', controller.listPosicoes);
historicoRoutes.get('/rotas', controller.listRotas);
historicoRoutes.get('/locais', controller.listLocais);

export { historicoRoutes };
