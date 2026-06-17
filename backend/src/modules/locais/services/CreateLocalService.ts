import { LocalRepository } from '../repositories/LocalRepository';
import type { CreateLocalBody } from '../schemas/local.schemas';
import { LocalDTO, mapLocalRowToDTO } from './ListLocaisService';

export class CreateLocalService {
  constructor(private readonly repository = new LocalRepository()) {}

  async execute(body: CreateLocalBody): Promise<LocalDTO> {
    const row = await this.repository.create({
      tipoLocal: body.tipoLocal,
      codigoPonto: body.codigoPonto,
      endereco: body.endereco,
      latitude: body.latitude,
      longitude: body.longitude,
      // Círculo guarda só o raio (sem polígono); polígono guarda só o WKT
      // (sem raio). O tipo não escolhido vai como NULL.
      raio: body.tipoLocal === 1 ? body.raio : null,
      pontoParada: body.pontoParada ?? null,
      poligonoWkt: body.tipoLocal === 2 ? body.poligonoWkt : null,
    });
    return mapLocalRowToDTO(row);
  }
}
