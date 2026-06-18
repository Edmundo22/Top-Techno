# Frontend — TOP TECHNO

SPA React + Vite + SWC + Tailwind + TypeScript.

## Princípio
**Zero regra de negócio aqui.** Só renderização, validação de formulário superficial (campo obrigatório), chamadas à API, navegação.

## Paleta 60-30-10

| % | Cor      | Token Tailwind          | Uso                                  |
|---|----------|-------------------------|--------------------------------------|
| 60| `#ffffff`| `brand-surface`         | fundos, cards                        |
| 30| `#1F2937`| `brand-ink`             | sidebar, topbar, tipografia forte    |
| 10| `#b4e7ff`| `brand-accent`          | CTA primário, item ativo, destaque   |

Derivados: `brand-ink-soft`, `brand-ink-muted`, `brand-line`, `brand-line-soft`, `brand-accent-hover`, `brand-accent-soft`.

Definidos em [tailwind.config.ts](tailwind.config.ts) e como CSS vars em [src/styles/globals.css](src/styles/globals.css).

## Árvore

```
src/
├── app/                 router principal (react-router-dom v6)
├── components/
│   ├── layout/          Sidebar, Topbar, AppLayout
│   ├── ui/              Button, Input, Card (primitivos)
│   └── ProtectedRoute.tsx
├── contexts/            AuthContext — fonte de verdade do usuário logado
├── pages/               Login, Monitoramento
├── services/            api.ts (axios), authApi.ts
├── styles/              globals.css (tokens + reset)
├── vite-env.d.ts
└── main.tsx             bootstrap
```

## Fluxo de autenticação

1. No mount de `<AuthProvider>`, `GET /auth/me` é chamado. `withCredentials: true` envia o cookie `tt_session`.
2. Se 200 → `user` preenchido, `loading=false`. Se 401 → `user=null`, `loading=false`.
3. `ProtectedRoute` exibe spinner enquanto `loading`; depois, redireciona para `/login` se `user` for `null`.
4. `POST /auth/login` seta o cookie no backend. O frontend só guarda o `user` retornado — **nunca** manipula o token JWT.
5. `POST /auth/logout` limpa o cookie. O frontend limpa o estado.

**Por que isso mantém a sessão no F5:** o cookie HttpOnly persiste entre reloads; `GET /auth/me` revalida e devolve o usuário.

## Scripts

| script         | o que faz                             |
|----------------|---------------------------------------|
| `yarn dev`     | Vite em `http://localhost:5173`       |
| `yarn build`   | `tsc --noEmit` + `vite build` → `dist`|
| `yarn preview` | Servir `dist` localmente p/ validar   |
| `yarn typecheck` | apenas TypeScript                   |

## `.env`

Única variável: `VITE_API_URL`. Em dev aponta para `http://localhost:3333`; em prod, para o host da API. Nada mais muda entre ambientes.

## Documentação modular

- [src/contexts/CLAUDE.md](src/contexts/CLAUDE.md)
- [src/components/cadastros/CLAUDE.md](src/components/cadastros/CLAUDE.md)

## Responsividade

Layout mobile-first com breakpoint principal `lg` (1024px). O alvo no celular é
"app-like": mapa como herói, controles compactos e nada de scroll horizontal da página.

- **Navegação**: mantém o **drawer hambúrguer** (não há bottom nav). Em `lg+` a `aside` é fixa
  (com colapso); em `< lg` vira drawer off-canvas, aberto pelo `MenuIcon` no `Topbar`. O estado
  `mobileOpen` vive no `AppLayout`; fecha ao trocar de rota, clicar no overlay ou no "x". Alvos
  de toque ampliados no mobile (hambúrguer `h-10`, itens do drawer `h-9`).
- **Fundação** ([AppLayout.tsx](src/components/layout/AppLayout.tsx) + [globals.css](src/styles/globals.css)):
  `min-h-[100dvh]` (evita o "pulo" da barra do browser no iOS), `overflow-x-hidden` na raiz e no
  `body`, `text-size-adjust: 100%`, e padding inferior do `main` com `env(safe-area-inset-bottom)`.
  O viewport (`index.html`) **não** bloqueia zoom — pinch-zoom é a forma de ler detalhes densos.
- **Dashboards (Monitoramento/Histórico)**: no mobile o mapa é o herói (`min-h-[60vh]`+). Os
  cards de controle do topo são compactos e quebram em linha (`flex-wrap`; `mx-auto`/`items-end`
  só em `lg`); os cards de stat ganham `flex-1` no mobile (`sm:flex-none`). Os filtros laterais
  (placas/linhas) viram **strips horizontais roláveis** no celular e voltam a ser sidebar
  vertical em `lg` — ver [components/monitoramento/CLAUDE.md](src/components/monitoramento/CLAUDE.md).
- **Tabelas**: encolhem para caber **inteiras na largura** do celular (fonte `text-[10px]/[11px]`,
  padding `px-1.5/px-2`, células com `align-top` e quebra de linha — sem truncar, para o pinch-zoom
  conseguir ler tudo). Em `sm+` voltam ao tamanho normal. Botões de ação seguem em tamanho tocável.
- **Páginas**: as áreas tabela+mapa / filtro+mapa empilham (`flex-col lg:flex-row`); alturas fixas
  (`h-[calc(100vh-140px)]`, `min-h-[480px]`) ficam só em `lg`, com alturas em `vh`/`dvh` no mobile
  para o conteúdo não colapsar. Larguras mínimas que forçariam scroll horizontal (`min-w-[360px]`)
  são `min-w-0` no mobile e voltam em `sm+`.

## UI primitivos

Em `src/components/ui/` ficam os primitivos: `Button`, `Input`, `Card`, `Modal`. `Modal` foi adicionado junto com a tela de Cadastro de Locais — overlay + portal, fecha em Esc/click no overlay, props `open`, `onClose`, `title`, `children`, `size` (`md`/`lg`/`xl`), `footer`. Tem **botão de tela cheia** ao lado do "x" (expande para a viewport inteira; cada abertura começa em modo janela).

## Google Maps libraries

Todas as telas que carregam o mapa devem importar `MAP_LIBRARIES` de [src/services/googleMaps.ts](src/services/googleMaps.ts). O `useJsApiLoader` exige que `libraries` seja a **mesma referência** entre telas — declarar inline por tela gera warning e pode forçar recarga do script.
