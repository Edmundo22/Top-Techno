import { toIsoLocal } from '../../../shared/utils/datetime';
import { HistoricoRepository } from '../repositories/HistoricoRepository';

export interface RotaHistoricoDTO {
  idViagem: number;
  idVeiculo: number | null;
  placa: string | null;
  idViagemStatus: number | null;
  statusLabel: string | null;
  dtIniViagem: string | null;
  dtFimViagem: string | null;
  polyline: string;
}

export class ListRotasHistoricoService {
  constructor(private readonly repository = new HistoricoRepository()) {}

  async execute(dataIso: string): Promise<RotaHistoricoDTO[]> {
    const rows = await this.repository.listRotasData(dataIso);
    return rows
      .filter((r) => typeof r.POLYLINE === 'string' && r.POLYLINE.length > 0)
      .map<RotaHistoricoDTO>((r) => ({
        idViagem: r.ID_VIAGEM,
        idVeiculo: r.ID_VEICULO,
        placa: r.PLACA,
        idViagemStatus: r.ID_VIAGEM_STATUS,
        statusLabel: r.VIAGEM_STATUS,
        dtIniViagem: toIsoLocal(r.DT_INI_VIAGEM),
        dtFimViagem: toIsoLocal(r.DT_FIM_VIAGEM),
        polyline: r.POLYLINE as string,
      }));
  }
}
