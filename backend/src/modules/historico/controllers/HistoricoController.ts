import type { Request, Response } from 'express';
import { ok } from '../../../shared/utils/response';
import { historicoQuerySchema } from '../schemas/historico.schemas';
import { ListLocaisHistoricoService } from '../services/ListLocaisHistoricoService';
import { ListPosicoesHistoricoService } from '../services/ListPosicoesHistoricoService';
import { ListRotasHistoricoService } from '../services/ListRotasHistoricoService';

export class HistoricoController {
  private readonly posicoesService = new ListPosicoesHistoricoService();
  private readonly rotasService = new ListRotasHistoricoService();
  private readonly locaisService = new ListLocaisHistoricoService();

  listPosicoes = async (req: Request, res: Response): Promise<Response> => {
    const { data } = historicoQuerySchema.parse(req.query);
    const posicoes = await this.posicoesService.execute(data);
    return ok(res, { posicoes });
  };

  listRotas = async (req: Request, res: Response): Promise<Response> => {
    const { data } = historicoQuerySchema.parse(req.query);
    const rotas = await this.rotasService.execute(data);
    return ok(res, { rotas });
  };

  listLocais = async (req: Request, res: Response): Promise<Response> => {
    const { data } = historicoQuerySchema.parse(req.query);
    const locais = await this.locaisService.execute(data);
    return ok(res, { locais });
  };
}
