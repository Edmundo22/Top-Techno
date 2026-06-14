import { z } from 'zod';

// Query ?idFt=X — mesmo padrão de viagemEntradas.schema (coerce de string).
export const idFtQuerySchema = z.object({
  idFt: z.coerce.number().int().positive(),
});

// IDs usam z.coerce.number porque colunas bigint (ID_CAD_MOT, ID_FT_TOP) voltam
// do driver `tedious` como string; ao reenviar no corpo, precisam ser coeridas.
export const vincularBodySchema = z.object({
  idFt: z.coerce.number().int().positive(),
  // Cap em 500 ids fica bem abaixo do limite de 2100 parâmetros do mssql.
  idsCadMot: z.array(z.coerce.number().int().positive()).min(1).max(500),
});

export const setTitularBodySchema = z.object({
  idFt: z.coerce.number().int().positive(),
  idCadMot: z.coerce.number().int().positive(),
  titular: z.boolean(),
});

export const idCadMotRotaParamSchema = z.object({
  idCadMotRota: z.coerce.number().int().positive(),
});

export type IdFtQuery = z.infer<typeof idFtQuerySchema>;
export type VincularBody = z.infer<typeof vincularBodySchema>;
export type SetTitularBody = z.infer<typeof setTitularBodySchema>;
export type IdCadMotRotaParam = z.infer<typeof idCadMotRotaParamSchema>;
