import { AppError } from '../../../shared/errors/AppError';
import { MotoristaRepository } from '../repositories/MotoristaRepository';

export class DeleteMotoristaService {
  constructor(private readonly repository = new MotoristaRepository()) {}

  async execute(id: number): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError('Motorista não encontrado', 404);
    }
    // Regra: não excluir motorista que ainda tem vínculo com rota.
    const vinculos = await this.repository.countVinculos(id);
    if (vinculos > 0) {
      throw new AppError('Motorista vinculado a rotas. Desvincule primeiro.', 409);
    }
    await this.repository.delete(id);
  }
}
