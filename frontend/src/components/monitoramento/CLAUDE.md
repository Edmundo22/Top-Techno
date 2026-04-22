# components/monitoramento

Componentes da tela `/monitoramento`: mapa ao vivo, relógio, badge de última atualização, chips de toggle, markers de veículo/local, polylines de rota e tabela de viagens.

## Dependências externas
- `@react-google-maps/api` — wrapper React do Google Maps JS API. Usa `useJsApiLoader` para carregar o script uma vez.
- Biblioteca `geometry` carregada para decodificar `POLYLINE` encoded do Google via `google.maps.geometry.encoding.decodePath`.
- Chave em `VITE_GOOGLE_MAPS_API_KEY` (arquivo `frontend/.env`, gitignored).

## Arquitetura

```
Monitoramento.tsx (page)
  ├─ Barra única topo       ← ClockCard + LastUpdateBadge + 3 ToggleChip em flex-wrap
  │    ├─ ClockCard         ← pill compacta, useTick(1000) → relógio PT-BR
  │    ├─ LastUpdateBadge   ← pill compacta, lastUpdate + useTick → "Atualizado há Ns"
  │    └─ ToggleChip × 3    ← [Veículos (sempre on)] [Rotas] [Locais]
  ├─ MapaMonitoramento      ← GoogleMap com veiculos + (rotas imperativas) + (locais)
  │    ├─ VeiculoMarker     ← Marker + OverlayView label + InfoWindow (declarativo)
  │    ├─ [rotas]           ← Polyline + 2 Markers I/F circulares + InfoWindows criados via
  │    │                      `new google.maps.Polyline/Marker/InfoWindow` em useEffect,
  │    │                      guardados em useRef[] e limpos com setMap(null) no cleanup
  │    └─ LocalMarker       ← Marker (pin padrão) + InfoWindow + Circle condicional (raio)
  └─ RotasTable             ← só quando toggle Rotas ativo; destaca a linha selecionada
```

## Rotas: padrão imperativo

As rotas (polyline + I/F) **não usam** os wrappers declarativos de `@react-google-maps/api`. Em vez disso, um `useEffect` em [MapaMonitoramento.tsx](MapaMonitoramento.tsx) cria instâncias nativas via `new google.maps.Polyline(...)` / `new google.maps.Marker(...)` / `new google.maps.InfoWindow(...)` e as acumula em três `useRef<T[]>([])`. O cleanup chama `setMap(null)` em cada item e zera os arrays.

**Por que imperativo:** o wrapper declarativo deixava polylines órfãs no mapa quando o toggle de rotas desligava. O padrão imperativo dá controle determinístico do ciclo de vida, igual à referência em [../../../../../Mapa.js](../../../../../Mapa.js) (componente de produção do usuário). Dispara quando `[map, showRotas, rotas, selectedViagemId, onSelectViagem]` mudam — por isso `onSelectViagem` precisa ser `useCallback` na página.

## Polling e reconciliação

- `useLivePoll(url, { intervalMs: 15000, enabled })` é o hook genérico. Dispara `GET` no mount e a cada 15 s. Expõe `{ data, loading, error, lastUpdate, refetch }`.
- A tela mantém três pollings independentes: veículos (sempre), rotas (só quando toggle), locais (só quando toggle).
- **Reconciliação dos markers**: cada marker no JSX é chaveado pelo ID estável (`idVeiculo`, `idViagemEntrada`, `idViagem`). O React reconcilia automaticamente: veículo que sumiu do array é desmontado, veículo que ficou tem props atualizadas (posição/InfoWindow re-renderizam). Semanticamente equivalente a "apagar o anterior e criar um novo a cada update", **sem flicker**.
- O mapa carrega centralizado em **São Paulo capital** (`-23.55052, -46.633308`) com `zoom: 14`. Não há `fitBounds` — o operador mantém controle do enquadramento.
- `mapTypeControl` habilitado em barra horizontal no canto superior esquerdo com os 4 tipos: Roadmap / Satellite / Hybrid / Terrain.

## Visual

- Ícone do veículo: SVG do Material `directions_car` preenchido em **preto** (`#000000`), `scale: 1.6`.
- Label `PLACA` renderizado via `<OverlayView>` posicionado acima do ícone, **mesma cor** do ícone.
- Polylines de rota:
  - Sem seleção (default): azul `#1d4ed8` (blue-700), weight 4, opacity 0.85.
  - Rota selecionada: azul claro `#8fd5f5`, weight 6, opacity 1.
  - Rotas não selecionadas quando há outra selecionada: cinza claro `#d1d5db`, weight 4, opacity 0.85, `zIndex` mais baixo pra ficar embaixo.
- Markers de início/fim: círculos (scale 7) com label branco **I** / **F**. Cor acompanha a regra da polyline:
  - Sem seleção: `#1d4ed8`.
  - Selecionada: `#8fd5f5`.
  - Não selecionadas (quando há outra selecionada): cinza `#9ca3af` (um pouco mais escuro que a linha pra o label branco continuar legível).
- Marker do local: pin SVG teardrop colorido conforme o status de entrada/saída da `TB_VIAGEM_ENTRADA` (ver "Cor do local" abaixo).
- Círculo do raio: mesma cor do pin com `fillOpacity: 0.12`.

## Cor do local

Calculada em `LocalMarker.pickLocalColor(data)` a partir de `dtEntReal` / `dtSaiReal` (origem: `TB_VIAGEM_ENTRADA.DT_ENT_REAL` / `DT_SAI_REAL`):

| Estado                              | Cor            |
|-------------------------------------|----------------|
| Entrou e saiu (ambos preenchidos)   | verde `#16a34a`|
| Entrou mas não saiu (só `dtEntReal`)| amarelo `#eab308`|
| Nenhum dos dois                     | vermelho `#dc2626`|

Quando o `dtSaiReal` chegar com `dtEntReal` nulo (caso raro/inconsistente), cai no ramo "ainda não chegou" — o veículo não pode sair sem antes entrar.

Cores dos veículos virarão condicionais por status em iteração seguinte — hoje todos pretos.

## Seleção de viagem

- `selectedViagemId: number | null` vive em `Monitoramento.tsx` e é propagado para `MapaMonitoramento` → `RotaLayer` e para `RotasTable`.
- Click em I/F no mapa ou em uma linha da tabela chama `onSelectViagem(idViagem)`; um segundo click no mesmo alvo desmarca (`null`).
- Rota selecionada: polyline mais grossa e opaca; linha na tabela com fundo `brand-accent-soft` e `ring-2 ring-inset ring-brand-accent`. A tabela faz `scrollIntoView({ block: 'nearest', behavior: 'smooth' })` na linha selecionada.
- Desligar o toggle "Rotas do dia" limpa a seleção (`null`) — sem estado pendurado.

## Datas
Formatação em `src/utils/datetime.ts`:
- `formatBRDateTime("2026-04-10T06:00:00")` → `04/10/2026 às 06:00` (tabela)
- `formatBRDateTimeFull("...")` → `10/04/2026 06:00:00` (InfoWindow)
- `formatClockLong(date)` → `{ date: "quinta-feira, 20 de abril de 2026", time: "14:32:07" }`
- `formatRelative(fromMs, nowMs)` → `"há 4 s"` / `"há 2 min 3 s"`

## Regra de "hoje"
O corte é feito no backend via `CAST(vi.DT_VIAGEM AS DATE) = CAST(GETDATE() AS DATE)`. Se o operador perceber dados fora do dia, é questão de fuso do SQL Server — ver `backend/src/modules/monitoramento/CLAUDE.md`.
