import { z } from 'zod';

export const loginSchema = z.object({
  usuario: z
    .string()
    .trim()
    .min(1, 'Usuário é obrigatório')
    .max(100, 'Usuário excede o tamanho máximo'),
  senha: z
    .string()
    .min(1, 'Senha é obrigatória')
    .max(200, 'Senha excede o tamanho máximo'),
});

export type LoginDTO = z.infer<typeof loginSchema>;
