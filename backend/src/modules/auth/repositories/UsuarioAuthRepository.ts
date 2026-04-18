import { getPool, sql } from '../../../infra/database/connection';

export interface UsuarioRow {
  ID_USUARIO: number;
  USUARIO: string;
  EMAIL: string;
  SENHA: string;
}

export class UsuarioAuthRepository {
  async findByUsuario(usuario: string): Promise<UsuarioRow | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('usuario', sql.NVarChar(100), usuario)
      .query<UsuarioRow>(
        `SELECT ID_USUARIO, USUARIO, EMAIL, SENHA
         FROM [TOP_TECHNO].[dbo].[USUARIOS]
         WHERE USUARIO = @usuario`,
      );

    return result.recordset[0] ?? null;
  }

  async findById(id: number): Promise<Omit<UsuarioRow, 'SENHA'> | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<Omit<UsuarioRow, 'SENHA'>>(
        `SELECT ID_USUARIO, USUARIO, EMAIL
         FROM [TOP_TECHNO].[dbo].[USUARIOS]
         WHERE ID_USUARIO = @id`,
      );

    return result.recordset[0] ?? null;
  }
}
