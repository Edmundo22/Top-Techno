import type { Request, Response } from 'express';
import { ok } from '../../../shared/utils/response';
import type { CreateLocalBody, LocalIdParam, UpdateLocalBody } from '../schemas/local.schemas';
import { CreateLocalService } from '../services/CreateLocalService';
import { DeleteLocalService } from '../services/DeleteLocalService';
import { ListLocaisService } from '../services/ListLocaisService';
import { UpdateLocalService } from '../services/UpdateLocalService';

export class LocalController {
  private readonly listService = new ListLocaisService();
  private readonly createService = new CreateLocalService();
  private readonly updateService = new UpdateLocalService();
  private readonly deleteService = new DeleteLocalService();

  list = async (_req: Request, res: Response): Promise<Response> => {
    const locais = await this.listService.execute();
    return ok(res, { locais });
  };

  create = async (req: Request, res: Response): Promise<Response> => {
    const body = req.body as CreateLocalBody;
    const local = await this.createService.execute(body);
    return ok(res, { local }, 201);
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const { id } = (req as unknown as { validatedParams: LocalIdParam }).validatedParams;
    const body = req.body as UpdateLocalBody;
    const local = await this.updateService.execute(id, body);
    return ok(res, { local });
  };

  remove = async (req: Request, res: Response): Promise<Response> => {
    const { id } = (req as unknown as { validatedParams: LocalIdParam }).validatedParams;
    await this.deleteService.execute(id);
    return ok(res, { success: true });
  };
}
