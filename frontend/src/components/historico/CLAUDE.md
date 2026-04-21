# components/historico

Componentes da tela `/historico`: seletor de data, mapa de um dia passado com posições, rotas e locais visitados, legenda toggle.

## Dependências externas

- `@react-google-maps/api` — carrega o script uma vez via `useJsApiLoader`, biblioteca `geometry` para decodificar `POLYLINE` encoded.
- Chave em `VITE_GOOGLE_MAPS_API_KEY`.

## Arquitetura

```
Historico.tsx (page)
  ├─ Barra topo           ← <input type="date"> + 3 ToggleChip (Posições / Rotas / Locais)
  ├─ MapaHistorico        ← GoogleMap com 3 camadas imperativas independentes
  │    ├─ Posições        ← new google.maps.Marker (SVG carro) + InfoWindow (HTML string)
  │    │                      cor: verde (< 50 m), vermelho (≥ 50 m), roxo (ignição OFF — prioridade)
  │    ├─ Rotas           ← new google.maps.Polyline (azul #1d4ed8)
  │    └─ Locais          ← new google.maps.Marker (pin preto SVG) + InfoWindow com botão de raio (Circle)
  └─ MapLegend            ← overlay absoluto, pill "Legenda" que abre um card e tem botão de fechar
```

## Padrão imperativo

Mesmo princípio do `MapaMonitoramento` pós-refactor: cada camada vive em um `useEffect` que **cria** instâncias via `new google.maps.*`, guarda em `useRef<T[]>([])` e **limpa** com `setMap(null)` no cleanup. Três refs independentes — rotas, posições, locais — de modo que toggles não interferem entre si.

## Regra de cor das posições

Prioridade (de cima para baixo):

1. `ignicaoOn === false` → **roxo** (`#7c3aed`).
2. `distRota != null && distRota < 50` → **verde** (`#16a34a`).
3. resto (incluindo `distRota` nulo ou ≥ 50) → **vermelho** (`#dc2626`).

O backend normaliza `IGNICAO` para `{ ignicao: label, ignicaoOn: boolean | null }` — a regra 1 testa explicitamente `=== false` para não pintar de roxo quando o valor é desconhecido (null).

## Locais duplicados no mesmo dia

O mesmo `ID_LOCAL` pode aparecer N vezes (N visitas do mesmo veículo ou de veículos distintos). Para que o operador consiga clicar em todos os markers:

- Agrupo por `idLocal`, conto o total.
- A primeira ocorrência fica na posição original.
- Da segunda em diante, cada uma é deslocada ~14 m em um ângulo `(i-1)/(n-1) * 2π` — círculo em volta do ponto base.

Fórmula de conversão metros→graus usa `cos(lat)` para corrigir o eixo longitudinal. O **círculo de raio** (`Circle`) continua centrado na coordenada **original** do local, não no marker deslocado — o raio é propriedade do local, não da visita.

## Botão de raio dentro da InfoWindow

InfoWindows aqui são HTML strings (não React). Para amarrar o click do botão:

1. Cada botão recebe `id="hist-raio-${idHistorico}"` e `data-circle-index="${idx}"`.
2. No evento `domready` do `InfoWindow`, faço `document.getElementById(buttonId)` e ataco `onclick` que alterna o `Circle` correspondente em `localCirclesRef.current[idx]` via `setMap(null | map)`.
3. O texto do botão é atualizado no próprio handler — sem React envolvido.

## Seletor de data

`<input type="date">` nativo com `max={hoje}`. Mudança dispara `useEffect` que chama os 3 endpoints em paralelo (`Promise.all`). O fetch é idempotente: se o usuário trocar a data antes da resposta chegar, o flag `cancelled` descarta o resultado antigo.
