import type { Request, Response } from 'express';
import { ok } from '../../../shared/utils/response';
import { ListLocaisDiaService } from '../services/ListLocaisDiaService';
import { ListRotasDiaService } from '../services/ListRotasDiaService';
import { ListVeiculosAtivosService } from '../services/ListVeiculosAtivosService';

export class MonitoramentoController {
  private readonly veiculosService = new ListVeiculosAtivosService();
  private readonly rotasService = new ListRotasDiaService();
  private readonly locaisService = new ListLocaisDiaService();

  listVeiculos = async (_req: Request, res: Response): Promise<Response> => {
    const veiculos = await this.veiculosService.execute();
    return ok(res, { veiculos });
  };

  listRotas = async (_req: Request, res: Response): Promise<Response> => {
    const rotas = await this.rotasService.execute();
    return ok(res, { rotas });
  };

  listLocais = async (_req: Request, res: Response): Promise<Response> => {
    const locais = await this.locaisService.execute();
    return ok(res, { locais });
  };
}
