import { z } from 'zod';

export const historicoQuerySchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'data deve estar no formato YYYY-MM-DD'),
});

export type HistoricoQuery = z.infer<typeof historicoQuerySchema>;
