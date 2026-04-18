import type { Application } from 'express';
import { env } from '../../config/env';
import { closePool, getPool } from '../database/connection';
import { logger } from '../../shared/utils/logger';

export async function startServer(app: Application): Promise<void> {
  try {
    await getPool();
  } catch (err) {
    logger.error({ err }, 'Erro ao inicializar pool do banco — o servidor não irá subir');
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`API TOP TECHNO rodando em http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Recebido sinal de shutdown');
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
    setTimeout(() => {
      logger.warn('Shutdown forçado após timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}
