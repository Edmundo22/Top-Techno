import { Router } from 'express';
import { authMiddleware } from '../../../shared/middlewares/authMiddleware';
import { validateBody, validateParams } from '../../../shared/middlewares/validate';
import { LocalController } from '../controllers/LocalController';
import {
  createLocalBodySchema,
  localIdParamSchema,
  updateLocalBodySchema,
} from '../schemas/local.schemas';

const localRoutes = Router();
const controller = new LocalController();

localRoutes.use(authMiddleware);

localRoutes.get('/', controller.list);
localRoutes.post('/', validateBody(createLocalBodySchema), controller.create);
localRoutes.put(
  '/:id',
  validateParams(localIdParamSchema),
  validateBody(updateLocalBodySchema),
  controller.update,
);
localRoutes.delete('/:id', validateParams(localIdParamSchema), controller.remove);

export { localRoutes };
