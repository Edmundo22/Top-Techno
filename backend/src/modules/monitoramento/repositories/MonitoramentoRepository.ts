import { getPool } from '../../../infra/database/connection';

export interface VeiculoRow {
  ID_VEICULO: number;
  PLACA: string | null;
  LATITUDE: number | null;
  LONGITUDE: number | null;
  DT_ULT_POSICAO: Date | string | null;
  IGNICAO: string | number | boolean | null;
  VELOCIDADE: number | null;
  ID_VIAGEM: number | null;
  ID_VIAGEM_STATUS: number | null;
}

export interface RotaRow {
  ID_VIAGEM: number;
  ID_VEICULO: number | null;
  PLACA: string | null;
  ID_VIAGEM_STATUS: number | null;
  VIAGEM_STATUS: string | null;
  DT_INI_VIAGEM: Date | string | null;
  DT_FIM_VIAGEM: Date | string | null;
  POLYLINE: string | null;
}

export interface LocalRow {
  ID_VIAGEM_ENTRADA: number;
  ID_VIAGEM: number;
  ORDEM: number | null;
  ID_LOCAL: number;
  ENDERECO: string | null;
  LATITUDE: number | null;
  LONGITUDE: number | null;
  RAIO: number | null;
  PONTO_PARADA: string | number | boolean | null;
  DT_ENT_PREVISTA: Date | string | null;
  DT_SAI_PREVISTA: Date | string | null;
  DT_ENT_REAL: Date | string | null;
  DT_SAI_REAL: Date | string | null;
}

export class MonitoramentoRepository {
  async listVeiculosDia(): Promise<VeiculoRow[]> {
    const pool = await getPool();
    const result = await pool.request().query<VeiculoRow>(
      `SELECT DISTINCT
         v.ID_VEICULO, v.PLACA, v.LATITUDE, v.LONGITUDE,
         v.DT_ULT_POSICAO, v.IGNICAO, v.VELOCIDADE,
         v.ID_VIAGEM, v.ID_VIAGEM_STATUS
       FROM [TOP_TECHNO].[dbo].[TB_VEICULO] v
       INNER JOIN [TOP_TECHNO].[dbo].[TB_VIAGEM] vi ON vi.ID_VEICULO = v.ID_VEICULO
       WHERE CAST(vi.DT_VIAGEM AS DATE) = CAST(GETDATE() AS DATE)
         AND v.LATITUDE IS NOT NULL AND v.LONGITUDE IS NOT NULL`,
    );
    return result.recordset;
  }

  async listRotasDia(): Promise<RotaRow[]> {
    const pool = await getPool();
    const result = await pool.request().query<RotaRow>(
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
       WHERE CAST(vi.DT_VIAGEM AS DATE) = CAST(GETDATE() AS DATE)
         AND ft.POLYLINE IS NOT NULL`,
    );
    return result.recordset;
  }

  async listLocaisDia(): Promise<LocalRow[]> {
    const pool = await getPool();
    const result = await pool.request().query<LocalRow>(
      `SELECT
         ve.ID_VIAGEM_ENTRADA, ve.ID_VIAGEM, ve.ORDEM,
         l.ID_LOCAL, l.ENDERECO, l.LATITUDE, l.LONGITUDE, l.RAIO, l.PONTO_PARADA,
         ve.DT_ENT_PREVISTA, ve.DT_SAI_PREVISTA, ve.DT_ENT_REAL, ve.DT_SAI_REAL
       FROM [TOP_TECHNO].[dbo].[TB_VIAGEM_ENTRADA] ve
       INNER JOIN [TOP_TECHNO].[dbo].[TB_VIAGEM] vi ON vi.ID_VIAGEM = ve.ID_VIAGEM
       INNER JOIN [TOP_TECHNO].[dbo].[TB_LOCAL]  l  ON l.ID_LOCAL  = ve.ID_LOCAL
       WHERE CAST(vi.DT_VIAGEM AS DATE) = CAST(GETDATE() AS DATE)
         AND l.LATITUDE IS NOT NULL AND l.LONGITUDE IS NOT NULL
       ORDER BY ve.ID_VIAGEM ASC, ve.ORDEM ASC`,
    );
    return result.recordset;
  }
}
