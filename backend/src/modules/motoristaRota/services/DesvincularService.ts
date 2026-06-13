import { AppError } from '../../../shared/errors/AppError';
import { MotoristaRotaRepository } from '../repositories/MotoristaRotaRepository';

export class DesvincularService {
  constructor(private readonly repository = new MotoristaRotaRepository()) {}

  async execute(idCadMotRota: number): Promise<void> {
    const deleted = await this.repository.desvincular(idCadMotRota);
    if (!deleted) {
      throw new AppError('Vínculo não encontrado', 404);
    }
  }
}
