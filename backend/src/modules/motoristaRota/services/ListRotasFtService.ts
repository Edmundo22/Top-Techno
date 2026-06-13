import { MotoristaRotaRepository, RotaFtRow } from '../repositories/MotoristaRotaRepository';

export interface RotaFtDTO {
  idFt: number;
  numeroLinha: string | null;
  numeroFt: string | null;
  polyline: string | null;
}

export function mapRotaFtRowToDTO(row: RotaFtRow): RotaFtDTO {
  return {
    idFt: row.ID_FT,
    numeroLinha: row.NUMERO_LINHA,
    numeroFt: row.NUMERO_FT,
    polyline: row.POLYLINE,
  };
}

export class ListRotasFtService {
  constructor(private readonly repository = new MotoristaRotaRepository()) {}

  async execute(): Promise<RotaFtDTO[]> {
    const rows = await this.repository.listRotasFt();
    return rows.map(mapRotaFtRowToDTO);
  }
}
