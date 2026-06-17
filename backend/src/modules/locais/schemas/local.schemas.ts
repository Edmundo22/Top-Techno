import { z } from 'zod';

// Aceita POLYGON((lng lat, ...)) ou MULTIPOLYGON(((lng lat, ...)), ...).
// MULTIPOLYGON entra apenas como passagem (registros legados que já estavam
// salvos assim); a tela só cria POLYGON novos via Terra Draw.
const wktPolygonRegex = /^(POLYGON|MULTIPOLYGON)\s*\(\(.+\)\)$/i;

export const localIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Campos comuns aos dois tipos de local.
const baseLocalShape = {
  codigoPonto: z.string().trim().min(1).max(50),
  endereco: z.string().trim().min(1).max(500),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  pontoParada: z.string().trim().max(200).nullable().optional(),
};

// TIPO_LOCAL = 1 → círculo (lat/lng + raio; sem polígono).
const circleLocalSchema = z.object({
  ...baseLocalShape,
  tipoLocal: z.literal(1),
  raio: z.number().int().positive().max(100000),
  poligonoWkt: z.null().optional(),
});

// TIPO_LOCAL = 2 → polígono (lat/lng + WKT; sem raio).
const polygonLocalSchema = z.object({
  ...baseLocalShape,
  tipoLocal: z.literal(2),
  raio: z.null().optional(),
  poligonoWkt: z.string().regex(wktPolygonRegex).max(8000),
});

export const createLocalBodySchema = z.discriminatedUnion('tipoLocal', [
  circleLocalSchema,
  polygonLocalSchema,
]);

export const updateLocalBodySchema = createLocalBodySchema;

export type LocalIdParam = z.infer<typeof localIdParamSchema>;
export type CreateLocalBody = z.infer<typeof createLocalBodySchema>;
export type UpdateLocalBody = z.infer<typeof updateLocalBodySchema>;
