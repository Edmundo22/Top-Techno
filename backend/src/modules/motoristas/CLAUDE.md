# modules/motoristas

CRUD da tabela `[CORREIO].[dbo].[APP_CAD_MOT]` (motoristas). **Toda rota é protegida por `authMiddleware`.**

> **Banco CORREIO**: este é o primeiro módulo a consultar o segundo banco (`CORREIO`), no **mesmo** servidor SQL do `TOP_TECHNO`. Usamos o pool existente (`getPool()`) com nome totalmente qualificado `[CORREIO].[dbo].[...]` — **sem** novo pool/connection string. Pré-requisito operacional: o login SQL precisa de permissão (SELECT/INSERT/UPDATE/DELETE) em `CORREIO.dbo`.

## ⚠️ Coluna `TELFONE`

A coluna real é **`TELFONE`** (sem o "E" — typo na tabela). Use o nome literal em todo SQL, no `MotoristaRow` e no DTO (`telfone`). O label visual no frontend é "Telefone". **Não** "corrija" para `TELEFONE` — quebra o INSERT/UPDATE.

## Endpoints

| Método | Path             | Body / Param                          | Retorno                                     |
|--------|------------------|---------------------------------------|---------------------------------------------|
| GET    | `/motoristas`    | —                                     | `{ data: { motoristas: MotoristaDTO[] } }`  |
| POST   | `/motoristas`    | `CreateMotoristaBody` (validateBody)  | `{ data: { motorista: MotoristaDTO } }` (201) |
| PUT    | `/motoristas/:id`| `:id` + `UpdateMotoristaBody`         | `{ data: { motorista: MotoristaDTO } }`     |
| DELETE | `/motoristas/:id`| `:id`                                 | `{ data: { success: true } }`               |

## DTO

```ts
interface MotoristaDTO {
  idCadMot: number;
  motorista: string | null;  // só nome (letras + acentos)
  cnh: string | null;        // só dígitos
  cpf: string | null;        // só dígitos (11), opcional
  telfone: string | null;    // só dígitos (10-11), opcional
  obs: string | null;        // observação livre, opcional
}
```

## Validação (Zod, `motorista.schemas.ts`)

- `motorista`: obrigatório, `min(1).max(120)`, regex `^[A-Za-zÀ-ÿ\s'.]+$` (letras/acentos/espaço/apóstrofo/ponto).
- `cnh`: obrigatório, `min(1).max(20)`, regex `^\d+$` (só dígitos).
- `cpf` / `telfone` / `obs`: **opcionais**. `cpf` = 11 dígitos, `telfone` = 10-11 dígitos. `z.preprocess` converte `''` → `null` antes de validar formato.
- CPF/telefone/CNH são armazenados **só com dígitos** — máscara é responsabilidade do frontend (`utils/masks.ts`).

## Regra de exclusão

`DeleteMotoristaService` checa `MotoristaRepository.countVinculos(id)` em `[CORREIO].[dbo].[APP_CAD_MOT_ROTA]`. Se houver vínculo → `AppError('Motorista vinculado a rotas. Desvincule primeiro.', 409)`. O usuário desvincula um a um na tela (ver [modules/motoristaRota](../motoristaRota/CLAUDE.md)).

## Layers

Espelha o módulo `locais`: `routes` → `controller` (thin, lê `req.validatedParams`) → `services` (`mapMotoristaRowToDTO` em [ListMotoristasService.ts](services/ListMotoristasService.ts) é o ponto único Row → DTO) → `repository` (SQL parametrizado, `INSERT ... OUTPUT INSERTED.ID_CAD_MOT`).

`ID_CAD_MOT` é bindado como `sql.Int` — ajustar para `sql.BigInt` se a PK no banco for `bigint`.
