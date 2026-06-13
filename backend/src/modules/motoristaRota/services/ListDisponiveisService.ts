import { DisponivelRow, MotoristaRotaRepository } from '../repositories/MotoristaRotaRepository';

export interface DisponivelDTO {
  idCadMot: number;
  motorista: string | null;
  cnh: string | null;
}

export function mapDisponivelRowToDTO(row: DisponivelRow): DisponivelDTO {
  return {
    idCadMot: row.ID_CAD_MOT,
    motorista: row.MOTORISTA,
    cnh: row.CNH,
  };
}

export class ListDisponiveisService {
  constructor(private readonly repository = new MotoristaRotaRepository()) {}

  async execute(idFt: number): Promise<DisponivelDTO[]> {
    const rows = await this.repository.listDisponiveis(idFt);
    return rows.map(mapDisponivelRowToDTO);
  }
}
