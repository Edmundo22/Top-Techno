# components/cadastros/locais

Componentes da tela `/cadastros/locais`: tabela com ordenação/filtros, mapa lateral, modal de cadastro/edição com ferramentas de desenho (Terra Draw), confirmação de exclusão.

## Arquitetura

```
CadastroLocais.tsx (page)
  ├─ Toolbar (Novo / filtro universal / status)
  ├─ Área principal (flex row em lg+; coluna em sm)
  │    ├─ LocaisTable          ← tabela + sort + filtro por coluna
  │    └─ MapaCadastroLocais   ← Google Maps, padrão imperativo
  ├─ LocalFormModal            ← criação e edição (mesmo componente, prop `initial`)
  └─ Modal (confirmação delete)
```

## `LocaisTable`

Sem dependências externas. Sort com `useState`/`useMemo`, filtro por coluna (inputs no `<thead>`) e filtro universal (input na toolbar — recebido por prop). Ciclo do sort: `null → asc → desc → null`.

Coluna **Ações** tem 4 ícones SVG inline:

| Ícone | Função |
|-------|--------|
| Pin   | Toggle do marker + círculo (vermelho) no mapa lateral. |
| Hex   | Toggle do polígono (vermelho) no mapa lateral. Desabilitado se o local não tem `poligonoWkt`. |
| Lápis | Abre `LocalFormModal` em modo edição. |
| Lixo  | Abre modal de confirmação; on confirm chama `DELETE /locais/:id`. |

`activeMarkerId` e `activePoligonoId` são **single-id** — só um local por vez é destacado no mapa. Click no mesmo ícone alterna off.

## `MapaCadastroLocais`

Padrão imperativo (refs + `setMap(null)` no cleanup), mesmo do [components/monitoramento/MapaMonitoramento.tsx](../../monitoramento/MapaMonitoramento.tsx). Refs separadas para `marker`, `circle`, `polygon` e `infoWindow`. Carrega Google Maps via `useJsApiLoader` com `MAP_LIBRARIES` compartilhado de [services/googleMaps.ts](../../../services/googleMaps.ts).

InfoWindow é montada como HTML string (`infoHtml(local)`) para não depender de React no overlay.

## `LocalFormModal`

Modal cobrindo criação e edição. Edição pré-popula form, círculo (cor laranja `#f97316` para distinguir de "novo") e polígono (vermelho). Criação começa zerado.

### Estado interno
- `form` — `{ codigoPonto, endereco, raio, pontoParada }` (string).
- `circleState` — `{ lat, lng } | null`. Centro do local (= ponto no Terra Draw). Raio vem do input `form.raio`, não do desenho.
- `poligonoWkt` — `string | null` em formato `POLYGON((lng lat, ...))`. Derivado do polígono do store do Terra Draw a cada `finish`/`delete`.
- `drawMode` — `'point' | 'polygon' | 'select'`. Espelha o modo ativo do Terra Draw (`select` é o padrão: visualiza e permite editar).
- `drawReady` — `boolean`. `true` após o evento `ready` do Terra Draw (libera os botões de desenho).
- `mapCenter` / `mapZoom` — centro/zoom inicial do mapa, definidos ao abrir (a partir de `initial`); **não** acompanham o arraste, para o mapa não "pular" durante a edição.
- `showOutros` — toggle da camada verde "Todos os Locais" (omite o registro em edição).
- `saving`, `error`.

### Desenho com Terra Draw (o DrawingManager foi removido na v3.65)

O `DrawingManager` foi **removido do Maps JS API na v3.65** ([deprecations](https://developers.google.com/maps/deprecations)) — deprecado em ago/2025, indisponível desde mai/2026. Instanciá-lo lançava `Error: The DrawingManager functionality ... is no longer available` e deixava o modal em tela branca. O Google **não** forneceu substituto; usamos o **[Terra Draw](https://terradraw.io/)** (`terra-draw` + `terra-draw-google-maps-adapter`), o substituto de facto, que tem adapter para o Google Maps.

O Terra Draw é dono das **vector features** (ponto + polígono); o React só reflete o store nele:

- **Init** (`useEffect` em `open/isLoaded/map`): cria `new TerraDraw({ adapter: TerraDrawGoogleMapsAdapter({ lib: google.maps, map, coordinatePrecision: 9 }), modes: [point, polygon, select] })`. Só instancia depois que a projeção do mapa está pronta (`getProjection()` ou `projection_changed`). No evento `ready`, carrega o ponto/polígono de `initial` via `addFeatures` (GeoJSON `[lng,lat]`, `properties.mode`), entra em `select` e marca `drawReady`.
- **Círculo**: como o raio vem do input, só precisamos do **centro** → `TerraDrawPointMode`. O botão "Desenhar círculo" faz `setMode('point')`; o clique cria o ponto e o `finish` volta para `select`. Um `useEffect` à parte desenha o **círculo do raio** (overlay `google.maps.Circle`, `clickable:false`) a partir de `circleState + form.raio`.
- **Polígono**: `TerraDrawPolygonMode` — botão "Desenhar polígono" → `setMode('polygon')`; fecha clicando no 1º ponto ou com duplo-clique. Edição (arrastar vértices, midpoints, deletar) é o `TerraDrawSelectMode` (modo padrão), sem listeners manuais.
- **Sync**: `syncFromStore()` roda no `finish` (desenho concluído / arraste de feature ou vértice) e no `change` com `type === 'delete'`. Lê `getSnapshot()`, garante **no máximo 1 ponto e 1 polígono** (remove extras) e converte o anel do polígono (`[lng,lat]`) para WKT via `pathToWktPolygon` (que normaliza o anel e orienta CCW). **Não** sincroniza no `change` comum, para o WKT não ser setado no meio do desenho.
- **Limpeza**: o cleanup do effect chama `draw.stop()`. A biblioteca `drawing` foi removida de `MAP_LIBRARIES` ([services/googleMaps.ts](../../../services/googleMaps.ts)).

### Validação

Submit habilitado quando: `codigoPonto`, `endereco`, `pontoParada` preenchidos + `raio > 0` + `circleState != null`. Polígono **não** é obrigatório (mostra aviso amarelo).

### "Todos os Locais"

Toggle verde no canto direito do toolbar. Renderiza polygons verdes (`#16a34a`) clicáveis com InfoWindow contendo os mesmos campos da tabela. No modal de edição, o próprio registro é omitido dessa camada.

## WKT

Helpers em [src/utils/wkt.ts](../../../utils/wkt.ts):
- `pathToWktPolygon` — fecha o ring automaticamente. Ordem `lng lat` (formato `geography` no SQL Server).
- `parseWktPolygon` — descarta holes (não usamos).
- `centroidOf` — média simples, suficiente pra posicionar InfoWindow.

## Cores

| Onde                         | Cor       |
|------------------------------|-----------|
| Marker/círculo (criação)     | `#dc2626` (vermelho) |
| Marker/círculo (edição)      | `#f97316` (laranja)  |
| Polígono ativo no mapa principal e em edição/criação | `#dc2626` |
| Camada "Todos os Locais"     | `#16a34a` (verde)    |

## Layout responsivo

A página tem altura `calc(100vh - 140px)` e usa `min-h-0` em todos os flex parents para `flex-1` propagar. Em `lg+`, tabela e mapa lado a lado (3/5 e 2/5); abaixo, empilhados (mapa com `min-h-[320px]`).
