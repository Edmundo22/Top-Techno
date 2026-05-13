import { toIsoLocal } from '../../../shared/utils/datetime';
import { MonitoramentoRepository, VeiculoRow } from '../repositories/MonitoramentoRepository';

export interface VeiculoDTO {
  idVeiculo: number;
  placa: string | null;
  latitude: number | null;
  longitude: number | null;
  dtUltPosicao: string | null;
  ignicao: string | null;
  velocidade: number | null;
  idViagem: number | null;
  idViagemStatus: number | null;
  temRota: boolean;
}

function normalizeIgnicao(value: VeiculoRow['IGNICAO']): string | null {
  if (value == null) return null;
  if (typeof value === 'boolean') return value ? 'LIGADA' : 'DESLIGADA';
  if (typeof value === 'number') return value === 0 ? 'DESLIGADA' : 'LIGADA';
  return String(value).trim() || null;
}

function normalizeTemRota(value: VeiculoRow['TEM_ROTA']): boolean {
  if (value == null) return false;
  if (typeof value === 'boolean') return value;
  return Number(value) === 1;
}

export class ListVeiculosAtivosService {
  constructor(private readonly repository = new MonitoramentoRepository()) {}

  async execute(): Promise<VeiculoDTO[]> {
    const rows = await this.repository.listVeiculosDia();
    return rows.map<VeiculoDTO>((r) => ({
      idVeiculo: r.ID_VEICULO,
      placa: r.PLACA,
      latitude: r.LATITUDE,
      longitude: r.LONGITUDE,
      dtUltPosicao: toIsoLocal(r.DT_ULT_POSICAO),
      ignicao: normalizeIgnicao(r.IGNICAO),
      velocidade: r.VELOCIDADE,
      idViagem: r.ID_VIAGEM,
      idViagemStatus: r.ID_VIAGEM_STATUS,
      temRota: normalizeTemRota(r.TEM_ROTA),
    }));
  }
}
