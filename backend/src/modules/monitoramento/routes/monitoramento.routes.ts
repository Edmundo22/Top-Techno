import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';
import { validateQuery } from '../../../shared/middlewares/validate';
import { MonitoramentoController } from '../controllers/MonitoramentoController';
import { viagemEntradasQuerySchema } from '../schemas/viagemEntradas.schema';
import { viagemPosicoesQuerySchema } from '../schemas/viagemPosicoes.schema';

const monitoramentoRoutes = Router();
const controller = new MonitoramentoController();

monitoramentoRoutes.use(authMiddleware);

monitoramentoRoutes.get('/veiculos', controller.listVeiculos);
monitoramentoRoutes.get('/rotas', controller.listRotas);
monitoramentoRoutes.get('/locais', controller.listLocais);
monitoramentoRoutes.get(
  '/viagem-entradas',
  validateQuery(viagemEntradasQuerySchema),
  controller.listViagemEntradas,
);
monitoramentoRoutes.get(
  '/viagem-posicoes',
  validateQuery(viagemPosicoesQuerySchema),
  controller.listViagemPosicoes,
);

export { monitoramentoRoutes };
