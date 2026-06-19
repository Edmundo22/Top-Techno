# components/monitoramento

Componentes da tela `/monitoramento`: mapa ao vivo, relógio, badge de última atualização, cards informativos com toggle, filtro lateral por placa **e por linha**, polylines de rota (com pulsação quando selecionada), markers de veículo/local e tabelas inferiores.

## Dependências externas

- `@react-google-maps/api` — wrapper React do Google Maps JS API. `useJsApiLoader` carrega o script uma vez.
- Bibliotecas em `MAP_LIBRARIES` (de [services/googleMaps.ts](../../services/googleMaps.ts)): `'geometry'` (decodificação de polyline) + `'drawing'` (cadastros).
- Chave em `VITE_GOOGLE_MAPS_API_KEY` (`frontend/.env`, gitignored).

## Arquitetura

```
Monitoramento.tsx (page)
  ├─ Barra superior (3 blocos em flex-wrap)
  │    ├─ Esquerda:  ClockCard + LastUpdateBadge
  │    ├─ Meio:      StatToggleCard × 2  (Veículos com rota / sem rota)
  │    └─ Direita:   ToggleChip × 2      (Todas as rotas de hoje / Todos os locais de hoje)
  ├─ Área principal (flex row, 3 colunas no lg)
  │    └─ FiltrosLateral (envolve o mapa; placas | mapa | linhas)
  │         ├─ PlacasFilterCard  ← ESQUERDA: lista vertical de pílulas com placas (multi-select)
  │         ├─ MapaMonitoramento ← MEIO (recebido como children do FiltrosLateral)
  │         │    ├─ VeiculoMarker     ← cor vem de `temRota`: verde quando true, preto quando false
  │         │    ├─ [rotas]            ← Polyline + I/F (padrão imperativo)
  │         │    ├─ LocalMarker        ← pin teardrop, cor por status de entrada/saída
  │         │    └─ MapLegend + MapPoiToggle  ← canto inferior esquerdo (slot extra)
  │         └─ LinhasFilterCard  ← DIREITA: lista vertical de pílulas com NUMERO_LINHA (multi-select)
  └─ Área inferior (flex-wrap)
       ├─ RotasTable              ← Todas as rotas de hoje (coluna Linha + status + placa + datas)
       └─ ViagemEntradasTable × N ← uma por placa selecionada
```

## Critério "com rota"

`v.temRota === true` quando o backend conseguiu encontrar uma viagem de hoje **e** a `FT_CABECALHO` da viagem tem `POLYLINE` não-vazia. Sem qualquer dos dois, `temRota = false`. Por padrão:

- **Com rota**: verde, **on** por default.
- **Sem rota**: preto, **off** por default.

Os dois cards no meio da barra (`StatToggleCard`) controlam essa visibilidade e mostram o contador da partição.

## Filtro lateral — placa ↔ linha

Dois cards verticais (`PlacasFilterCard` / `LinhasFilterCard`) compartilham um estado que se mantém em sincronia:

- Toggle de uma **placa** ativa/desativa também a(s) `numeroLinha` correspondente(s) — lookup em `placaToLinhas`.
- Toggle de uma **linha** ativa/desativa todas as **placas** que rodam essa linha hoje — lookup em `linhaToPlacas`.
- Multi-select em ambos. Quando há seleção, mapa restringe **veículos / rotas / locais** ao subconjunto e o toggle "Todas as rotas" é considerado implicitamente ligado para o subconjunto (`showRotasEffective = showRotas || hasSelection`).
- Catálogo de placas é montado a partir de `veiculosComRota` (só quem tem rota); catálogo de linhas vem de `rotas.numeroLinha`.
- **Cor dos pills selecionados**: a página calcula `colorByPlaca`/`colorByLinha` de uma paleta (`PILL_PALETTE`) de **cores variadas, mas SEM vermelho nem roxo** — esses dois são reservados no mapa (vermelho = local atrasado; roxo = local no prazo e ainda dentro). A placa é a âncora — a linha correspondente herda a mesma cor — para casar visualmente "qual veículo é de qual rota" pelos cards. Não-selecionados seguem o estilo padrão.
- **A cor do pill vai para o mapa**: a página repassa `colorByPlaca` ao `MapaMonitoramento`. O **ícone do veículo** e a **rota dele** usam a **mesma cor** do pill da placa selecionada. Sem seleção (placa sem pill), caem na cor padrão: veículo verde (com rota) / preto (sem rota), rota azul `#1d4ed8`. Por isso a paleta evita vermelho/roxo — para o veículo/rota não colidirem com os estados do marker de local.
- **Contador**: cada card mostra no header um badge `N sel.` (placas/linhas ativas) além do total do catálogo.
- **Centralizar o par**: ao clicar numa placa, o card de linhas rola para **centralizar** a linha correspondente (e vice-versa). `PlacasFilterCard`/`LinhasFilterCard` expõem `scrollToItem(value)` via `forwardRef`/`useImperativeHandle`; o `FiltrosLateral` chama o card oposto no clique, usando `placaToLinhas`/`linhaToPlacas` para achar o par. O scroll é contido no container (cálculo de `offsetTop`, sem mexer no scroll da página).
- **Posição (desktop `lg`)**: os dois cards ladeiam o mapa — **placas à esquerda, mapa no meio,
  linhas/rotas à direita**. O `FiltrosLateral` envolve o mapa (recebido como `children`) e renderiza
  os três como irmãos no `flex-row` da seção; com `align-items: stretch` (default), cada `aside`
  estica para a altura da linha → **a mesma altura do mapa**. Cada card tem `lg:h-full` para preencher.
  Largura de cada coluna de filtro: `lg:w-56`.
- **Mobile**: a seção é `flex-col` e os cards viram **strips horizontais roláveis** (`flex` +
  `overflow-x-auto`, pills `shrink-0 whitespace-nowrap`), voltando a lista vertical em `lg`
  (`lg:flex-col`). As duas strips ficam no topo (placas `order-1`, linhas `order-2`) e o mapa-herói
  logo abaixo (`order-3`, vira `lg:order-2` no desktop) — então a divisão esquerda/direita só vale
  no `lg`. O `scrollToItem` centraliza no eixo que estiver rolando (vertical no `lg`, horizontal no mobile).

## Polyline pulsante

Quando o usuário seleciona uma viagem (`selectedViagemId != null`), a polyline correspondente alterna `strokeOpacity` entre `0.4` e `1.0` a cada `600ms` via `setInterval`, dentro de um `useEffect` dedicado em [MapaMonitoramento.tsx](MapaMonitoramento.tsx). A polyline da seleção é guardada em `selectedPolylineRef`. O cleanup zera o interval **e** restaura `strokeOpacity = 1.0` para evitar "ficar opaca" depois de desselecionar.

## Padrão imperativo das polylines

As polylines (e seus I/F) são criadas com `new google.maps.Polyline/Marker/InfoWindow` e guardadas em refs (`rotaPolylinesRef`, `rotaMarkersRef`, `rotaInfoWindowsRef`). `clearRotas` chama `setMap(null)` em cada item. Mesmo motivo de antes — o wrapper declarativo deixava polylines órfãs quando o toggle desligava.

## Polling e reconciliação

- `useLivePoll(url, { intervalMs, enabled })` é o hook genérico.
- **Veículos**: `15s`, sempre ligado. Posição "ao vivo" precisa de refresh rápido.
- **Rotas**: `2 min`, sempre ligado. O dataset muda no máximo 1×/dia (cadastros de FTs), então não vale martelar — mas o filtro lateral de linhas precisa dos dados antes do usuário tocar em qualquer toggle, daí "sempre ligado".
- **Locais**: `30s`, ativo **só quando há marker dentro do viewport do mapa**. A página recebe `onVisibleLocaisChange(count)` do mapa (disparado em cada `idle`), e o `enabled` do poll fica `layerAtiva && (!hasInitialLocais || visibleLocaisCount > 0)`. O `hasInitialLocais` libera o primeiro fetch (chicken-and-egg: sem dados não há como calcular bounds). Quando o usuário arrasta pra fora de todos os locais, o polling pausa; ao voltar para uma área com markers, retoma e refaz fetch imediato.
- Cada `ViagemEntradasTable` monta seu próprio `useLivePoll` (15s) em `/monitoramento/viagem-entradas?idViagem=X`.
- Markers/InfoWindows são chaveados por ID estável (`idVeiculo`, `idLocal`, `idViagem`) → reconciliação suave do React, sem flicker.

## Visual

- Ícone do veículo: SVG `directions_car`, `scale: 1.6`. Cor:
  - **Placa selecionada nos cards**: a cor do pill (`colorByPlaca`).
  - Senão, verde `#16a34a` quando `v.temRota` (com rota hoje); preto `#000000` caso contrário.
- Label `PLACA` em `<OverlayView>` acima do ícone, mesma cor do ícone.
- Polylines (cor-base `baseColor` = pill da placa quando selecionada, senão azul `#1d4ed8`):
  - Sem seleção de viagem: `baseColor`, weight 4, opacity 0.85.
  - Selecionada (`selectedViagemId`): mantém `baseColor` (**não** vira vermelho), weight 6, opacity pulsando entre 0.4 e 1.0 — destaque por pulso + espessura.
  - Outras quando há viagem selecionada: cinza claro `#d1d5db`, weight 4, zIndex baixo.
- Markers I/F: círculos scale 7 com label branco I/F. Mesma cor da polyline (`baseColor`, ou cinza `#9ca3af` quando dimmed).
- Marker do local: pin teardrop colorido por estado (ver "Cor do local").
- Círculo do raio: mesma cor do pin com `fillOpacity: 0.75` (alinhado com cadastros).

## Cor do local

Em `LocalMarker.pickLocalColor(data)`:

| Estado                                                   | Cor                 |
|----------------------------------------------------------|---------------------|
| Nem entrada nem saída                                    | preto `#000000`     |
| Entrada **ou** saída real depois do previsto (atrasado)  | vermelho `#dc2626`  |
| Entrou no prazo e ainda não saiu                         | roxo `#7c3aed`      |
| Resto (no prazo, concluído ou só entrada no prazo)       | azul `#1d4ed8`      |

## Seleção de viagem

- `selectedViagemId: number | null` vive em `Monitoramento.tsx`.
- Click em I/F no mapa ou linha da tabela chama `onSelectViagem(idViagem)`; click duplo no mesmo alvo desmarca.
- Visual: linha na `RotasTable` ganha `bg-brand-accent-soft` + ring de borda; a polyline correspondente pulsa (mantendo sua cor-base) e as demais esmaecem em cinza.
- Desligar "Todas as rotas de hoje" limpa a seleção (`null`).

## Tabela `ViagemEntradasTable`

Componente auto-contido em [ViagemEntradasTable.tsx](ViagemEntradasTable.tsx). Recebe `{ idViagem, placa }`. Polling próprio a 15 s.

Colunas: **Ordem**, **Local**, **Ent. prev.**, **Ent. real**, **Saí. prev.**, **Saí. real**, **T. dentro** (DATEDIFF MINUTE da query SQL).

Regra de cor da célula:
- `ENT REAL`: `bg-sky-100` se `dtEntRealIso <= dtEntPrevistaIso` (no prazo/adiantado); `bg-red-100` se maior. Vazio quando falta um dos lados.
- `SAI REAL`: idem contra `dtSaiPrevistaIso`.

Comparação lex em ISO local (`"2026-04-22T14:30:45"`).

## Tabela `RotasTable`

Coluna **Linha** é o `numeroLinha` (de `FT_CABECALHO.NUMERO_LINHA`). Demais: Status, Placa, Data início, Data fim. Card título: "Todas as rotas de hoje".

## Ícones

Reusa de [components/ui/icons.tsx](../ui/icons.tsx) — `RouteIcon`, `CheckCircleIcon`, `BanCircleIcon`, `CarIcon`, `PinIcon`, etc.

## Regra de "hoje"

Corte é feito no backend via `CAST(... AS DATE) = CAST(GETDATE() AS DATE)`. Ver [backend/src/modules/monitoramento/CLAUDE.md](../../../../backend/src/modules/monitoramento/CLAUDE.md).
