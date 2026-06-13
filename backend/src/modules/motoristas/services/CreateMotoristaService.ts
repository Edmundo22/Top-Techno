import { MotoristaRepository } from '../repositories/MotoristaRepository';
import type { CreateMotoristaBody } from '../schemas/motorista.schemas';
import { MotoristaDTO, mapMotoristaRowToDTO } from './ListMotoristasService';

export class CreateMotoristaService {
  constructor(private readonly repository = new MotoristaRepository()) {}

  async execute(body: CreateMotoristaBody): Promise<MotoristaDTO> {
    const row = await this.repository.create({
      motorista: body.motorista,
      cnh: body.cnh,
      cpf: body.cpf ?? null,
      telfone: body.telfone ?? null,
      obs: body.obs ?? null,
    });
    return mapMotoristaRowToDTO(row);
  }
}
