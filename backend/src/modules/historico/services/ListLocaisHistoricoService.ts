import { toIsoLocal } from '../../../shared/utils/datetime';
import { HistoricoRepository, LocalHistoricoRow } from '../repositories/HistoricoRepository';

export interface LocalHistoricoDTO {
  idHistorico: number;
  idVeiculo: number | null;
  placa: string | null;
  idLocal: number;
  latitude: number | null;
  longitude: number | null;
  raio: number | null;
  pontoParada: string | null;
  endereco: string | null;
  dtEntrada: string | null;
  dtSaida: string | null;
  tempoPermanenciaMin: number | null;
}

function normalizePontoParada(value: LocalHistoricoRow['PONTO_PARADA']): string | null {
  if (value == null) return null;
  if (typeof value === 'boolean') return value ? 'SIM' : 'NÃO';
  if (typeof value === 'number') return value === 0 ? 'NÃO' : 'SIM';
  return String(value).trim() || null;
}

export class ListLocaisHistoricoService {
  constructor(private readonly repository = new HistoricoRepository()) {}

  async execute(dataIso: string): Promise<LocalHistoricoDTO[]> {
    const rows = await this.repository.listLocaisHistoricoData(dataIso);
    return rows.map<LocalHistoricoDTO>((r) => ({
      idHistorico: r.ID_HISTORICO,
      idVeiculo: r.ID_VEICULO,
      placa: r.PLACA,
      idLocal: r.ID_LOCAL,
      latitude: r.LATITUDE,
      longitude: r.LONGITUDE,
      raio: r.RAIO,
      pontoParada: normalizePontoParada(r.PONTO_PARADA),
      endereco: r.ENDERECO,
      dtEntrada: toIsoLocal(r.DT_ENTRADA),
      dtSaida: toIsoLocal(r.DT_SAIDA),
      tempoPermanenciaMin: r.TEMPO_PERMANENCIA_MIN,
    }));
  }
}
