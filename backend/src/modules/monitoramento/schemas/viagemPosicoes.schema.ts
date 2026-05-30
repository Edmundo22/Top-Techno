import { z } from 'zod';

export const viagemPosicoesQuerySchema = z.object({
  idViagem: z.coerce.number().int().positive(),
});

export type ViagemPosicoesQuery = z.infer<typeof viagemPosicoesQuerySchema>;
