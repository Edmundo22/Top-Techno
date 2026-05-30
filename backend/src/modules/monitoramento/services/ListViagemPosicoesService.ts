import { toIsoLocal } from '../../../shared/utils/datetime';
import {
  MonitoramentoRepository,
  ViagemPosicaoRow,
} from '../repositories/MonitoramentoRepository';

export interface ViagemPosicaoDTO {
  posi: number;
  dtPosicao: string | null;
  velocidade: number | null;
  ignicao: string | null;
  latitude: number | null;
  longitude: number | null;
  distRota: number | null;
  pontoParada: string | null;
}

// Duplicado de ListVeiculosAtivosService.ts (function-scope nos dois lados).
// 6 linhas de duplicação são mais baratas do que extrair pra shared só por isso.
function normalizeIgnicao(value: ViagemPosicaoRow['IGNICAO']): string | null {
  if (value == null) return null;
  if (typeof value === 'boolean') return value ? 'LIGADA' : 'DESLIGADA';
  if (typeof value === 'number') return value === 0 ? 'DESLIGADA' : 'LIGADA';
  return String(value).trim() || null;
}

function normalizePontoParada(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class ListViagemPosicoesService {
  constructor(private readonly repository = new MonitoramentoRepository()) {}

  async execute(idViagem: number): Promise<ViagemPosicaoDTO[]> {
    const rows = await this.repository.listViagemPosicoes(idViagem);
    return rows.map<ViagemPosicaoDTO>((r) => ({
      posi: r.POSI,
      dtPosicao: toIsoLocal(r.DT_POSICAO),
      velocidade: r.VELOCIDADE,
      ignicao: normalizeIgnicao(r.IGNICAO),
      latitude: r.LATITUDE,
      longitude: r.LONGITUDE,
      distRota: r.DIST_ROTA,
      pontoParada: normalizePontoParada(r.PONTO_PARADA),
    }));
  }
}
