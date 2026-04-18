# shared/middlewares

Middlewares transversais usados por todos os módulos.

## Arquivos

### `authMiddleware.ts`
Lê o cookie `tt_session`, valida a assinatura do JWT com `HS256` e `JWT_SECRET`, extrai o payload `{ sub, usuario, email }` e injeta em `req.user`. Se o cookie estiver ausente ou inválido, lança `AppError(401)` — o `errorMiddleware` converte para resposta padronizada.

### `errorMiddleware.ts`
Handler global registrado por último em `app.ts`. Trata três casos:
- `AppError` → retorna `statusCode` + `message` controlados.
- `ZodError` → 400 com `fieldErrors` para debug do frontend.
- Qualquer outro → 500 genérico, log completo via `pino`. **Nunca vaza stack** para o cliente.

### `rateLimitMiddleware.ts`
`loginRateLimiter`: 5 tentativas por IP a cada 15 minutos na rota `POST /auth/login`. Mitiga brute force.

### `validate.ts`
`validateBody(schema)` — middleware que roda um `ZodSchema` contra `req.body` e substitui o body por uma versão já tipada. Erros de validação são capturados pelo `errorMiddleware`.

## Por que aqui e não nos módulos?
Esses middlewares são **contratos do framework**, não regras de negócio. Ficam em `shared/` porque qualquer módulo pode precisar deles.
