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
  ├─ MapaMonitoramento      ← GoogleMap com veiculos + (rotas) + (locais)
  │    ├─ VeiculoMarker     ← Marker + OverlayView label + InfoWindow
  │    ├─ RotaLayer         ← Polyline azul + Markers I/F circulares com InfoWindow
  │    └─ LocalMarker       ← Marker (pin padrão) + InfoWindow + Circle condicional (raio)
  └─ RotasTable             ← só quando toggle Rotas ativo; destaca a linha selecionada
```

## Polling e reconciliação

- `useLivePoll(url, { intervalMs: 15000, enabled })` é o hook genérico. Dispara `GET` no mount e a cada 15 s. Expõe `{ data, loading, error, lastUpdate, refetch }`.
- A tela mantém três pollings independentes: veículos (sempre), rotas (só quando toggle), locais (só quando toggle).
- **Reconciliação dos markers**: cada marker no JSX é chaveado pelo ID estável (`idVeiculo`, `idViagemEntrada`, `idViagem`). O React reconcilia automaticamente: veículo que sumiu do array é desmontado, veículo que ficou tem props atualizadas (posição/InfoWindow re-renderizam). Semanticamente equivalente a "apagar o anterior e criar um novo a cada update", **sem flicker**.
- O mapa carrega centralizado em **São Paulo capital** (`-23.55052, -46.633308`) com `zoom: 14`. Não há `fitBounds` — o operador mantém controle do enquadramento.
- `mapTypeControl` habilitado em barra horizontal no canto superior esquerdo com os 4 tipos: Roadmap / Satellite / Hybrid / Terrain.

## Visual

- Ícone do veículo: SVG do Material `directions_car` preenchido em **preto** (`#000000`), `scale: 1.6`.
- Label `PLACA` renderizado via `<OverlayView>` posicionado acima do ícone, **mesma cor** do ícone.
- Polylines de rota: **azul** `#1d4ed8` (blue-700); quando a viagem está selecionada, `strokeWeight` sobe de 4 para 6 e opacidade vai para 1.
- Markers de início/fim da rota: círculos azuis `#1d4ed8` (scale 7) com label branco **I** (início) e **F** (fim). Menores que veículos e locais — hierarquia intencional.
- Marker do local: **pin vermelho padrão do Google Maps** (sem `icon` custom em `<Marker>`).
- Círculo do raio: fica na cor `color` prop do `LocalMarker` (default preto) com `fillOpacity: 0.12`.

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
