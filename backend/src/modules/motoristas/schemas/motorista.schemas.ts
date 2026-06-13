import { z } from 'zod';

// MOTORISTA = nome de pessoa: letras, acentos, espaço, apóstrofo e ponto.
const nomeRegex = /^[A-Za-zÀ-ÿ\s'.]+$/;
const digitsRegex = /^\d+$/;

// Campos opcionais chegam como '' quando o usuário não preenche — tratamos
// como null antes da validação de formato.
const emptyToNull = (v: unknown): unknown =>
  typeof v === 'string' && v.trim() === '' ? null : v;

export const motoristaIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createMotoristaBodySchema = z.object({
  motorista: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(nomeRegex, 'Nome deve conter apenas letras e acentos'),
  cnh: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(digitsRegex, 'CNH deve conter apenas números'),
  cpf: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .regex(/^\d{11}$/, 'CPF deve conter 11 dígitos')
      .nullable()
      .optional(),
  ),
  telfone: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .regex(/^\d{10,11}$/, 'Telefone deve conter 10 ou 11 dígitos')
      .nullable()
      .optional(),
  ),
  obs: z.preprocess(emptyToNull, z.string().trim().max(500).nullable().optional()),
});

export const updateMotoristaBodySchema = createMotoristaBodySchema;

export type MotoristaIdParam = z.infer<typeof motoristaIdParamSchema>;
export type CreateMotoristaBody = z.infer<typeof createMotoristaBodySchema>;
export type UpdateMotoristaBody = z.infer<typeof updateMotoristaBodySchema>;
