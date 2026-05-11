import { normalizePontoParada } from '../../../shared/utils/normalizePontoParada';
import { LocalRepository, LocalRow } from '../repositories/LocalRepository';

export interface LocalDTO {
  idLocal: number;
  codigoPonto: string | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  raio: number | null;
  pontoParada: string | null;
  poligonoWkt: string | null;
}

export function mapLocalRowToDTO(row: LocalRow): LocalDTO {
  return {
    idLocal: row.ID_LOCAL,
    codigoPonto: row.CODIGO_PONTO,
    endereco: row.ENDERECO,
    latitude: row.LATITUDE,
    longitude: row.LONGITUDE,
    raio: row.RAIO,
    pontoParada: normalizePontoParada(row.PONTO_PARADA),
    poligonoWkt: row.LOCAL_GEO_WKT,
  };
}

export class ListLocaisService {
  constructor(private readonly repository = new LocalRepository()) {}

  async execute(): Promise<LocalDTO[]> {
    const rows = await this.repository.list();
    return rows.map(mapLocalRowToDTO);
  }
}
