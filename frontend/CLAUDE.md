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
