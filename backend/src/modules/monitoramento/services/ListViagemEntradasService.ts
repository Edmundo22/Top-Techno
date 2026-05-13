import { toIsoLocal } from '../../../shared/utils/datetime';
import { MonitoramentoRepository } from '../repositories/MonitoramentoRepository';

export interface ViagemEntradaDTO {
  placa: string | null;
  local: string | null;
  entPrev: string | null;
  entReal: string | null;
  saiPrev: string | null;
  saiReal: string | null;
  tDentroMin: number | null;
  ordem: number | null;
  dtEntPrevistaIso: string | null;
  dtEntRealIso: string | null;
  dtSaiPrevistaIso: string | null;
  dtSaiRealIso: string | null;
}

export class ListViagemEntradasService {
  constructor(private readonly repository = new MonitoramentoRepository()) {}

  async execute(idViagem: number): Promise<ViagemEntradaDTO[]> {
    const rows = await this.repository.listViagemEntradas(idViagem);
    return rows.map<ViagemEntradaDTO>((r) => ({
      placa: r.PLACA,
      local: r.LOCAL_NOME,
      entPrev: r.ENT_PREV,
      entReal: r.ENT_REAL,
      saiPrev: r.SAI_PREV,
      saiReal: r.SAI_REAL,
      tDentroMin: r.T_DENTRO,
      ordem: r.ORDEM,
      dtEntPrevistaIso: toIsoLocal(r.DT_ENT_PREVISTA_RAW),
      dtEntRealIso: toIsoLocal(r.DT_ENT_REAL_RAW),
      dtSaiPrevistaIso: toIsoLocal(r.DT_SAI_PREVISTA_RAW),
      dtSaiRealIso: toIsoLocal(r.DT_SAI_REAL_RAW),
    }));
  }
}
