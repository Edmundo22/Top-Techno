# modules/motoristaRota

Vínculo motorista↔rota da tela **Motorista por Rota**. Lista as rotas (fichas
técnicas), os motoristas vinculados/disponíveis de cada rota, e faz vincular /
definir titular / desvincular. **Toda rota é protegida por `authMiddleware`.**

Mistura os dois bancos: rotas vêm de `[TOP_TECHNO].[dbo].[FT_CABECALHO]`,
vínculos e motoristas de `[CORREIO].[dbo].[APP_CAD_MOT_ROTA]` / `[APP_CAD_MOT]`.
Tudo pelo mesmo pool (`getPool()`), nomes qualificados. Ver pré-requisito de
permissão CORREIO em [modules/motoristas](../motoristas/CLAUDE.md).

## Endpoints

| Método | Path                                    | Entrada                          | Retorno                              |
|--------|-----------------------------------------|----------------------------------|--------------------------------------|
| GET    | `/motorista-rota/rotas`                 | —                                | `{ data: { rotas: RotaFtDTO[] } }`   |
| GET    | `/motorista-rota/vinculados?idFt=X`     | `validateQuery(idFtQuerySchema)` | `{ data: { vinculados: VinculadoDTO[] } }` |
| GET    | `/motorista-rota/disponiveis?idFt=X`    | `validateQuery(idFtQuerySchema)` | `{ data: { disponiveis: DisponivelDTO[] } }` |
| POST   | `/motorista-rota/vincular`              | `vincularBodySchema`             | `{ data: { success: true } }` (201)  |
| PATCH  | `/motorista-rota/titular`               | `setTitularBodySchema`           | `{ data: { success: true } }`        |
| DELETE | `/motorista-rota/vinculo/:idCadMotRota` | `idCadMotRotaParamSchema`        | `{ data: { success: true } }`        |

## DTOs

```ts
interface RotaFtDTO   { idFt: number; numeroLinha: string | null; numeroFt: string | null; polyline: string | null; }
interface VinculadoDTO{ idCadMotRota: number; idCadMot: number; motorista: string | null; cnh: string | null; titular: boolean; dtInsercao: string | null; }
interface DisponivelDTO{ idCadMot: number; motorista: string | null; cnh: string | null; }
```

## Regras de negócio

- **Vincular** (`POST /vincular`): bulk insert em `APP_CAD_MOT_ROTA` com `TITULAR = 0` e `DT_INSERCAO = GETDATE()`. SQL parametrizado (1 param por id, cap 500). Usa `INSERT ... SELECT ... WHERE NOT EXISTS` → idempotente: ids já vinculados são ignorados (sem duplicar vínculo numa corrida). O front recarrega vinculados + disponíveis após o sucesso.
- **Titular** (`PATCH /titular`): no máximo **um titular por rota**. `setTitular` faz, no mesmo batch (autocommit atômico): `UPDATE ... SET TITULAR = 0 WHERE ID_FT_TOP = @idFt` (zera todos) e depois marca o escolhido. `titular=false` deixa a rota sem titular (estado válido — vínculos novos entram com 0).
- **Desvincular** (`DELETE /vinculo/:idCadMotRota`): remove o vínculo daquela rota pelo PK `ID_CAD_MOT_ROTA`. 404 se não existir. O front confirma antes e, após remover, recarrega vinculados + disponíveis (o motorista reaparece em disponíveis).
- **Rotas** (`GET /rotas`): devolve TODAS as fichas, inclusive `POLYLINE` null/vazia — sem filtro (diferente de `/monitoramento/rotas`, que filtra). O frontend guarda o decode.

## Layers

`routes` → `controller` (thin; lê `req.validatedQuery` / `req.validatedParams`) → `services` (um por operação, com mappers Row → DTO; `DT_INSERCAO` via `toIsoLocal`) → `MotoristaRotaRepository` (SQL puro, parametrizado). `ID_*` são `bigint` no banco → bindados como `sql.BigInt`; `TITULAR` como `sql.Bit`.

## ⚠️ bigint volta como string

As PKs/FKs (`ID_CAD_MOT`, `ID_FT_TOP`, `ID_CAD_MOT_ROTA`) são `bigint` e o driver `tedious` as devolve como **string** no recordset. Por isso os schemas de corpo (`vincularBodySchema`, `setTitularBodySchema`) usam `z.coerce.number()` — sem o coerce, o `z.number()` rejeitava os IDs reenviados pelo front e respondia **400**. As queries (`idFtQuerySchema`) já coeriam por virem da query string.
