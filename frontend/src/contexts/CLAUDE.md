# contexts

## `AuthContext`

Fonte única de verdade para "quem está logado no frontend". É o único ponto que conversa com `/auth/*`.

### Valor exposto
```ts
{
  user: AuthUser | null;
  loading: boolean;
  login(email, senha): Promise<void>;
  logout(): Promise<void>;
}
```

### Ciclo de vida
1. **Mount**: chama `GET /auth/me` com `withCredentials`. Se 200 → `user` setado. Se falhar → `user = null`. Em ambos os casos, `loading=false` no fim.
2. **`login(email, senha)`**: `POST /auth/login` com `{ email, senha }` → backend busca o usuário pelo `EMAIL` (case-insensitive) → seta cookie HttpOnly → context armazena `user` retornado.
3. **`logout()`**: `POST /auth/logout` → backend limpa cookie → context zera `user`.

### Decisões

- **Não guardamos o token**: o JWT vive no cookie HttpOnly, inacessível ao JS. Mitiga XSS.
- **Não armazenamos nada em `localStorage`**: evita vetores adicionais de roubo de sessão. A persistência do login é do navegador (cookie).
- **`loading` inicial**: o app mostra um spinner enquanto `/auth/me` não responde, evitando flicker entre `/login` e rota protegida.
- **`ProtectedRoute` depende do contexto**, não faz fetch próprio.
