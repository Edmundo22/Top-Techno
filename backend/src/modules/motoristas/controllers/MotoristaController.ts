import type { Request, Response } from 'express';
import { ok } from '../../../shared/utils/response';
import type {
  CreateMotoristaBody,
  MotoristaIdParam,
  UpdateMotoristaBody,
} from '../schemas/motorista.schemas';
import { CreateMotoristaService } from '../services/CreateMotoristaService';
import { DeleteMotoristaService } from '../services/DeleteMotoristaService';
import { ListMotoristasService } from '../services/ListMotoristasService';
import { UpdateMotoristaService } from '../services/UpdateMotoristaService';

export class MotoristaController {
  private readonly listService = new ListMotoristasService();
  private readonly createService = new CreateMotoristaService();
  private readonly updateService = new UpdateMotoristaService();
  private readonly deleteService = new DeleteMotoristaService();

  list = async (_req: Request, res: Response): Promise<Response> => {
    const motoristas = await this.listService.execute();
    return ok(res, { motoristas });
  };

  create = async (req: Request, res: Response): Promise<Response> => {
    const body = req.body as CreateMotoristaBody;
    const motorista = await this.createService.execute(body);
    return ok(res, { motorista }, 201);
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const { id } = (req as unknown as { validatedParams: MotoristaIdParam }).validatedParams;
    const body = req.body as UpdateMotoristaBody;
    const motorista = await this.updateService.execute(id, body);
    return ok(res, { motorista });
  };

  remove = async (req: Request, res: Response): Promise<Response> => {
    const { id } = (req as unknown as { validatedParams: MotoristaIdParam }).validatedParams;
    await this.deleteService.execute(id);
    return ok(res, { success: true });
  };
}
