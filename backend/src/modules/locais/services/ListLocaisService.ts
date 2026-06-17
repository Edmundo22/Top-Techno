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
  tipoLocal: number; // 1 = círculo, 2 = polígono
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
    // Fallback p/ linhas legadas sem TIPO_LOCAL: tem polígono → 2, senão 1.
    // Number(...) cobre o caso de bigint vir como string pelo driver.
    tipoLocal: row.TIPO_LOCAL != null ? Number(row.TIPO_LOCAL) : row.LOCAL_GEO_WKT ? 2 : 1,
  };
}

export class ListLocaisService {
  constructor(private readonly repository = new LocalRepository()) {}

  async execute(): Promise<LocalDTO[]> {
    const rows = await this.repository.list();
    return rows.map(mapLocalRowToDTO);
  }
}
