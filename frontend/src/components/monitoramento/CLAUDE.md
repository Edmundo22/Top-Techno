# components/monitoramento

Componentes da tela `/monitoramento`: mapa ao vivo, relógio, badge de última atualização, chips de toggle, markers de veículo/local, polylines de rota e tabela de viagens.

## Dependências externas
- `@react-google-maps/api` — wrapper React do Google Maps JS API. Usa `useJsApiLoader` para carregar o script uma vez.
- Biblioteca `geometry` carregada para decodificar `POLYLINE` encoded do Google via `google.maps.geometry.encoding.decodePath`.
- Chave em `VITE_GOOGLE_MAPS_API_KEY` (arquivo `frontend/.env`, gitignored).

## Arquitetura

```
Monitoramento.tsx (page)
  ├─ Barra única topo       ← ClockCard + LastUpdateBadge + 4 ToggleChip em flex-wrap
  │    ├─ ClockCard         ← pill compacta, useTick(1000) → relógio PT-BR
  │    ├─ LastUpdateBadge   ← pill compacta, lastUpdate + useTick → "Atualizado há Ns"
  │    └─ ToggleChip × 4    ← [Veículos (sempre on, disabled)] [Disponíveis no dia] [Rotas] [Locais]
  ├─ Área mapa (flex row)
  │    ├─ PlacasList         ← (reusada do histórico) coluna vertical com as placas de veículos
  │    │                       **disponíveis** (com viagem hoje). Multi-select.
  │    └─ MapaMonitoramento  ← GoogleMap + MapLegend
  │         ├─ VeiculoMarker  ← Marker + OverlayView + InfoWindow. Cor por `idViagem`:
  │         │                    verde (com viagem), preto (sem viagem).
  │         ├─ [rotas]        ← Polyline + I/F circulares (padrão imperativo)
  │         ├─ LocalMarker    ← pin SVG teardrop colorido por regra de 4 estados
  │         └─ MapLegend      ← canto inferior esquerdo, colapsável, explica cores
  └─ Área inferior (flex-wrap)
       ├─ RotasTable          ← só quando toggle Rotas ativo
       └─ ViagemEntradasTable × N ← uma por placa selecionada (fetch próprio de /viagem-entradas)
```

## Rotas: padrão imperativo

As rotas (polyline + I/F) **não usam** os wrappers declarativos de `@react-google-maps/api`. Em vez disso, um `useEffect` em [MapaMonitoramento.tsx](MapaMonitoramento.tsx) cria instâncias nativas via `new google.maps.Polyline(...)` / `new google.maps.Marker(...)` / `new google.maps.InfoWindow(...)` e as acumula em três `useRef<T[]>([])`. O cleanup chama `setMap(null)` em cada item e zera os arrays.

**Por que imperativo:** o wrapper declarativo deixava polylines órfãs no mapa quando o toggle de rotas desligava. O padrão imperativo dá controle determinístico do ciclo de vida, igual à referência em [../../../../../Mapa.js](../../../../../Mapa.js) (componente de produção do usuário). Dispara quando `[map, showRotas, rotas, selectedViagemId, onSelectViagem]` mudam — por isso `onSelectViagem` precisa ser `useCallback` na página.

## Polling e reconciliação

- `useLivePoll(url, { intervalMs: 15000, enabled })` é o hook genérico. Dispara `GET` no mount e a cada 15 s. Expõe `{ data, loading, error, lastUpdate, refetch }`.
- A tela mantém quatro classes de polling: veículos (sempre), rotas (só com toggle), locais (só com toggle) e, dentro de cada `ViagemEntradasTable` montada, um polling próprio de `/monitoramento/viagem-entradas?idViagem=X`.
- **Reconciliação dos markers**: cada marker no JSX é chaveado pelo ID estável (`idVeiculo`, `idViagemEntrada`, `idViagem`). O React reconcilia automaticamente: veículo que sumiu do array é desmontado, veículo que ficou tem props atualizadas (posição/InfoWindow re-renderizam). Semanticamente equivalente a "apagar o anterior e criar um novo a cada update", **sem flicker**.
- O mapa carrega centralizado em **São Paulo capital** (`-23.55052, -46.633308`) com `zoom: 14`. Não há `fitBounds` — o operador mantém controle do enquadramento.
- `mapTypeControl` habilitado em barra horizontal no canto superior esquerdo com os 4 tipos: Roadmap / Satellite / Hybrid / Terrain.

## Visual

- Ícone do veículo: SVG do Material `directions_car`, `scale: 1.6`. Cor vem de `pickVeiculoColor(v)` em `MapaMonitoramento.tsx`:
  - Verde `#16a34a` quando `(v.idViagem ?? 0) > 0` — veículo tem viagem cadastrada hoje.
  - Preto `#000000` caso contrário — só reportou posição, sem viagem.
- Label `PLACA` renderizado via `<OverlayView>` posicionado acima do ícone, **mesma cor** do ícone.
- Polylines de rota:
  - Sem seleção (default): azul `#1d4ed8` (blue-700), weight 4, opacity 0.85.
  - Rota selecionada: vermelho `#dc2626` (red-600), weight 6, opacity 1.
  - Rotas não selecionadas quando há outra selecionada: cinza claro `#d1d5db`, weight 4, opacity 0.85, `zIndex` mais baixo pra ficar embaixo.
- Markers de início/fim: círculos (scale 7) com label branco **I** / **F**. Cor acompanha a regra da polyline:
  - Sem seleção: `#1d4ed8`.
  - Selecionada: `#dc2626`.
  - Não selecionadas (quando há outra selecionada): cinza `#9ca3af` (um pouco mais escuro que a linha pra o label branco continuar legível).
- Marker do local: pin SVG teardrop colorido conforme o status de entrada/saída da `TB_VIAGEM_ENTRADA` (ver "Cor do local" abaixo).
- Círculo do raio: mesma cor do pin com `fillOpacity: 0.12`.

## Cor do local

Calculada em `LocalMarker.pickLocalColor(data)` a partir de `dtEntPrevista`, `dtSaiPrevista`, `dtEntReal`, `dtSaiReal` (origem: colunas homônimas de `TB_VIAGEM_ENTRADA`). Comparação feita em ISO local (lex).

| Estado                                                   | Cor                 |
|----------------------------------------------------------|---------------------|
| Nem entrada nem saída (ambos `null`)                     | preto `#000000`     |
| Entrada **ou** saída real depois do previsto (atrasado)  | vermelho `#dc2626`  |
| Entrou no prazo e ainda não saiu                         | roxo `#7c3aed`      |
| Resto (no prazo, concluído ou só entrada no prazo)       | azul `#1d4ed8`      |

Prioridade: **sem dado → atrasado → em curso no prazo → no prazo**. Atrasado sobrescreve o resto; uma única entrada ou saída atrasada basta.

Pontinhos coloridos no InfoWindow do local são independentes da cor do pin: amarelo `#eab308` ao lado de "Previsto (Entrada/Saída)", verde `#16a34a` ao lado de "Realizado (Entrada/Saída)" — são etiquetas de seção, não de status.

## Seleção de viagem

- `selectedViagemId: number | null` vive em `Monitoramento.tsx` e é propagado para `MapaMonitoramento` → `RotaLayer` e para `RotasTable`.
- Click em I/F no mapa ou em uma linha da tabela chama `onSelectViagem(idViagem)`; um segundo click no mesmo alvo desmarca (`null`).
- Rota selecionada: polyline mais grossa e opaca; linha na tabela com fundo `brand-accent-soft` e `ring-2 ring-inset ring-brand-accent`. A tabela faz `scrollIntoView({ block: 'nearest', behavior: 'smooth' })` na linha selecionada.
- Desligar o toggle "Rotas do dia" limpa a seleção (`null`) — sem estado pendurado.

## Filtros de veículos (toggle + placas)

Três estados coordenados em `Monitoramento.tsx`:

- `soDisponiveis: boolean` — chip "Disponíveis no dia". Quando ON, filtra o mapa para veículos com `idViagem > 0` (verdes).
- `selectedPlacas: string[]` — placas escolhidas na `PlacasList` lateral (multi-select). **Prevalece** sobre `soDisponiveis` quando não-vazio: o mapa mostra só os veículos dessas placas, ignorando o chip.
- Cada placa selecionada monta um `<ViagemEntradasTable>` na área inferior, lado a lado com a `RotasTable` (se ativa). `flex-wrap gap-3` → grids se empilham em telas estreitas.

## Grid `ViagemEntradasTable`

Componente auto-contido em [ViagemEntradasTable.tsx](ViagemEntradasTable.tsx). Recebe `{ idViagem, placa }` e roda seu próprio `useLivePoll` a cada 15 s em `/monitoramento/viagem-entradas?idViagem=X`. Visual idêntico à `RotasTable` (Card, thead `bg-brand-line-soft`, td `px-5 py-2`).

Regra de cor da célula:
- `ENT REAL`: fundo `bg-sky-100` se `dtEntRealIso <= dtEntPrevistaIso` (no prazo/adiantado); `bg-red-100` se maior (atrasado). Sem cor quando faltar algum dos lados.
- `SAI REAL`: mesma lógica contra `dtSaiPrevistaIso`.

Comparação é lex em ISO local (`"2026-04-22T14:30:45"`). Para valores em dias diferentes, a comparação continua correta porque o prefixo de data é incluído.

## Datas
Formatação em `src/utils/datetime.ts`:
- `formatBRDateTime("2026-04-10T06:00:00")` → `04/10/2026 às 06:00` (tabela)
- `formatBRDateTimeFull("...")` → `10/04/2026 06:00:00` (InfoWindow)
- `formatClockLong(date)` → `{ date: "quinta-feira, 20 de abril de 2026", time: "14:32:07" }`
- `formatRelative(fromMs, nowMs)` → `"há 4 s"` / `"há 2 min 3 s"`

## Regra de "hoje"
O corte é feito no backend via `CAST(vi.DT_VIAGEM AS DATE) = CAST(GETDATE() AS DATE)`. Se o operador perceber dados fora do dia, é questão de fuso do SQL Server — ver `backend/src/modules/monitoramento/CLAUDE.md`.
