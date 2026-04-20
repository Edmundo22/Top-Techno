# components/monitoramento

Componentes da tela `/monitoramento`: mapa ao vivo, relógio, badge de última atualização, chips de toggle, markers de veículo/local, polylines de rota e tabela de viagens.

## Dependências externas
- `@react-google-maps/api` — wrapper React do Google Maps JS API. Usa `useJsApiLoader` para carregar o script uma vez.
- Biblioteca `geometry` carregada para decodificar `POLYLINE` encoded do Google via `google.maps.geometry.encoding.decodePath`.
- Chave em `VITE_GOOGLE_MAPS_API_KEY` (arquivo `frontend/.env`, gitignored).

## Arquitetura

```
Monitoramento.tsx (page)
  ├─ ClockCard              ← useTick(1000) → relógio PT-BR atualizando a cada segundo
  ├─ LastUpdateBadge        ← lastUpdate do hook + useTick → "atualizado há Ns"
  ├─ ToggleChip × 3         ← [Veículos (sempre on)] [Rotas] [Locais]
  ├─ MapaMonitoramento      ← GoogleMap com veiculos + (rotas) + (locais)
  │    ├─ VeiculoMarker     ← Marker + OverlayView label + InfoWindow
  │    ├─ RotaPolyline      ← decodePath(POLYLINE) → Polyline
  │    └─ LocalMarker       ← Marker + InfoWindow + Circle condicional (raio)
  └─ RotasTable             ← só quando toggle Rotas ativo
```

## Polling e reconciliação

- `useLivePoll(url, { intervalMs: 15000, enabled })` é o hook genérico. Dispara `GET` no mount e a cada 15 s. Expõe `{ data, loading, error, lastUpdate, refetch }`.
- A tela mantém três pollings independentes: veículos (sempre), rotas (só quando toggle), locais (só quando toggle).
- **Reconciliação dos markers**: cada marker no JSX é chaveado pelo ID estável (`idVeiculo`, `idViagemEntrada`, `idViagem`). O React reconcilia automaticamente: veículo que sumiu do array é desmontado, veículo que ficou tem props atualizadas (posição/InfoWindow re-renderizam). Semanticamente equivalente a "apagar o anterior e criar um novo a cada update", **sem flicker**.
- A primeira vez que veículos carregam com posição, o mapa faz `fitBounds` automaticamente. Não repete depois, para não atropelar o zoom do usuário.

## Visual

- Ícone do veículo: SVG do Material `directions_car` preenchido em **preto** (`#000000`).
- Label `PLACA` renderizado via `<OverlayView>` posicionado acima do ícone, **mesma cor** do ícone.
- Polylines: `brand-ink` (`#1F2937`).
- Marker do local: símbolo padrão (seta invertida) preto.
- Círculo do raio: `#000000` com `fillOpacity: 0.12`.

Cores dos veículos virarão condicionais por status em iteração seguinte — hoje todos pretos.

## Datas
Formatação em `src/utils/datetime.ts`:
- `formatBRDateTime("2026-04-10T06:00:00")` → `04/10/2026 às 06:00` (tabela)
- `formatBRDateTimeFull("...")` → `10/04/2026 06:00:00` (InfoWindow)
- `formatClockLong(date)` → `{ date: "quinta-feira, 20 de abril de 2026", time: "14:32:07" }`
- `formatRelative(fromMs, nowMs)` → `"há 4 s"` / `"há 2 min 3 s"`

## Regra de "hoje"
O corte é feito no backend via `CAST(vi.DT_VIAGEM AS DATE) = CAST(GETDATE() AS DATE)`. Se o operador perceber dados fora do dia, é questão de fuso do SQL Server — ver `backend/src/modules/monitoramento/CLAUDE.md`.
