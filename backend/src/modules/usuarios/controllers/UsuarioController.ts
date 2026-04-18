import type { Request, Response } from 'express';
import { ok } from '../../../shared/utils/response';
import { ListUsuarioService } from '../services/ListUsuarioService';

export class UsuarioController {
  private readonly listService = new ListUsuarioService();

  list = async (_req: Request, res: Response): Promise<Response> => {
    const usuarios = await this.listService.execute();
    return ok(res, { usuarios });
  };
}
