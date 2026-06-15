import { getPool, sql } from '../../../infra/database/connection';
import { todayInBrazil } from '../../../shared/utils/datetime';

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
  TEM_ROTA: number | boolean | null;
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
  ID_FT: number | null;
  NUMERO_LINHA: string | null;
  NUMERO_FT: string | null;
}

export interface LocalRow {
  ID_VIAGEM_ENTRADA: number;
  ID_VIAGEM: number;
  ORDEM: number | null;
  ID_LOCAL: number;
  CODIGO_PONTO: string | null;
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

export interface ViagemEntradaRow {
  PLACA: string | null;
  LOCAL_NOME: string | null;
  ENT_PREV: string | null;
  ENT_REAL: string | null;
  SAI_PREV: string | null;
  SAI_REAL: string | null;
  T_DENTRO: number | null;
  ORDEM: number | null;
  DT_ENT_PREVISTA_RAW: Date | string | null;
  DT_ENT_REAL_RAW: Date | string | null;
  DT_SAI_PREVISTA_RAW: Date | string | null;
  DT_SAI_REAL_RAW: Date | string | null;
}

export interface ViagemPosicaoRow {
  POSI: number;
  DT_POSICAO: Date | string | null;
  VELOCIDADE: number | null;
  IGNICAO: string | number | boolean | null;
  LATITUDE: number | null;
  LONGITUDE: number | null;
  DIST_ROTA: number | null;
  PONTO_PARADA: string;
}

export class MonitoramentoRepository {
  async listVeiculosDia(): Promise<VeiculoRow[]> {
    const pool = await getPool();
    // OUTER APPLY traz a viagem do dia (se existir) + a POLYLINE da ficha
    // associada. TEM_ROTA = 1 só quando ambos existem — frontend usa para
    // separar veículos "com rota" (verde) de "sem rota" (preto).
    //
    // Não filtra por DT_ULT_POSICAO: todo veículo com lat/lng aparece no mapa,
    // tenha reportado hoje ou não. A viagem do dia usa CAST(GETDATE() AS DATE).
    const result = await pool
      .request()
      .query<VeiculoRow>(
        `SELECT
         v.ID_VEICULO, v.PLACA, v.LATITUDE, v.LONGITUDE,
         v.DT_ULT_POSICAO, v.IGNICAO, v.VELOCIDADE, v.ID_VIAGEM_STATUS,
         via.ID_VIAGEM,
         CASE WHEN via.POLYLINE IS NOT NULL AND LEN(via.POLYLINE) > 0
              THEN 1 ELSE 0 END AS TEM_ROTA
       FROM [TOP_TECHNO].[dbo].[TB_VEICULO] v
       OUTER APPLY (
         SELECT TOP(1) v2.ID_VIAGEM, ft.POLYLINE
         FROM [TOP_TECHNO].[dbo].[TB_VIAGEM] v2
         LEFT JOIN [TOP_TECHNO].[dbo].[FT_CABECALHO] ft ON ft.ID_FT = v2.ID_FT
         WHERE v2.ID_VEICULO = v.ID_VEICULO
           AND CAST(v2.DT_VIAGEM AS DATE) = CAST(GETDATE() AS DATE)
       ) via
       WHERE v.LATITUDE IS NOT NULL AND v.LONGITUDE IS NOT NULL`,
      );
    return result.recordset;
  }

  async listRotasDia(): Promise<RotaRow[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('today', sql.VarChar(10), todayInBrazil())
      .query<RotaRow>(
        `SELECT
         vi.ID_VIAGEM,
         vi.ID_VEICULO,
         vei.PLACA,
         vi.ID_VIAGEM_STATUS,
         vs.VIAGEM_STATUS,
         vi.DT_INI_VIAGEM,
         vi.DT_FIM_VIAGEM,
         ft.POLYLINE,
         ft.ID_FT,
         ft.NUMERO_LINHA,
         ft.NUMERO_FT
       FROM [TOP_TECHNO].[dbo].[TB_VIAGEM] vi
       INNER JOIN [TOP_TECHNO].[dbo].[FT_CABECALHO] ft ON ft.ID_FT = vi.ID_FT
       LEFT JOIN [TOP_TECHNO].[dbo].[TB_VIAGEM_STATUS] vs ON vs.ID_VIAGEM_STATUS = vi.ID_VIAGEM_STATUS
       LEFT JOIN [TOP_TECHNO].[dbo].[TB_VEICULO] vei ON vei.ID_VEICULO = vi.ID_VEICULO
       WHERE CAST(vi.DT_VIAGEM AS DATE) = @today
         AND ft.POLYLINE IS NOT NULL`,
      );
    return result.recordset;
  }

  async listLocaisDia(): Promise<LocalRow[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('today', sql.VarChar(10), todayInBrazil())
      .query<LocalRow>(
        `SELECT
         ve.ID_VIAGEM_ENTRADA, ve.ID_VIAGEM, ve.ORDEM,
         l.ID_LOCAL, l.CODIGO_PONTO, l.ENDERECO, l.LATITUDE, l.LONGITUDE, l.RAIO, l.PONTO_PARADA,
         ve.DT_ENT_PREVISTA, ve.DT_SAI_PREVISTA, ve.DT_ENT_REAL, ve.DT_SAI_REAL
       FROM [TOP_TECHNO].[dbo].[TB_VIAGEM_ENTRADA] ve
       INNER JOIN [TOP_TECHNO].[dbo].[TB_VIAGEM] vi ON vi.ID_VIAGEM = ve.ID_VIAGEM
       INNER JOIN [TOP_TECHNO].[dbo].[TB_LOCAL]  l  ON l.ID_LOCAL  = ve.ID_LOCAL
       WHERE CAST(vi.DT_VIAGEM AS DATE) = @today
         AND l.LATITUDE IS NOT NULL AND l.LONGITUDE IS NOT NULL
       ORDER BY ve.ID_VIAGEM ASC, ve.ORDEM ASC`,
      );
    return result.recordset;
  }

  async listViagemEntradas(idViagem: number): Promise<ViagemEntradaRow[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('idViagem', sql.Int, idViagem)
      .query<ViagemEntradaRow>(
        `SELECT
           veic.PLACA,
           loc.PONTO_PARADA AS LOCAL_NOME,
           CONVERT(varchar, ent.DT_ENT_PREVISTA, 108) AS ENT_PREV,
           CONVERT(varchar, ent.DT_ENT_REAL,     108) AS ENT_REAL,
           CONVERT(varchar, ent.DT_SAI_PREVISTA, 108) AS SAI_PREV,
           CONVERT(varchar, ent.DT_SAI_REAL,     108) AS SAI_REAL,
           CASE WHEN ent.DT_ENT_REAL IS NOT NULL AND ent.DT_SAI_REAL IS NOT NULL
                THEN DATEDIFF(MINUTE, ent.DT_ENT_REAL, ent.DT_SAI_REAL)
                ELSE NULL END AS T_DENTRO,
           ent.ORDEM,
           ent.DT_ENT_PREVISTA AS DT_ENT_PREVISTA_RAW,
           ent.DT_ENT_REAL     AS DT_ENT_REAL_RAW,
           ent.DT_SAI_PREVISTA AS DT_SAI_PREVISTA_RAW,
           ent.DT_SAI_REAL     AS DT_SAI_REAL_RAW
         FROM [TOP_TECHNO].[dbo].[TB_VIAGEM_ENTRADA] ent
         INNER JOIN [TOP_TECHNO].[dbo].[TB_VIAGEM] via ON via.ID_VIAGEM = ent.ID_VIAGEM
         INNER JOIN [TOP_TECHNO].[dbo].[TB_LOCAL] loc ON loc.ID_LOCAL = ent.ID_LOCAL
         INNER JOIN [TOP_TECHNO].[dbo].[TB_VEICULO] veic ON veic.ID_VEICULO = via.ID_VEICULO
         WHERE ent.ID_VIAGEM = @idViagem
         ORDER BY ent.ORDEM`,
      );
    return result.recordset;
  }

  async listViagemPosicoes(idViagem: number): Promise<ViagemPosicaoRow[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('idViagem', sql.Int, idViagem)
      .query<ViagemPosicaoRow>(
        `SELECT
           ROW_NUMBER() OVER (ORDER BY P.DT_POSICAO) AS POSI,
           P.DT_POSICAO,
           P.VELOCIDADE,
           P.IGNICAO,
           P.LATITUDE,
           P.LONGITUDE,
           P.DIST_ROTA,
           ISNULL(L.PONTO_PARADA, '') AS PONTO_PARADA
         FROM [TOP_TECHNO].[dbo].[TB_VIAGEM_POSICAO] P
         LEFT JOIN [TOP_TECHNO].[dbo].[TB_LOCAL] L ON L.ID_LOCAL = P.ID_LOCAL
         WHERE P.ID_VIAGEM = @idViagem
         ORDER BY P.DT_POSICAO`,
      );
    return result.recordset;
  }
}
