import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';
import { validateBody, validateParams } from '../../../shared/middlewares/validate';
import { MotoristaController } from '../controllers/MotoristaController';
import {
  createMotoristaBodySchema,
  motoristaIdParamSchema,
  updateMotoristaBodySchema,
} from '../schemas/motorista.schemas';

const motoristaRoutes = Router();
const controller = new MotoristaController();

motoristaRoutes.use(authMiddleware);

motoristaRoutes.get('/', controller.list);
motoristaRoutes.post('/', validateBody(createMotoristaBodySchema), controller.create);
motoristaRoutes.put(
  '/:id',
  validateParams(motoristaIdParamSchema),
  validateBody(updateMotoristaBodySchema),
  controller.update,
);
motoristaRoutes.delete('/:id', validateParams(motoristaIdParamSchema), controller.remove);

export { motoristaRoutes };
