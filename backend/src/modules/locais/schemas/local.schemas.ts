import { z } from 'zod';

// Aceita POLYGON((lng lat, ...)) ou MULTIPOLYGON(((lng lat, ...)), ...).
// MULTIPOLYGON entra apenas como passagem (registros legados que já estavam
// salvos assim); a tela só cria POLYGON novos via DrawingManager.
const wktPolygonRegex = /^(POLYGON|MULTIPOLYGON)\s*\(\(.+\)\)$/i;

export const localIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createLocalBodySchema = z.object({
  codigoPonto: z.string().trim().min(1).max(50),
  endereco: z.string().trim().min(1).max(500),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  raio: z.number().int().positive().max(100000),
  pontoParada: z.string().trim().max(200).nullable().optional(),
  poligonoWkt: z.string().regex(wktPolygonRegex).max(8000).nullable().optional(),
});

export const updateLocalBodySchema = createLocalBodySchema;

export type LocalIdParam = z.infer<typeof localIdParamSchema>;
export type CreateLocalBody = z.infer<typeof createLocalBodySchema>;
export type UpdateLocalBody = z.infer<typeof updateLocalBodySchema>;
