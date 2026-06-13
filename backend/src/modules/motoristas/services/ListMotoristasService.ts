import { MotoristaRepository, MotoristaRow } from '../repositories/MotoristaRepository';

export interface MotoristaDTO {
  idCadMot: number;
  motorista: string | null;
  cnh: string | null;
  cpf: string | null;
  telfone: string | null;
  obs: string | null;
}

// Ponto único de mapeamento Row → DTO; reusado por Create/Update.
export function mapMotoristaRowToDTO(row: MotoristaRow): MotoristaDTO {
  return {
    idCadMot: row.ID_CAD_MOT,
    motorista: row.MOTORISTA,
    cnh: row.CNH,
    cpf: row.CPF,
    telfone: row.TELFONE,
    obs: row.OBS,
  };
}

export class ListMotoristasService {
  constructor(private readonly repository = new MotoristaRepository()) {}

  async execute(): Promise<MotoristaDTO[]> {
    const rows = await this.repository.list();
    return rows.map(mapMotoristaRowToDTO);
  }
}
