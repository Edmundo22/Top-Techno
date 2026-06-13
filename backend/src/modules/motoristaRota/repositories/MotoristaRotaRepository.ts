import { getPool, sql } from '../../../infra/database/connection';

export interface RotaFtRow {
  ID_FT: number;
  NUMERO_LINHA: string | null;
  NUMERO_FT: string | null;
  POLYLINE: string | null;
}

export interface VinculadoRow {
  ID_CAD_MOT_ROTA: number;
  ID_CAD_MOT: number;
  MOTORISTA: string | null;
  CNH: string | null;
  TITULAR: boolean | number | null;
  DT_INSERCAO: Date | string | null;
}

export interface DisponivelRow {
  ID_CAD_MOT: number;
  MOTORISTA: string | null;
  CNH: string | null;
}

export class MotoristaRotaRepository {
  // Todas as rotas (fichas técnicas). POLYLINE pode vir null/vazia — o front
  // guarda o decode; aqui devolvemos tudo sem filtro.
  async listRotasFt(): Promise<RotaFtRow[]> {
    const pool = await getPool();
    const result = await pool.request().query<RotaFtRow>(
      `SELECT ID_FT, NUMERO_LINHA, NUMERO_FT, POLYLINE
       FROM [TOP_TECHNO].[dbo].[FT_CABECALHO]
       ORDER BY NUMERO_LINHA`,
    );
    return result.recordset;
  }

  // Motoristas já vinculados à rota (join p/ nome + CNH). Titular primeiro.
  async listVinculados(idFt: number): Promise<VinculadoRow[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('idFt', sql.Int, idFt)
      .query<VinculadoRow>(
        `SELECT mr.ID_CAD_MOT_ROTA, mr.ID_CAD_MOT, m.MOTORISTA, m.CNH, mr.TITULAR, mr.DT_INSERCAO
         FROM [CORREIO].[dbo].[APP_CAD_MOT_ROTA] mr
         INNER JOIN [CORREIO].[dbo].[APP_CAD_MOT] m ON m.ID_CAD_MOT = mr.ID_CAD_MOT
         WHERE mr.ID_FT_TOP = @idFt
         ORDER BY mr.TITULAR DESC, m.MOTORISTA`,
      );
    return result.recordset;
  }

  // Motoristas que AINDA NÃO estão vinculados à rota.
  async listDisponiveis(idFt: number): Promise<DisponivelRow[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('idFt', sql.Int, idFt)
      .query<DisponivelRow>(
        `SELECT M.ID_CAD_MOT, M.MOTORISTA, M.CNH
         FROM [CORREIO].[dbo].[APP_CAD_MOT] M
         WHERE M.ID_CAD_MOT NOT IN (
           SELECT ID_CAD_MOT FROM [CORREIO].[dbo].[APP_CAD_MOT_ROTA] WHERE ID_FT_TOP = @idFt
         )
         ORDER BY M.MOTORISTA`,
      );
    return result.recordset;
  }

  // Bulk insert parametrizado (1 named param por id). TITULAR sempre 0.
  // INSERT ... SELECT ... WHERE NOT EXISTS torna a operação idempotente:
  // ids já vinculados (corrida) são ignorados, sem duplicar vínculo.
  async vincular(idFt: number, idsCadMot: number[]): Promise<void> {
    if (idsCadMot.length === 0) return;
    const pool = await getPool();
    const request = pool.request().input('idFt', sql.Int, idFt);
    const valuesSql = idsCadMot
      .map((id, i) => {
        request.input(`id${i}`, sql.Int, id);
        return `(@id${i})`;
      })
      .join(', ');
    await request.query(
      `INSERT INTO [CORREIO].[dbo].[APP_CAD_MOT_ROTA]
         (ID_CAD_MOT, ID_FT_TOP, TITULAR, DT_INSERCAO)
       SELECT v.id, @idFt, 0, GETDATE()
       FROM (VALUES ${valuesSql}) AS v(id)
       WHERE NOT EXISTS (
         SELECT 1 FROM [CORREIO].[dbo].[APP_CAD_MOT_ROTA] mr
         WHERE mr.ID_FT_TOP = @idFt AND mr.ID_CAD_MOT = v.id
       );`,
    );
  }

  // Define o titular único da rota: zera todos e marca o escolhido, no mesmo
  // batch (autocommit atômico). titular=false deixa a rota sem titular.
  async setTitular(idFt: number, idCadMot: number, titular: boolean): Promise<void> {
    const pool = await getPool();
    await pool
      .request()
      .input('idFt', sql.Int, idFt)
      .input('idCadMot', sql.Int, idCadMot)
      .input('titular', sql.Bit, titular)
      .query(
        `UPDATE [CORREIO].[dbo].[APP_CAD_MOT_ROTA] SET TITULAR = 0 WHERE ID_FT_TOP = @idFt;
         UPDATE [CORREIO].[dbo].[APP_CAD_MOT_ROTA] SET TITULAR = @titular
           WHERE ID_FT_TOP = @idFt AND ID_CAD_MOT = @idCadMot;`,
      );
  }

  async desvincular(idCadMotRota: number): Promise<boolean> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('idCadMotRota', sql.Int, idCadMotRota)
      .query(
        'DELETE FROM [CORREIO].[dbo].[APP_CAD_MOT_ROTA] WHERE ID_CAD_MOT_ROTA = @idCadMotRota;',
      );
    return result.rowsAffected[0] > 0;
  }
}
