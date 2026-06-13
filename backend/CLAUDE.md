# Backend — TOP TECHNO

API REST em Node + Express + TypeScript seguindo **Arquitetura em Camadas (Layered Architecture)**.

## Stack
- Node 22, Express 4, TypeScript 5
- `mssql` (pool nativo) para SQL Server
- `jsonwebtoken` + `cookie-parser` para sessão
- `helmet`, `cors`, `express-rate-limit`, `zod`, `pino`
- Build: SWC (`@swc/cli`). Dev: `nodemon` + `@swc-node/register` (transpile on-the-fly)

## Princípio fundamental
**Nenhuma regra de negócio fora dos services.**
- Route → define path, plugga middleware e handler.
- Controller → pega body/query/params (já validados), chama service, devolve HTTP.
- Service → regra de negócio, validações de processo, orquestração.
- Repository → SQL parametrizado, sem regra.
- Middleware → transversal (auth, rate limit, erro, validação).
- DTO/Schema → Zod no limite (entrada HTTP).

## Árvore

```
src/
├── config/               env, database, auth (carregamento e validação de config)
├── infra/
│   ├── http/             app.ts, server.ts, routes.ts
│   └── database/         connection.ts (pool mssql singleton)
├── modules/
│   ├── auth/             controllers, services, repositories, routes, schemas
│   └── usuarios/         controllers, services, repositories, routes
├── shared/
│   ├── middlewares/      authMiddleware, errorMiddleware, rateLimit, validate
│   ├── errors/           AppError, errorMessages
│   ├── utils/            logger, response
│   └── types/            express.d.ts (augmenta req.user)
└── index.ts              bootstrap
```

## Fluxo de uma request

```
Request
  → helmet + cors + json + cookieParser (app.ts)
  → /auth, /usuarios (routes.ts)
  → [rate-limit | validate | authMiddleware] (middlewares)
  → Controller.handler
  → Service.execute (regra)
  → Repository.xxx (SQL)
  ← JSON
errors → errorMiddleware (converte AppError/ZodError/Unknown)
```

## Scripts npm/yarn

| script      | o que faz                                                 |
|-------------|-----------------------------------------------------------|
| `yarn dev`  | `nodemon` + `@swc-node/register` (hot reload TypeScript)  |
| `yarn build`| `swc src -d dist` (transpila para `dist/`)                |
| `yarn start`| `node dist/index.js` (usado pelo PM2 em produção)         |
| `yarn typecheck` | `tsc --noEmit` (validação de tipos sem emitir)       |

## .env
Veja `.env.example`. A diferença entre local e produção é **apenas** esse arquivo. Valores importantes:
- `JWT_SECRET` — gere com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- Em produção: `COOKIE_SECURE=true`, `COOKIE_SAMESITE=strict`, `CORS_ORIGIN=https://seu-frontend`.

## Segurança aplicada
- Helmet (CSP, X-Frame-Options, etc.).
- CORS restrito ao `CORS_ORIGIN`.
- Cookies HttpOnly (+ Secure em prod), SameSite lax/strict.
- JWT assinado com HS256 e segredo forte.
- Rate limit no `/auth/login`.
- Zod em toda DTO de entrada.
- Queries sempre parametrizadas (`request.input(...)`).
- Log com `redact` (remove senhas e cookies do log).
- Resposta genérica em credenciais inválidas.
- `express.json({ limit: '100kb' })`.
- `app.disable('x-powered-by')`.

## Documentação modular
- [modules/auth/CLAUDE.md](modules/auth/CLAUDE.md)
- [modules/usuarios/CLAUDE.md](modules/usuarios/CLAUDE.md)
- [modules/monitoramento/CLAUDE.md](modules/monitoramento/CLAUDE.md)
- [modules/historico/CLAUDE.md](modules/historico/CLAUDE.md)
- [modules/locais/CLAUDE.md](modules/locais/CLAUDE.md)
- [modules/motoristas/CLAUDE.md](modules/motoristas/CLAUDE.md)
- [modules/motoristaRota/CLAUDE.md](modules/motoristaRota/CLAUDE.md)
- [shared/middlewares/CLAUDE.md](shared/middlewares/CLAUDE.md)
- [infra/database/CLAUDE.md](infra/database/CLAUDE.md)
