# TOP TECHNO — Visão geral

Monorepo com dois projetos independentes: `backend/` (API) e `frontend/` (SPA).

## Stack
- **Backend**: Node 22 + Express + TypeScript + Yarn + SWC + `mssql`
- **Frontend**: React 18 + Vite + SWC + Tailwind + TypeScript

## Banco de dados
SQL Server. Banco `TOP_TECHNO`. Tabela principal usada até aqui:
```sql
[TOP_TECHNO].[dbo].[USUARIOS] (ID_USUARIO, USUARIO, EMAIL, SENHA)
```
Senha **plaintext** por decisão explícita do produto. Toda query é parametrizada (anti-SQLi).

## Autenticação
JWT em cookie HttpOnly. Sessão persiste no reload via `GET /auth/me`. Logout limpa o cookie.

## Segurança
Nenhuma regra de negócio no frontend. Helmet, CORS restrito, rate limit em login, Zod em DTOs, resposta genérica em credenciais inválidas, timing-safe comparison na senha.

## Paleta 60-30-10
- 60% `#ffffff`
- 30% `#465253`
- 10% `#4ec3f1`

## Fluxo Git
Branch por mudança, PR, merge squash na `main`. Repo privado em `github.com/Edmundo22/Top-Techno`.

## Como rodar
Veja [README.md](README.md).

## Documentação modular
Cada parte grande do projeto tem `CLAUDE.md`:
- [backend/CLAUDE.md](backend/CLAUDE.md)
- [backend/modules/auth/CLAUDE.md](backend/modules/auth/CLAUDE.md)
- [backend/modules/usuarios/CLAUDE.md](backend/modules/usuarios/CLAUDE.md)
- [backend/shared/middlewares/CLAUDE.md](backend/shared/middlewares/CLAUDE.md)
- [backend/infra/database/CLAUDE.md](backend/infra/database/CLAUDE.md)
- [frontend/CLAUDE.md](frontend/CLAUDE.md)
- [frontend/src/contexts/CLAUDE.md](frontend/src/contexts/CLAUDE.md)
