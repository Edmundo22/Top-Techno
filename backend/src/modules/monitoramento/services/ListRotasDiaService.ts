import { toIsoLocal } from '../../../shared/utils/datetime';
import { MonitoramentoRepository } from '../repositories/MonitoramentoRepository';

export interface RotaDTO {
  idViagem: number;
  idVeiculo: number | null;
  placa: string | null;
  idViagemStatus: number | null;
  statusLabel: string | null;
  dtIniViagem: string | null;
  dtFimViagem: string | null;
  polyline: string;
  idFt: number | null;
  numeroLinha: string | null;
  numeroFt: string | null;
}

export class ListRotasDiaService {
  constructor(private readonly repository = new MonitoramentoRepository()) {}

  async execute(): Promise<RotaDTO[]> {
    const rows = await this.repository.listRotasDia();
    return rows
      .filter((r) => typeof r.POLYLINE === 'string' && r.POLYLINE.length > 0)
      .map<RotaDTO>((r) => ({
        idViagem: r.ID_VIAGEM,
        idVeiculo: r.ID_VEICULO,
        placa: r.PLACA,
        idViagemStatus: r.ID_VIAGEM_STATUS,
        statusLabel: r.VIAGEM_STATUS,
        dtIniViagem: toIsoLocal(r.DT_INI_VIAGEM),
        dtFimViagem: toIsoLocal(r.DT_FIM_VIAGEM),
        polyline: r.POLYLINE as string,
        idFt: r.ID_FT,
        numeroLinha: r.NUMERO_LINHA,
        numeroFt: r.NUMERO_FT,
      }));
  }
}
