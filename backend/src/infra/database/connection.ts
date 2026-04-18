import sql from 'mssql';
import { dbConfig } from '../../config/database';
import { logger } from '../../shared/utils/logger';

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .then((pool) => {
        logger.info('SQL Server conectado');
        pool.on('error', (err) => {
          logger.error({ err }, 'Erro no pool SQL');
        });
        return pool;
      })
      .catch((err) => {
        logger.error({ err }, 'Falha ao conectar no SQL Server');
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

export async function closePool(): Promise<void> {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
    poolPromise = null;
    logger.info('Pool SQL Server fechado');
  }
}

export { sql };
