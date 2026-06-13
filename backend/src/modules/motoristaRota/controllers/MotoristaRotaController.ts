import type { Request, Response } from 'express';
import { ok } from '../../../shared/utils/response';
import type {
  IdCadMotRotaParam,
  IdFtQuery,
  SetTitularBody,
  VincularBody,
} from '../schemas/motoristaRota.schemas';
import { DesvincularService } from '../services/DesvincularService';
import { ListDisponiveisService } from '../services/ListDisponiveisService';
import { ListRotasFtService } from '../services/ListRotasFtService';
import { ListVinculadosService } from '../services/ListVinculadosService';
import { SetTitularService } from '../services/SetTitularService';
import { VincularMotoristasService } from '../services/VincularMotoristasService';

export class MotoristaRotaController {
  private readonly listRotasService = new ListRotasFtService();
  private readonly listVinculadosService = new ListVinculadosService();
  private readonly listDisponiveisService = new ListDisponiveisService();
  private readonly vincularService = new VincularMotoristasService();
  private readonly setTitularService = new SetTitularService();
  private readonly desvincularService = new DesvincularService();

  listRotas = async (_req: Request, res: Response): Promise<Response> => {
    const rotas = await this.listRotasService.execute();
    return ok(res, { rotas });
  };

  listVinculados = async (req: Request, res: Response): Promise<Response> => {
    const { idFt } = (req as unknown as { validatedQuery: IdFtQuery }).validatedQuery;
    const vinculados = await this.listVinculadosService.execute(idFt);
    return ok(res, { vinculados });
  };

  listDisponiveis = async (req: Request, res: Response): Promise<Response> => {
    const { idFt } = (req as unknown as { validatedQuery: IdFtQuery }).validatedQuery;
    const disponiveis = await this.listDisponiveisService.execute(idFt);
    return ok(res, { disponiveis });
  };

  vincular = async (req: Request, res: Response): Promise<Response> => {
    const body = req.body as VincularBody;
    await this.vincularService.execute(body.idFt, body.idsCadMot);
    return ok(res, { success: true }, 201);
  };

  setTitular = async (req: Request, res: Response): Promise<Response> => {
    const body = req.body as SetTitularBody;
    await this.setTitularService.execute(body.idFt, body.idCadMot, body.titular);
    return ok(res, { success: true });
  };

  desvincular = async (req: Request, res: Response): Promise<Response> => {
    const { idCadMotRota } = (req as unknown as { validatedParams: IdCadMotRotaParam })
      .validatedParams;
    await this.desvincularService.execute(idCadMotRota);
    return ok(res, { success: true });
  };
}
