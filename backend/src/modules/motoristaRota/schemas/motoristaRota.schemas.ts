import { z } from 'zod';

// Query ?idFt=X — mesmo padrão de viagemEntradas.schema (coerce de string).
export const idFtQuerySchema = z.object({
  idFt: z.coerce.number().int().positive(),
});

export const vincularBodySchema = z.object({
  idFt: z.number().int().positive(),
  // Cap em 500 ids fica bem abaixo do limite de 2100 parâmetros do mssql.
  idsCadMot: z.array(z.number().int().positive()).min(1).max(500),
});

export const setTitularBodySchema = z.object({
  idFt: z.number().int().positive(),
  idCadMot: z.number().int().positive(),
  titular: z.boolean(),
});

export const idCadMotRotaParamSchema = z.object({
  idCadMotRota: z.coerce.number().int().positive(),
});

export type IdFtQuery = z.infer<typeof idFtQuerySchema>;
export type VincularBody = z.infer<typeof vincularBodySchema>;
export type SetTitularBody = z.infer<typeof setTitularBodySchema>;
export type IdCadMotRotaParam = z.infer<typeof idCadMotRotaParamSchema>;
