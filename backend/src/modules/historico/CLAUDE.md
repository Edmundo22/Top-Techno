# modules/historico

Módulo responsável por dados históricos de dias passados. Mesmo formato do módulo `monitoramento`, mas parametrizado por uma data escolhida pelo usuário. **Toda rota é protegida por `authMiddleware`.**

## Endpoints

| Método | Path                           | Query           | Descrição                                                                                          |
|--------|--------------------------------|-----------------|----------------------------------------------------------------------------------------------------|
| GET    | `/historico/posicoes`          | `?data=YYYY-MM-DD` | Pontos de `TB_VIAGEM_POSICAO` cuja `DT_POSICAO` cai na data. `LEFT JOIN TB_LOCAL` para `PONTO_PARADA`. |
| GET    | `/historico/rotas`             | `?data=YYYY-MM-DD` | Viagens cuja `DT_VIAGEM` = data + `POLYLINE` da `FT_CABECALHO`.                                    |
| GET    | `/historico/locais`            | `?data=YYYY-MM-DD` | Entradas em locais de `TB_LOCAL_HISTORICO` cuja `DT_ENTRADA` cai na data, com LAT/LNG/RAIO/PONTO_PARADA do `TB_LOCAL` e placa do `TB_VEICULO`. |

Todas retornam `{ data: { ... } }` via `ok(res, ...)`. Validação de query via `historicoQuerySchema` (Zod).

## Regra de "dia escolhido"

O corte é feito no SQL com `CAST(coluna AS DATE) = CAST(@data AS DATE)`. O `@data` chega como `YYYY-MM-DD` (validado por regex no schema). Assim como em `monitoramento`, o fuso efetivo é o do SQL Server — mesmo ponto de edição caso aparente desvio de fuso.

## Layers

- `routes/` → registra `authMiddleware` + paths.
- `controllers/HistoricoController.ts` → valida `req.query` com Zod e delega para o service.
- `services/List{Posicoes,Rotas,Locais}HistoricoService.ts` → mapeia linhas → DTO camelCase.
- `repositories/HistoricoRepository.ts` → SQL puro, parametrizado com `.input('data', ...)`.
- `schemas/historico.schemas.ts` → `historicoQuerySchema` (regex `YYYY-MM-DD`).

Segue o padrão do módulo `monitoramento`. Ver [backend/CLAUDE.md](../../../CLAUDE.md).

## Sobre `PosicoesDTO.ignicao`

A coluna `IGNICAO` no banco é heterogênea (às vezes `0/1`, `'LIGADA'/'DESLIGADA'`, bool). O service normaliza para `{ label: 'LIGADA' | 'DESLIGADA' | string | null, on: boolean | null }`. O frontend usa `ignicaoOn === false` para pintar o ícone de roxo — regra de cor tem prioridade sobre distância de rota.

## Sobre locais duplicados no mesmo dia

O mesmo `ID_LOCAL` pode aparecer várias vezes em `TB_LOCAL_HISTORICO` no mesmo dia (múltiplas entradas do mesmo veículo). O backend devolve **todas** as linhas — a desambiguação visual (offset dos markers sobrepostos) é feita no frontend.
