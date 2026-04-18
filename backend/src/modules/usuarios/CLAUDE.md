# modules/usuarios

Módulo com o esqueleto das operações de usuário. **Toda rota é protegida por `authMiddleware`**.

## O que já existe
- `GET /usuarios` — lista todos os usuários (sem a coluna SENHA). Pronto para paginação futura.

## O que vem depois
- `POST /usuarios` — criar usuário (só após decidir se/como validamos força de senha com a regra de plaintext).
- `PUT /usuarios/:id` — editar.
- `DELETE /usuarios/:id` — excluir (provavelmente soft delete).

## Princípios
- Controller fino.
- Regras no service (ex.: "não pode excluir admin master", "não pode editar o próprio id para um já existente" etc.).
- Repository só SQL parametrizado.
- Nenhum service expõe a coluna SENHA para o HTTP.
