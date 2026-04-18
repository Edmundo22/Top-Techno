import { getPool, sql } from '../../../infra/database/connection';

export interface UsuarioListItem {
  ID_USUARIO: number;
  USUARIO: string;
  EMAIL: string;
}

export class UsuarioRepository {
  async list(): Promise<UsuarioListItem[]> {
    const pool = await getPool();
    const result = await pool.request().query<UsuarioListItem>(
      `SELECT ID_USUARIO, USUARIO, EMAIL
       FROM [TOP_TECHNO].[dbo].[USUARIOS]
       ORDER BY USUARIO ASC`,
    );
    return result.recordset;
  }
}
