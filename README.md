# TOP TECHNO

Sistema empresarial com backend em Node/Express/TypeScript e frontend em React/Vite/Tailwind.

## Estrutura

```
TOPTechno/
├── backend/   # API REST, arquitetura em camadas
└── frontend/  # SPA React com paleta 60-30-10
```

## Rodar em desenvolvimento local

### Pré-requisitos
- Node 22+
- Yarn 4+
- Acesso ao SQL Server com o banco `TOP_TECHNO`

### Backend
```bash
cd backend
cp .env.example .env
# preencher .env com credenciais reais do SQL Server e JWT_SECRET
# gerar segredo JWT: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
yarn install
yarn dev
```
API sobe em `http://localhost:3333`.

### Frontend
```bash
cd frontend
cp .env.example .env
yarn install
yarn dev
```
App sobe em `http://localhost:5173`.

## Produção

A única diferença entre local e produção é o `.env` de cada projeto.

```bash
cd backend && yarn build
cd ../frontend && yarn build
```

O backend gera `backend/dist/index.js`. Você configura seu próprio `ecosystem.config.js` do PM2 e sobe com `pm2 start ecosystem.config.js`.

O frontend gera `frontend/dist/` estático, servido por IIS, Nginx ou `npx serve -s dist`.

## Segurança
- JWT em cookie HttpOnly (Secure em prod)
- Rate limit em `/auth/login`
- Helmet + CORS restrito + Zod em DTOs
- Queries parametrizadas (anti-SQLi)
- **Nenhuma regra de negócio no frontend**

## Documentação
Cada parte grande do projeto tem seu próprio `CLAUDE.md` explicando a lógica daquela pasta.
