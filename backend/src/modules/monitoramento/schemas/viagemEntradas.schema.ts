import { z } from 'zod';

export const viagemEntradasQuerySchema = z.object({
  idViagem: z.coerce.number().int().positive(),
});

export type ViagemEntradasQuery = z.infer<typeof viagemEntradasQuerySchema>;
