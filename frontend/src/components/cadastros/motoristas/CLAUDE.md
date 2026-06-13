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
       ├─ RotaSelectMapCard    ← <select> de rotas + MapaRota (mini-mapa)
       ├─ VinculadosTable      ← vinculados da rota + checkbox TITULAR + desvincular
       ├─ DisponiveisCard      ← checkboxes dos não-vinculados + "Vincular selecionados"
       └─ Modal (confirmar desvincular)
```

## Estado (tudo na página)

`motoristas` + estado do CRUD (optimistic update no save/delete, igual locais).
`rotas` (fetch no mount), `selectedIdFt`, `vinculados`, `disponiveis`.
`refreshLinks(idFt)` recarrega vinculados + disponíveis em paralelo — é o ponto
único de sincronização. Disparado: ao trocar `selectedIdFt`, após vincular, após
desvincular. Titular só recarrega via `refreshLinks` também (reflete a regra de
titular único que o backend aplica em múltiplas linhas).

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
