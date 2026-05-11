import { LocalRepository } from '../repositories/LocalRepository';
import type { CreateLocalBody } from '../schemas/local.schemas';
import { LocalDTO, mapLocalRowToDTO } from './ListLocaisService';

export class CreateLocalService {
  constructor(private readonly repository = new LocalRepository()) {}

  async execute(body: CreateLocalBody): Promise<LocalDTO> {
    const row = await this.repository.create({
      codigoPonto: body.codigoPonto,
      endereco: body.endereco,
      latitude: body.latitude,
      longitude: body.longitude,
      raio: body.raio,
      pontoParada: body.pontoParada ?? null,
      poligonoWkt: body.poligonoWkt ?? null,
    });
    return mapLocalRowToDTO(row);
  }
}
