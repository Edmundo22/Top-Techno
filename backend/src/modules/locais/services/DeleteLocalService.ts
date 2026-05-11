import { AppError } from '../../../shared/errors/AppError';
import { LocalRepository } from '../repositories/LocalRepository';

export class DeleteLocalService {
  constructor(private readonly repository = new LocalRepository()) {}

  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new AppError('Local não encontrado', 404);
    }
  }
}
