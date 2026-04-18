import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),

  DB_SERVER: z.string().min(1, 'DB_SERVER é obrigatório'),
  DB_PORT: z.coerce.number().int().positive().default(1433),
  DB_NAME: z.string().min(1, 'DB_NAME é obrigatório'),
  DB_USER: z.string().min(1, 'DB_USER é obrigatório'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD é obrigatório'),
  DB_ENCRYPT: z
    .string()
    .default('true')
    .transform((v) => v.toLowerCase() === 'true'),
  DB_TRUST_SERVER_CERTIFICATE: z
    .string()
    .default('true')
    .transform((v) => v.toLowerCase() === 'true'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter ao menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('30d'),

  COOKIE_NAME: z.string().default('tt_session'),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v.toLowerCase() === 'true'),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_MAX_AGE_DAYS: z.coerce.number().int().positive().default(30),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
