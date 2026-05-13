import { toIsoLocal } from '../../../shared/utils/datetime';
import { normalizePontoParada } from '../../../shared/utils/normalizePontoParada';
import { MonitoramentoRepository } from '../repositories/MonitoramentoRepository';

export interface LocalDTO {
  idViagemEntrada: number;
  idViagem: number;
  ordem: number | null;
  idLocal: number;
  codigoPonto: string | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  raio: number | null;
  pontoParada: string | null;
  dtEntPrevista: string | null;
  dtSaiPrevista: string | null;
  dtEntReal: string | null;
  dtSaiReal: string | null;
}

export class ListLocaisDiaService {
  constructor(private readonly repository = new MonitoramentoRepository()) {}

  async execute(): Promise<LocalDTO[]> {
    const rows = await this.repository.listLocaisDia();
    return rows.map<LocalDTO>((r) => ({
      idViagemEntrada: r.ID_VIAGEM_ENTRADA,
      idViagem: r.ID_VIAGEM,
      ordem: r.ORDEM,
      idLocal: r.ID_LOCAL,
      codigoPonto: r.CODIGO_PONTO,
      endereco: r.ENDERECO,
      latitude: r.LATITUDE,
      longitude: r.LONGITUDE,
      raio: r.RAIO,
      pontoParada: normalizePontoParada(r.PONTO_PARADA),
      dtEntPrevista: toIsoLocal(r.DT_ENT_PREVISTA),
      dtSaiPrevista: toIsoLocal(r.DT_SAI_PREVISTA),
      dtEntReal: toIsoLocal(r.DT_ENT_REAL),
      dtSaiReal: toIsoLocal(r.DT_SAI_REAL),
    }));
  }
}
