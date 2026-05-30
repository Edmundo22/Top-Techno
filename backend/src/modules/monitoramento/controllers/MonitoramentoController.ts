import type { Request, Response } from 'express';
import { ok } from '../../../shared/utils/response';
import { ListLocaisDiaService } from '../services/ListLocaisDiaService';
import { ListRotasDiaService } from '../services/ListRotasDiaService';
import { ListVeiculosAtivosService } from '../services/ListVeiculosAtivosService';
import { ListViagemEntradasService } from '../services/ListViagemEntradasService';
import { ListViagemPosicoesService } from '../services/ListViagemPosicoesService';
import type { ViagemEntradasQuery } from '../schemas/viagemEntradas.schema';
import type { ViagemPosicoesQuery } from '../schemas/viagemPosicoes.schema';

export class MonitoramentoController {
  private readonly veiculosService = new ListVeiculosAtivosService();
  private readonly rotasService = new ListRotasDiaService();
  private readonly locaisService = new ListLocaisDiaService();
  private readonly viagemEntradasService = new ListViagemEntradasService();
  private readonly viagemPosicoesService = new ListViagemPosicoesService();

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

  listViagemEntradas = async (req: Request, res: Response): Promise<Response> => {
    const { idViagem } = (req as unknown as { validatedQuery: ViagemEntradasQuery }).validatedQuery;
    const entradas = await this.viagemEntradasService.execute(idViagem);
    return ok(res, { entradas });
  };

  listViagemPosicoes = async (req: Request, res: Response): Promise<Response> => {
    const { idViagem } = (req as unknown as { validatedQuery: ViagemPosicoesQuery }).validatedQuery;
    const posicoes = await this.viagemPosicoesService.execute(idViagem);
    return ok(res, { posicoes });
  };
}
