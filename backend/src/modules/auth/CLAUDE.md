# modules/auth

Responsável por **tudo** que envolve autenticação do usuário: login, leitura de sessão e logout. Consome a tabela `[TOP_TECHNO].[dbo].[USUARIOS]`.

## Contrato

| Rota                | Método | Middleware                        | Retorno                    |
|---------------------|--------|-----------------------------------|----------------------------|
| `/auth/login`       | POST   | `loginRateLimiter`, `validateBody`| `{ user }` + seta cookie   |
| `/auth/me`          | GET    | `authMiddleware`                  | `{ user }`                 |
| `/auth/logout`      | POST   | —                                 | `{ success: true }`        |

## Camadas

1. **`routes/auth.routes.ts`** — define paths, conecta middlewares + controller. Sem lógica.
2. **`schemas/login.schema.ts`** — `zod` valida body da requisição. Normaliza com `trim()`.
3. **`controllers/AuthController.ts`** — fino: pega body já validado, chama service, grava cookie, devolve JSON.
4. **`services/LoginService.ts`** — regra de negócio:
   - busca o usuário pelo campo `USUARIO`;
   - compara senha com `crypto.timingSafeEqual` (evita timing attack);
   - se usuário não existe, ainda roda uma comparação dummy para manter tempo constante (evita enumeração);
   - assina JWT `{ sub, usuario, email }` com `HS256`, `expiresIn = 8h`, segredo `JWT_SECRET`.
5. **`services/MeService.ts`** — recarrega o usuário do banco a partir do `sub` do token. Garante que usuários desativados/deletados após emissão do JWT deixem de ter acesso (camada defensiva).
6. **`repositories/UsuarioAuthRepository.ts`** — única camada que conversa com o banco. Queries **parametrizadas** com `sql.NVarChar` / `sql.Int` (anti-SQLi). Nenhuma regra de negócio aqui.

## Decisões de segurança

- **Senha em texto plano no banco**: decisão explícita do produto. Mesmo assim:
  - nunca é logada (`logger` com `redact` mascara `*.senha`);
  - nunca é ecoada em nenhum endpoint;
  - comparação com `timingSafeEqual` em vez de `===` (independente de ser hash ou não, evita revelar tamanho/bytes por tempo).
- **JWT em cookie HttpOnly** (`tt_session`): não é acessível via JS no browser → mitiga XSS roubando token. `Secure=true` em produção, `SameSite=strict` em produção, `lax` em dev.
- **Resposta genérica** em falha de login: "Credenciais inválidas" — não distingue usuário inexistente de senha errada.
- **Rate limit**: 5 tentativas / 15min / IP em `/auth/login`. Mitiga brute force.
- **Sessão persistida**: frontend chama `GET /auth/me` no mount; enquanto o cookie for válido, a sessão se mantém no F5.
- **Logout**: `res.clearCookie` com os mesmos atributos (`path`, `domain`, `sameSite`) do cookie original — senão o browser ignora o clear.

## Como estender

- **Novo endpoint auth** (ex.: trocar senha): nova rota em `auth.routes.ts` + novo service. Não coloque regra de negócio no controller.
- **Novo claim no JWT**: edite `LoginService.execute`, o tipo `Express.UserPayload` em `shared/types/express.d.ts` e `authMiddleware`.
