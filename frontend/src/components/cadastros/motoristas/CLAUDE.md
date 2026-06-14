# components/cadastros/motoristas

Componentes da tela `/cadastros/motorista-por-rota`: CRUD de motoristas (banco
CORREIO) à esquerda e o vínculo motorista↔rota à direita. A página vive em
[src/pages/MotoristaPorRota.tsx](../../../pages/MotoristaPorRota.tsx).

## Arquitetura

```
MotoristaPorRota.tsx (page) — dona de TODO o estado
  ├─ Coluna esquerda (CRUD)
  │    ├─ Toolbar (filtro universal + "Novo motorista")
  │    ├─ MotoristasTable      ← tabela sticky, sort + filtro por coluna
  │    ├─ MotoristaFormModal   ← criação/edição (mesmo componente, prop `initial`)
  │    └─ Modal (confirmar exclusão)
  └─ Coluna direita (vínculo, só com rota selecionada)
       ├─ RotaSelectMapCard    ← <select> de rotas + MapaRota (mini-mapa)  [1/3 da altura]
       ├─ Linha [2/3 da altura], dois cards lado a lado:
       │    ├─ VinculadosTable  ← vinculados + checkbox TITULAR + desvincular  [~60% largura]
       │    └─ DisponiveisCard  ← lista de não-vinculados + "Vincular selecionados"  [~40%]
       └─ Modal (confirmar desvincular)
```

A coluna direita usa `basis-1/3` (rota/mapa) + `basis-2/3` (linha de vínculos). Os
cards preenchem a altura (`h-full min-h-0`); o mini-mapa é `flex-1` dentro do card.

## Estado (tudo na página)

`motoristas` + estado do CRUD (optimistic update no save/delete, igual locais).
`rotas` (fetch no mount), `selectedIdFt`, `vinculados`, `disponiveis`.
`refreshLinks(idFt)` recarrega vinculados + disponíveis em paralelo — é o ponto
único de sincronização. Disparado: ao trocar `selectedIdFt`, após vincular, após
desvincular. Titular só recarrega via `refreshLinks` também (reflete a regra de
titular único que o backend aplica em múltiplas linhas).

Clicar no checkbox de titular **não** aplica direto: abre um modal de confirmação
(`confirmTitular`). A mensagem varia — "deixar X como titular", "trocar o X pelo Y"
(quando já há titular) ou "remover X como titular" (ao desmarcar). Desvincular
também confirma em modal. `MapaRota` esconde o zoom (+/-) e mostra o botão de tela
cheia no canto inferior direito.

`DisponiveisCard` é o único com estado local (Set de marcados); recebe
`key={selectedIdFt}` para remontar e zerar a seleção ao trocar de rota.

## Máscaras

`MotoristaFormModal` usa [utils/masks.ts](../../../utils/masks.ts): nome só
letras/acentos, CNH só dígitos, CPF `000.000.000-00`, telefone `(00) 00000-0000`.
Exibe mascarado, envia **só dígitos**. CPF/telefone/OBS opcionais; bloqueio de
submit quando CPF/telefone têm dígitos parciais.

## MapaRota

Padrão imperativo (igual monitoramento): `useJsApiLoader` com `MAP_LIBRARIES`,
`decodePath` da POLYLINE em try/catch, `new google.maps.Polyline` em ref +
`setMap(null)` no cleanup, e `fitBounds` para enquadrar a rota. Rota sem POLYLINE
mostra aviso "sem traçado".

## Backend

Consome [/motoristas](../../../../backend/src/modules/motoristas/CLAUDE.md) (CRUD)
e [/motorista-rota](../../../../backend/src/modules/motoristaRota/CLAUDE.md)
(rotas, vinculados, disponiveis, vincular, titular, desvincular).
