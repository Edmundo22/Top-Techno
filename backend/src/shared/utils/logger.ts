import pino from 'pino';
import { env } from '../../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss' },
        }
      : undefined,
  redact: {
    paths: ['req.headers.cookie', 'req.headers.authorization', '*.senha', '*.password'],
    remove: true,
  },
});
