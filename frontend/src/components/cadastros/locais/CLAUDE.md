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

## Busca de endereço (`useAddressAutocomplete`)

Hook [useAddressAutocomplete.ts](useAddressAutocomplete.ts) que liga o **`google.maps.places.Autocomplete`** a um `<input>` próprio (design do projeto), dando o autocomplete "estilo Google Maps" (dropdown `.pac-container`, seleção pelo teclado). Fica **só no `LocalFormModal`** (modal de inserir/editar), no toolbar do mapa ao lado do botão "Todos os locais", esticando até a borda do mapa (`flex-1`). **Não** fica mais dentro do mapa nem no mapa lateral.

- No `place_changed`, lê `place.geometry` e enquadra o mapa (`fitBounds` no viewport, ou `setCenter`+`setZoom(17)`).
- `.pac-container` tem `z-index: 1100` em [globals.css](../../../styles/globals.css) para ficar acima do Modal (inclusive em tela cheia).
- `places` está em `MAP_LIBRARIES`. **Requer a Places API habilitada na chave** do Google Cloud. (O widget legado `Autocomplete` está deprecado mas funcional; o `PlaceAutocompleteElement` "new" foi descartado porque exige a Places API *New* e renderiza um web component difícil de casar com o design.)

## `LocalFormModal`

Modal cobrindo criação e edição. Edição pré-popula form, círculo (cor laranja `#f97316` para distinguir de "novo") e polígono (vermelho). Criação começa zerado.

### Estado interno
- `form` — `{ codigoPonto, endereco, raio, pontoParada }` (string).
- `circleState` — `{ lat, lng } | null`. Centro do local. **Não** é feature do Terra Draw — é overlay imperativo (marker + círculo), só muda ao posicionar ou apagar. Raio vem do input `form.raio`, não do desenho.
- `poligonoWkt` — `string | null` em formato `POLYGON((lng lat, ...))`. Derivado do polígono do store do Terra Draw a cada `finish`/`delete`.
- `drawMode` — `'point' | 'polygon' | 'select'`. Espelha o modo ativo do Terra Draw (`select` é o padrão: visualiza e permite editar).
- `drawReady` — `boolean`. `true` após o evento `ready` do Terra Draw (libera os botões de desenho).
- `mapCenter` / `mapZoom` — centro/zoom inicial do mapa, definidos ao abrir (a partir de `initial`); **não** acompanham o arraste, para o mapa não "pular" durante a edição.
- `showOutros` — toggle da camada verde "Todos os Locais" (omite o registro em edição).
- `saving`, `error`.

### Desenho com Terra Draw (o DrawingManager foi removido na v3.65)

O `DrawingManager` foi **removido do Maps JS API na v3.65** ([deprecations](https://developers.google.com/maps/deprecations)) — deprecado em ago/2025, indisponível desde mai/2026. Instanciá-lo lançava `Error: The DrawingManager functionality ... is no longer available` e deixava o modal em tela branca. O Google **não** forneceu substituto; usamos o **[Terra Draw](https://terradraw.io/)** (`terra-draw` + `terra-draw-google-maps-adapter`), o substituto de facto, que tem adapter para o Google Maps.

O Terra Draw é dono apenas do **polígono**; o **centro/círculo é imperativo** (fora do Terra Draw). O React reflete o store do polígono:

- **Init** (`useEffect` em `open/isLoaded/map`): cria `new TerraDraw({ adapter: TerraDrawGoogleMapsAdapter({ lib: google.maps, map, coordinatePrecision: 9 }), modes: [point, polygon, select] })`. Só instancia depois que a projeção do mapa está pronta (`getProjection()` ou `projection_changed`). No `ready`, carrega **só** o polígono de `initial` via `addFeatures`, entra em `select` e marca `drawReady`.
- **Círculo (centro)**: o `TerraDrawPointMode` serve **só para capturar o clique** — o botão "Desenhar círculo" faz `setMode('point')`; no `finish` do ponto, lê a coordenada (`getSnapshotFeature`), seta `circleState` e **remove o ponto do store** (`removeFeatures`), voltando para `select`. A partir daí o centro é puramente overlay imperativo (marker + `google.maps.Circle` do raio, ambos `clickable:false`), então **clique nenhum do mapa o move ou apaga** — só o botão "Apagar círculo". (Isso corrige o bug em que vários cliques no mapa "moviam/sumiam" o círculo, porque ele era uma feature selecionável/arrastável.)
- **Polígono**: `TerraDrawPolygonMode` — botão "Desenhar polígono" → `setMode('polygon')`. Fecha clicando no 1º ponto **ou com o botão direito** (a partir do 3º vértice): um listener de `rightclick` do mapa dispara um `keyup` de `Enter` no `map.getDiv()` (onde o adapter escuta teclado), e o `close()` do mode valida o nº de vértices. Enquanto desenha é **vermelho**; ao fechar fica **verde** (`fillColor`/`outlineColor` em função de `feature.properties.currentlyDrawing`) e já entra **selecionado** (`selectFeature`) para arrastar vértices/midpoints (`TerraDrawSelectMode`).
- **Sync**: `syncFromStore()` (no `finish` de polígono e no `change` `type === 'delete'`) lê só os polígonos do `getSnapshot()`, garante **no máximo 1** e converte o anel (`[lng,lat]`) para WKT via `pathToWktPolygon` (normaliza + orienta CCW). **Nunca** toca `circleState`.
- **Limpeza**: o cleanup do effect remove o `rightclick` listener e chama `draw.stop()`. A biblioteca `drawing` foi removida de `MAP_LIBRARIES` ([services/googleMaps.ts](../../../services/googleMaps.ts)).

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
