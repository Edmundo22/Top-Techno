import { getPool, sql } from '../../../infra/database/connection';

// NOTE: a coluna real é TELFONE (sem o "E" — typo na tabela do banco CORREIO).
// Use o nome literal em todo SQL/DTO; o label visual no front é "Telefone".
export interface MotoristaRow {
  ID_CAD_MOT: number;
  MOTORISTA: string | null;
  CNH: string | null;
  CPF: string | null;
  TELFONE: string | null;
  OBS: string | null;
}

export interface MotoristaUpsertInput {
  motorista: string;
  cnh: string;
  cpf: string | null;
  telfone: string | null;
  obs: string | null;
}

const BASE_SELECT = `
  SELECT ID_CAD_MOT, MOTORISTA, CNH, CPF, TELFONE, OBS
  FROM [CORREIO].[dbo].[APP_CAD_MOT]
`;

export class MotoristaRepository {
  async list(): Promise<MotoristaRow[]> {
    const pool = await getPool();
    const result = await pool
      .request()
      .query<MotoristaRow>(`${BASE_SELECT} ORDER BY MOTORISTA`);
    return result.recordset;
  }

  async findById(id: number): Promise<MotoristaRow | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.BigInt, id)
      .query<MotoristaRow>(`${BASE_SELECT} WHERE ID_CAD_MOT = @id`);
    return result.recordset[0] ?? null;
  }

  async create(input: MotoristaUpsertInput): Promise<MotoristaRow> {
    const pool = await getPool();
    const insert = await pool
      .request()
      .input('motorista', sql.NVarChar(120), input.motorista)
      .input('cnh', sql.VarChar(20), input.cnh)
      .input('cpf', sql.VarChar(14), input.cpf)
      .input('telfone', sql.VarChar(15), input.telfone)
      .input('obs', sql.NVarChar(500), input.obs)
      .query<{ ID_CAD_MOT: number }>(
        `INSERT INTO [CORREIO].[dbo].[APP_CAD_MOT]
           (MOTORISTA, CNH, CPF, TELFONE, OBS)
         OUTPUT INSERTED.ID_CAD_MOT
         VALUES (@motorista, @cnh, @cpf, @telfone, @obs);`,
      );
    const newId = insert.recordset[0]?.ID_CAD_MOT;
    if (newId == null) {
      throw new Error('INSERT APP_CAD_MOT não retornou ID');
    }
    const row = await this.findById(newId);
    if (!row) {
      throw new Error('Motorista recém-criado não encontrado');
    }
    return row;
  }

  async update(id: number, input: MotoristaUpsertInput): Promise<MotoristaRow | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.BigInt, id)
      .input('motorista', sql.NVarChar(120), input.motorista)
      .input('cnh', sql.VarChar(20), input.cnh)
      .input('cpf', sql.VarChar(14), input.cpf)
      .input('telfone', sql.VarChar(15), input.telfone)
      .input('obs', sql.NVarChar(500), input.obs)
      .query(
        `UPDATE [CORREIO].[dbo].[APP_CAD_MOT]
           SET MOTORISTA = @motorista,
               CNH       = @cnh,
               CPF       = @cpf,
               TELFONE   = @telfone,
               OBS       = @obs
         WHERE ID_CAD_MOT = @id;`,
      );
    if (result.rowsAffected[0] === 0) return null;
    return this.findById(id);
  }

  // Quantos vínculos motorista↔rota existem — usado para bloquear exclusão.
  async countVinculos(id: number): Promise<number> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.BigInt, id)
      .query<{ TOTAL: number }>(
        `SELECT COUNT(*) AS TOTAL
         FROM [CORREIO].[dbo].[APP_CAD_MOT_ROTA]
         WHERE ID_CAD_MOT = @id;`,
      );
    return result.recordset[0]?.TOTAL ?? 0;
  }

  async delete(id: number): Promise<boolean> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.BigInt, id)
      .query('DELETE FROM [CORREIO].[dbo].[APP_CAD_MOT] WHERE ID_CAD_MOT = @id;');
    return result.rowsAffected[0] > 0;
  }
}
