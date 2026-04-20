import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';
import { MonitoramentoController } from '../controllers/MonitoramentoController';

const monitoramentoRoutes = Router();
const controller = new MonitoramentoController();

monitoramentoRoutes.use(authMiddleware);

monitoramentoRoutes.get('/veiculos', controller.listVeiculos);
monitoramentoRoutes.get('/rotas', controller.listRotas);
monitoramentoRoutes.get('/locais', controller.listLocais);

export { monitoramentoRoutes };
