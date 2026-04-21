import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Email inválido')
    .max(200, 'Email excede o tamanho máximo'),
  senha: z
    .string()
    .min(1, 'Senha é obrigatória')
    .max(200, 'Senha excede o tamanho máximo'),
});

export type LoginDTO = z.infer<typeof loginSchema>;
