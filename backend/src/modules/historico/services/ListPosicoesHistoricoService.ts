import { toIsoLocal } from '../../../shared/utils/datetime';
import { HistoricoRepository, PosicaoRow } from '../repositories/HistoricoRepository';

export interface PosicaoDTO {
  idViagemPosicao: number;
  idViagem: number | null;
  idPosicao: number | null;
  idVeiculo: number | null;
  placa: string | null;
  dtPosicao: string | null;
  velocidade: number | null;
  ignicao: string | null;
  ignicaoOn: boolean | null;
  latitude: number | null;
  longitude: number | null;
  idLocal: number | null;
  distRota: number | null;
  pontoParada: string | null;
}

function normalizeIgnicao(value: PosicaoRow['IGNICAO']): {
  label: string | null;
  on: boolean | null;
} {
  if (value == null) return { label: null, on: null };
  if (typeof value === 'boolean') {
    return { label: value ? 'LIGADA' : 'DESLIGADA', on: value };
  }
  if (typeof value === 'number') {
    return { label: value === 0 ? 'DESLIGADA' : 'LIGADA', on: value !== 0 };
  }
  const text = String(value).trim();
  if (!text) return { label: null, on: null };
  const normalized = text.toUpperCase();
  if (normalized === '0' || normalized === 'DESLIGADA' || normalized === 'OFF') {
    return { label: 'DESLIGADA', on: false };
  }
  if (normalized === '1' || normalized === 'LIGADA' || normalized === 'ON') {
    return { label: 'LIGADA', on: true };
  }
  return { label: text, on: null };
}

function normalizePontoParada(value: PosicaoRow['LOCAL_PONTO_PARADA']): string | null {
  if (value == null) return null;
  if (typeof value === 'boolean') return value ? 'SIM' : 'NÃO';
  if (typeof value === 'number') return value === 0 ? 'NÃO' : 'SIM';
  return String(value).trim() || null;
}

export class ListPosicoesHistoricoService {
  constructor(private readonly repository = new HistoricoRepository()) {}

  async execute(dataIso: string): Promise<PosicaoDTO[]> {
    const rows = await this.repository.listPosicoesData(dataIso);
    return rows.map<PosicaoDTO>((r) => {
      const ig = normalizeIgnicao(r.IGNICAO);
      return {
        idViagemPosicao: r.ID_VIAGEM_POSICAO,
        idViagem: r.ID_VIAGEM,
        idPosicao: r.ID_POSICAO,
        idVeiculo: r.ID_VEICULO,
        placa: r.PLACA,
        dtPosicao: toIsoLocal(r.DT_POSICAO),
        velocidade: r.VELOCIDADE,
        ignicao: ig.label,
        ignicaoOn: ig.on,
        latitude: r.LATITUDE,
        longitude: r.LONGITUDE,
        idLocal: r.ID_LOCAL,
        distRota: r.DIST_ROTA,
        pontoParada: normalizePontoParada(r.LOCAL_PONTO_PARADA),
      };
    });
  }
}
