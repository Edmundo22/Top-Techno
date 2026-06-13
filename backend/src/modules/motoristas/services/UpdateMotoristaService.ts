import { AppError } from '../../../shared/errors/AppError';
import { MotoristaRepository } from '../repositories/MotoristaRepository';
import type { UpdateMotoristaBody } from '../schemas/motorista.schemas';
import { MotoristaDTO, mapMotoristaRowToDTO } from './ListMotoristasService';

export class UpdateMotoristaService {
  constructor(private readonly repository = new MotoristaRepository()) {}

  async execute(id: number, body: UpdateMotoristaBody): Promise<MotoristaDTO> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError('Motorista não encontrado', 404);
    }
    const updated = await this.repository.update(id, {
      motorista: body.motorista,
      cnh: body.cnh,
      cpf: body.cpf ?? null,
      telfone: body.telfone ?? null,
      obs: body.obs ?? null,
    });
    if (!updated) {
      throw new AppError('Motorista não encontrado', 404);
    }
    return mapMotoristaRowToDTO(updated);
  }
}
