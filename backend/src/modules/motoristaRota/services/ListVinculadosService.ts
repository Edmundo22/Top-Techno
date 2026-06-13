import { toIsoLocal } from '../../../shared/utils/datetime';
import { MotoristaRotaRepository, VinculadoRow } from '../repositories/MotoristaRotaRepository';

export interface VinculadoDTO {
  idCadMotRota: number;
  idCadMot: number;
  motorista: string | null;
  cnh: string | null;
  titular: boolean;
  dtInsercao: string | null;
}

export function mapVinculadoRowToDTO(row: VinculadoRow): VinculadoDTO {
  return {
    idCadMotRota: row.ID_CAD_MOT_ROTA,
    idCadMot: row.ID_CAD_MOT,
    motorista: row.MOTORISTA,
    cnh: row.CNH,
    titular: Boolean(row.TITULAR),
    dtInsercao: toIsoLocal(row.DT_INSERCAO),
  };
}

export class ListVinculadosService {
  constructor(private readonly repository = new MotoristaRotaRepository()) {}

  async execute(idFt: number): Promise<VinculadoDTO[]> {
    const rows = await this.repository.listVinculados(idFt);
    return rows.map(mapVinculadoRowToDTO);
  }
}
