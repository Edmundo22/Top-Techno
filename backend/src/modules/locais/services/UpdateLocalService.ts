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
      tipoLocal: body.tipoLocal,
      codigoPonto: body.codigoPonto,
      endereco: body.endereco,
      latitude: body.latitude,
      longitude: body.longitude,
      // Ao trocar de formato, o tipo antigo é zerado: círculo→polígono limpa o
      // RAIO; polígono→círculo limpa o LOCAL_GEO. lat/lng nunca são zerados.
      raio: body.tipoLocal === 1 ? body.raio : null,
      pontoParada: body.pontoParada ?? null,
      poligonoWkt: body.tipoLocal === 2 ? body.poligonoWkt : null,
    });
    if (!updated) {
      throw new AppError('Local não encontrado', 404);
    }
    return mapLocalRowToDTO(updated);
  }
}
