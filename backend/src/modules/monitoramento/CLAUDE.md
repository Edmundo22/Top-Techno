# modules/monitoramento

Módulo responsável pelos dados da tela de monitoramento ao vivo: posição atual dos veículos, rotas do dia e locais de parada do dia. **Toda rota é protegida por `authMiddleware`.**

## Endpoints

| Método | Path                        | Descrição                                                                                          |
|--------|-----------------------------|----------------------------------------------------------------------------------------------------|
| GET    | `/monitoramento/veiculos`   | Veículos de `TB_VEICULO` cuja `DT_ULT_POSICAO` é de hoje. Posição e telemetria ao vivo.            |
| GET    | `/monitoramento/rotas`      | Viagens de hoje + `POLYLINE` da ficha (`FT_CABECALHO`) + status + placa + datas início/fim.       |
| GET    | `/monitoramento/locais`     | Locais referenciados por `TB_VIAGEM_ENTRADA` das viagens de hoje, com previstas e reais de entrada/saída. |

Todas retornam `{ data: { ... } }` via `ok(res, ...)`.

## Regra de "dia atual"

O corte "dia atual" depende da rota:

- **Veículos**: `CAST(v.DT_ULT_POSICAO AS DATE) = CAST(GETDATE() AS DATE)` — quem reportou posição hoje aparece no mapa, independe de ter viagem cadastrada.
- **Rotas / Locais**: `CAST(vi.DT_VIAGEM AS DATE) = CAST(GETDATE() AS DATE)` — só viagens planejadas/andando hoje.

Ambos usam o relógio do SQL Server.

- Se o SQL Server estiver em fuso Brasil (UTC-3), funciona direto.
- Se estiver em UTC, trocar `GETDATE()` por `CAST(SWITCHOFFSET(SYSDATETIMEOFFSET(), '-03:00') AS DATE)` — caso apareça o sintoma (veículos/viagens de "ontem" às 21h desaparecendo cedo), é esse o ponto de edição.

## Formato das datas na resposta

As colunas `datetime` voltam como `Date` do driver `mssql`. O helper `shared/utils/datetime.ts → toIsoLocal(d)` devolve `YYYY-MM-DDTHH:mm:ss` usando o fuso local do processo Node. **Servidor SQL, servidor Node e operador precisam estar no mesmo fuso** para a leitura bater.

A formatação visual (`04/10/2026 às 06:00`) acontece no frontend.

## Layers

- `routes/` → registra `authMiddleware` + paths.
- `controllers/MonitoramentoController.ts` → thin, delega para os services.
- `services/List{Veiculos,Rotas,Locais}*Service.ts` → mapeiam linhas do banco para DTO (camelCase, valores normalizados).
- `repositories/MonitoramentoRepository.ts` → SQL puro, zero regra.

Segue o mesmo padrão do módulo `auth` e `usuarios`. Ver [backend/CLAUDE.md](../../../CLAUDE.md).

## Consumo esperado no frontend

O frontend faz polling a cada 15 s nos três endpoints. Os volumes esperados (dezenas de veículos, centenas de entradas por dia) cabem em respostas únicas sem paginação. Se crescer, paginar `/rotas` e `/locais` por ID_VIAGEM.
