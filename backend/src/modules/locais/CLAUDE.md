# modules/locais

CRUD da tabela `[dbo].[TB_LOCAL]`. **Toda rota é protegida por `authMiddleware`.**

## Endpoints

| Método | Path          | Body / Param                        | Retorno                                |
|--------|---------------|-------------------------------------|----------------------------------------|
| GET    | `/locais`     | —                                   | `{ data: { locais: LocalDTO[] } }`     |
| POST   | `/locais`     | `CreateLocalBody` (validateBody)    | `{ data: { local: LocalDTO } }` (201)  |
| PUT    | `/locais/:id` | `:id` + `UpdateLocalBody`           | `{ data: { local: LocalDTO } }`        |
| DELETE | `/locais/:id` | `:id`                               | `{ data: { success: true } }`          |

`:id` é validado via `validateParams(localIdParamSchema)` — espelho do `validateQuery`, escreve em `req.validatedParams`. Foi adicionado em [shared/middlewares/validate.ts](../../shared/middlewares/validate.ts) junto com este módulo.

## DTO

```ts
interface LocalDTO {
  idLocal: number;
  codigoPonto: string | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  raio: number | null;     // metros
  pontoParada: string | null;
  poligonoWkt: string | null; // ex.: "POLYGON((lng lat, lng lat, ...))"
}
```

`pontoParada` reusa `shared/utils/normalizePontoParada` (extraído do `monitoramento`) — coluna é heterogênea no banco (string/number/bool).

## `LOCAL_GEO` (`geography`)

A coluna `LOCAL_GEO` no SQL Server é `geography` e pode conter qualquer tipo (Point, Polygon, MultiPolygon...). Internamente é binário (`0xE610...` etc.) — sempre conversamos com ela em WKT nos limites.

- **Leitura**: o `SELECT` faz `LOCAL_GEO.STGeometryType()` e só devolve `STAsText()` quando o tipo é `Polygon` ou `MultiPolygon`. Registros legados em que `LOCAL_GEO` foi salvo como `Point` (espelho do par LAT/LNG) voltam com `poligonoWkt = null` — o front desabilita o botão de polígono naqueles casos.
- **Escrita**: `geography::STGeomFromText(@wkt, 4326)`. `@wkt` é `NVarChar(MAX)` parametrizado. O frontend orienta o anel em **CCW (left-hand rule)** antes de enviar (`utils/wkt.ts → pathToWktPolygon`) — `geography` rejeita polígonos CW (interpreta como "tudo, exceto a área desenhada").

**Ordem WKT em `geography`**: `(longitude latitude)`. O frontend gera nessa ordem.

**SRID 4326 (WGS84)** bate com `LATITUDE`/`LONGITUDE` em graus decimais que o resto do sistema já usa.

A regex de validação aceita `POLYGON` ou `MULTIPOLYGON` para tolerar pass-through de registros legados durante edição.

## Layers

- `routes/local.routes.ts` → `authMiddleware`, paths, `validateBody`/`validateParams`.
- `schemas/local.schemas.ts` → Zod. `wktPolygonRegex` valida só o formato de fora; a sanidade geométrica fica por conta do `STGeomFromText` (lança 500 caso inválido — coberto por `errorMiddleware`).
- `controllers/LocalController.ts` → thin. Lê `req.body` (validado), `req.validatedParams.id`, chama service.
- `services/{List,Create,Update,Delete}LocalService.ts` → orquestração. `mapLocalRowToDTO` em [services/ListLocaisService.ts](services/ListLocaisService.ts) é o ponto único de mapeamento Row → DTO; outros services reusam.
- `repositories/LocalRepository.ts` → SQL puro, sempre parametrizado. `INSERT` usa `OUTPUT INSERTED.ID_LOCAL` para recuperar o ID (ID_LOCAL é `bigint IDENTITY`).

## Observações

- Sem unique constraint em `CODIGO_PONTO` no banco; service não checa duplicata. Adicionar caso o produto peça.
- Update faz `findById` antes do `UPDATE` para distinguir 404 de "nada mudou".
- `DELETE` lança `AppError(404)` se `rowsAffected[0] === 0`.
