import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../../../shared/middlewares/validate';
import { MotoristaRotaController } from '../controllers/MotoristaRotaController';
import {
  idCadMotRotaParamSchema,
  idFtQuerySchema,
  setTitularBodySchema,
  vincularBodySchema,
} from '../schemas/motoristaRota.schemas';

const motoristaRotaRoutes = Router();
const controller = new MotoristaRotaController();

motoristaRotaRoutes.use(authMiddleware);

motoristaRotaRoutes.get('/rotas', controller.listRotas);
motoristaRotaRoutes.get('/vinculados', validateQuery(idFtQuerySchema), controller.listVinculados);
motoristaRotaRoutes.get('/disponiveis', validateQuery(idFtQuerySchema), controller.listDisponiveis);
motoristaRotaRoutes.post('/vincular', validateBody(vincularBodySchema), controller.vincular);
motoristaRotaRoutes.patch('/titular', validateBody(setTitularBodySchema), controller.setTitular);
motoristaRotaRoutes.delete(
  '/vinculo/:idCadMotRota',
  validateParams(idCadMotRotaParamSchema),
  controller.desvincular,
);

export { motoristaRotaRoutes };
