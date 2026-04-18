import { createApp } from './infra/http/app';
import { startServer } from './infra/http/server';
import { logger } from './shared/utils/logger';

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'unhandledRejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'uncaughtException');
  process.exit(1);
});

const app = createApp();
void startServer(app);
