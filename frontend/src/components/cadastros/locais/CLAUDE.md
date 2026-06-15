# components/cadastros/locais

Componentes da tela `/cadastros/locais`: tabela com ordenação/filtros, mapa lateral, modal de cadastro/edição com ferramentas de desenho manuais (clique no mapa), confirmação de exclusão.

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
- `circleState` — `{ lat, lng } | null`. Raio vem do input `form.raio`, não do círculo desenhado.
- `poligonoWkt` — `string | null` em formato `POLYGON((lng lat, ...))`. Atualizado tanto ao concluir o desenho quanto a cada edição de path (`set_at`/`insert_at`/`remove_at`).
- `drawMode` — `'circle' | 'polygon' | null`. Modo de desenho ativo.
- `drawingPath` — `LatLngLiteral[]`. Vértices clicados do polígono **em andamento** (antes de "Concluir").
- `showOutros` — toggle da camada verde "Todos os Locais" (omite o registro em edição).
- `saving`, `error`.

### Desenho manual (sem DrawingManager)

O `DrawingManager` foi **removido do Maps JS API na v3.65** ([deprecations](https://developers.google.com/maps/deprecations)). Instanciá-lo lançava `Error: The DrawingManager functionality ... is no longer available` e deixava o modal em tela branca. O desenho agora é feito à mão, via `onClick` do `<GoogleMap>` (`handleMapClick`):

- **Círculo**: como o raio vem do input, só precisamos do **centro** — um clique no mapa em `drawMode === 'circle'` define `circleState` e sai do modo. O círculo "visível" é reconstruído em outro `useEffect` a partir de `circleState + form.raio` (qualquer mudança no raio atualiza o desenho).
- **Polígono**: em `drawMode === 'polygon'`, cada clique adiciona um vértice a `drawingPath`. Um `useEffect` desenha o preview (polígono `fillOpacity 0.3` + bolinhas brancas nos vértices, todos `clickable:false` para o clique atravessar até o mapa). Botões **Concluir** (≥3 vértices → `pathToWktPolygon` → `poligonoWkt`), **Desfazer ponto** e **Cancelar**. Concluído, o polígono editável definitivo é reconstruído a partir de `poligonoWkt` (com listeners `set_at`/`insert_at`/`remove_at`).

`disableDoubleClickZoom: true` evita zoom acidental ao clicar rápido; o cursor vira `crosshair` enquanto `drawMode` está ativo. A biblioteca `drawing` foi removida de `MAP_LIBRARIES` ([services/googleMaps.ts](../../../services/googleMaps.ts)).

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
