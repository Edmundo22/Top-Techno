# modules/monitoramento

Módulo responsável pelos dados da tela de monitoramento ao vivo: posição atual dos veículos, rotas do dia e locais de parada do dia. **Toda rota é protegida por `authMiddleware`.**

## Endpoints

| Método | Path                                      | Descrição                                                                                          |
|--------|-------------------------------------------|----------------------------------------------------------------------------------------------------|
| GET    | `/monitoramento/veiculos`                 | Todos os veículos de `TB_VEICULO` com `LATITUDE`/`LONGITUDE` (sem corte por `DT_ULT_POSICAO`). `idViagem` = viagem do dia (ou `null`). `temRota` = `true` quando a viagem do dia tem `POLYLINE` em `FT_CABECALHO`. |
| GET    | `/monitoramento/rotas`                    | Viagens de hoje + `POLYLINE` da ficha + `numeroLinha`, `numeroFt`, `idFt` + status + placa + datas início/fim. |
| GET    | `/monitoramento/locais`                   | Locais (`TB_VIAGEM_ENTRADA` ⨝ `TB_LOCAL`) das viagens de hoje, incluindo `codigoPonto`, previstas e reais de entrada/saída. |
| GET    | `/monitoramento/viagem-entradas?idViagem=X` | Paradas (`TB_VIAGEM_ENTRADA` ⨝ `TB_LOCAL` ⨝ `TB_VEICULO`) de uma viagem. Retorna placa, local, horários previstos/reais (`HH:mm:ss`), ordem e `tDentroMin` (DATEDIFF MINUTE entre real-ent e real-sai). Validado com Zod. |
| GET    | `/monitoramento/viagem-posicoes?idViagem=X` | Posições registradas (`TB_VIAGEM_POSICAO` ⨝ `TB_LOCAL`) de uma viagem, ordenadas por `DT_POSICAO`. Cada item traz `posi` (ROW_NUMBER), `dtPosicao` ISO local, velocidade, ignição normalizada, lat/lng, `distRota` em metros e `pontoParada` (null se vazio/null no banco). Frontend usa pra desenhar bolinhas numeradas no mapa, azul ≤500m e vermelho >500m da rota. Validado com Zod. |

Todas retornam `{ data: { ... } }` via `ok(res, ...)`.

## Regra de "dia atual"

O corte "dia atual" depende da rota:

- **Veículos**: **sem corte por `DT_ULT_POSICAO`** — todo veículo com `LATITUDE`/`LONGITUDE` aparece no mapa, tenha reportado hoje ou não. A query usa `OUTER APPLY` em `TB_VIAGEM` (do dia, range sargável `v2.DT_VIAGEM >= CAST(GETDATE() AS DATE) AND v2.DT_VIAGEM < DATEADD(DAY, 1, CAST(GETDATE() AS DATE))`) com `LEFT JOIN FT_CABECALHO` para devolver, além de `ID_VIAGEM`, o campo `TEM_ROTA` (1 quando a viagem existe **e** a ficha referenciada tem `POLYLINE` não-vazia, 0 caso contrário). O frontend usa `temRota` para decidir a cor do veículo: verde (`#16a34a`) por padrão, preto (`#000000`) quando sem rota. Por padrão, **só os com rota aparecem**; os sem rota só com o toggle ligado.
- **Rotas / Locais**: range sargável `vi.DT_VIAGEM >= CAST(@today AS DATE) AND vi.DT_VIAGEM < DATEADD(DAY, 1, CAST(@today AS DATE))` — só viagens planejadas/andando hoje. O `CAST` fica no parâmetro, não na coluna, para permitir index seek em vez de scan.
- **Viagem-entradas**: filtra por `ent.ID_VIAGEM = @idViagem` (parâmetro). Sem corte de data — a viagem em si já garante que é do dia, já que o frontend só chama com `ID_VIAGEM` vindo de `/veiculos`.

Em **Rotas / Locais**, "hoje" é computado no **Node** com `Intl.DateTimeFormat({ timeZone: 'America/Sao_Paulo' })` e injetado como `@today` na query (`shared/utils/datetime.ts → todayInBrazil`), independente do fuso do SQL Server. A query de **Veículos** usa `CAST(GETDATE() AS DATE)` direto no SQL como limite inferior do range da viagem do dia (depende do fuso do SQL Server), mas como ela não corta veículos pela data, o veículo nunca "some" do mapa — no máximo deixa de casar a viagem perto da virada do dia UTC.

## Formato das datas na resposta

As colunas `datetime` voltam como `Date` do driver `mssql`. O helper `shared/utils/datetime.ts → toIsoLocal(d)` devolve `YYYY-MM-DDTHH:mm:ss` usando o fuso local do processo Node. **Servidor SQL, servidor Node e operador precisam estar no mesmo fuso** para a leitura bater.

A formatação visual (`04/10/2026 às 06:00`) acontece no frontend.

## Layers

- `routes/` → registra `authMiddleware` + paths. `/viagem-entradas` usa `validateQuery(viagemEntradasQuerySchema)`.
- `schemas/` → Zod. `viagemEntradas.schema.ts` valida `{ idViagem: z.coerce.number().int().positive() }` da query string.
- `controllers/MonitoramentoController.ts` → thin, delega para os services. `listViagemEntradas` lê `req.validatedQuery` (injetado por `validateQuery`).
- `services/List{Veiculos,Rotas,Locais,ViagemEntradas}*Service.ts` → mapeiam linhas do banco para DTO (camelCase, valores normalizados).
- `repositories/MonitoramentoRepository.ts` → SQL puro, zero regra. `listViagemEntradas(idViagem)` parametriza com `sql.Int`.

Segue o mesmo padrão do módulo `auth` e `usuarios`. Ver [backend/CLAUDE.md](../../../CLAUDE.md).

## Consumo esperado no frontend

O frontend faz polling a cada 15 s nos três endpoints de lista (veículos/rotas/locais) e também em cada `/viagem-entradas?idViagem=X` quando há placa selecionada no painel. Os volumes esperados (dezenas de veículos, centenas de entradas por dia) cabem em respostas únicas sem paginação. Se crescer, paginar `/rotas` e `/locais` por ID_VIAGEM.
