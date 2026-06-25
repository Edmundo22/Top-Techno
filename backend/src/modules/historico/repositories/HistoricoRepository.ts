import { getPool } from '../../../infra/database/connection';

export interface PosicaoRow {
  ID_VIAGEM_POSICAO: number;
  ID_VIAGEM: number | null;
  ID_POSICAO: number | null;
  ID_VEICULO: number | null;
  PLACA: string | null;
  DT_POSICAO: Date | string | null;
  VELOCIDADE: number | null;
  IGNICAO: string | number | boolean | null;
  LATITUDE: number | null;
  LONGITUDE: number | null;
  ID_LOCAL: number | null;
  DIST_ROTA: number | null;
  LOCAL_PONTO_PARADA: string | number | boolean | null;
}

export interface RotaHistoricoRow {
  ID_VIAGEM: number;
  ID_VEICULO: number | null;
  PLACA: string | null;
  ID_VIAGEM_STATUS: number | null;
  VIAGEM_STATUS: string | null;
  DT_INI_VIAGEM: Date | string | null;
  DT_FIM_VIAGEM: Date | string | null;
  POLYLINE: string | null;
}

export interface LocalHistoricoRow {
  ID_HISTORICO: number;
  ID_VEICULO: number | null;
  PLACA: string | null;
  ID_LOCAL: number;
  LATITUDE: number | null;
  LONGITUDE: number | null;
  RAIO: number | null;
  PONTO_PARADA: string | number | boolean | null;
  ENDERECO: string | null;
  DT_ENTRADA: Date | string | null;
  DT_SAIDA: Date | string | null;
  TEMPO_PERMANENCIA_MIN: number | null;
}

export class HistoricoRepository {
  async listPosicoesData(dataIso: string): Promise<PosicaoRow[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('data', dataIso)
      .query<PosicaoRow>(
        `SELECT
           vp.ID_VIAGEM_POSICAO, vp.ID_VIAGEM, vp.ID_POSICAO, vp.ID_VEICULO,
           vp.PLACA, vp.DT_POSICAO, vp.VELOCIDADE, vp.IGNICAO,
           vp.LATITUDE, vp.LONGITUDE, vp.ID_LOCAL, vp.DIST_ROTA,
           l.PONTO_PARADA AS LOCAL_PONTO_PARADA
         FROM [TOP_TECHNO].[dbo].[TB_VIAGEM_POSICAO] vp
         LEFT JOIN [TOP_TECHNO].[dbo].[TB_LOCAL] l ON l.ID_LOCAL = vp.ID_LOCAL
         WHERE vp.DT_POSICAO >= CAST(@data AS DATE)
           AND vp.DT_POSICAO <  DATEADD(DAY, 1, CAST(@data AS DATE))
           AND vp.LATITUDE IS NOT NULL AND vp.LONGITUDE IS NOT NULL
         ORDER BY vp.DT_POSICAO ASC`,
      );
    return result.recordset;
  }

  async listRotasData(dataIso: string): Promise<RotaHistoricoRow[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('data', dataIso)
      .query<RotaHistoricoRow>(
        `SELECT
           vi.ID_VIAGEM,
           vi.ID_VEICULO,
           vei.PLACA,
           vi.ID_VIAGEM_STATUS,
           vs.VIAGEM_STATUS,
           vi.DT_INI_VIAGEM,
           vi.DT_FIM_VIAGEM,
           ft.POLYLINE
         FROM [TOP_TECHNO].[dbo].[TB_VIAGEM] vi
         INNER JOIN [TOP_TECHNO].[dbo].[FT_CABECALHO] ft ON ft.ID_FT = vi.ID_FT
         LEFT JOIN [TOP_TECHNO].[dbo].[TB_VIAGEM_STATUS] vs ON vs.ID_VIAGEM_STATUS = vi.ID_VIAGEM_STATUS
         LEFT JOIN [TOP_TECHNO].[dbo].[TB_VEICULO] vei ON vei.ID_VEICULO = vi.ID_VEICULO
         WHERE vi.DT_VIAGEM >= CAST(@data AS DATE)
           AND vi.DT_VIAGEM <  DATEADD(DAY, 1, CAST(@data AS DATE))
           AND ft.POLYLINE IS NOT NULL`,
      );
    return result.recordset;
  }

  async listLocaisHistoricoData(dataIso: string): Promise<LocalHistoricoRow[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('data', dataIso)
      .query<LocalHistoricoRow>(
        `SELECT
           lh.ID_HISTORICO,
           lh.ID_VEICULO,
           v.PLACA,
           lh.ID_LOCAL,
           l.LATITUDE,
           l.LONGITUDE,
           l.RAIO,
           l.PONTO_PARADA,
           l.ENDERECO,
           lh.DT_ENTRADA,
           lh.DT_SAIDA,
           lh.TEMPO_PERMANENCIA_MIN
         FROM [TOP_TECHNO].[dbo].[TB_LOCAL_HISTORICO] lh
         INNER JOIN [TOP_TECHNO].[dbo].[TB_LOCAL] l ON l.ID_LOCAL = lh.ID_LOCAL
         LEFT JOIN [TOP_TECHNO].[dbo].[TB_VEICULO] v ON v.ID_VEICULO = lh.ID_VEICULO
         WHERE lh.DT_ENTRADA >= CAST(@data AS DATE)
           AND lh.DT_ENTRADA <  DATEADD(DAY, 1, CAST(@data AS DATE))
           AND l.LATITUDE IS NOT NULL AND l.LONGITUDE IS NOT NULL
         ORDER BY lh.DT_ENTRADA ASC`,
      );
    return result.recordset;
  }
}
