import { AppError } from '../../../shared/errors/AppError';
import { LocalRepository } from '../repositories/LocalRepository';
import type { UpdateLocalBody } from '../schemas/local.schemas';
import { LocalDTO, mapLocalRowToDTO } from './ListLocaisService';

export class UpdateLocalService {
  constructor(private readonly repository = new LocalRepository()) {}

  async execute(id: number, body: UpdateLocalBody): Promise<LocalDTO> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new AppError('Local não encontrado', 404);
    }
    const updated = await this.repository.update(id, {
      codigoPonto: body.codigoPonto,
      endereco: body.endereco,
      latitude: body.latitude,
      longitude: body.longitude,
      raio: body.raio,
      pontoParada: body.pontoParada ?? null,
      poligonoWkt: body.poligonoWkt ?? null,
    });
    if (!updated) {
      throw new AppError('Local não encontrado', 404);
    }
    return mapLocalRowToDTO(updated);
  }
}
