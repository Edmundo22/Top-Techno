export const ErrorMessages = {
  auth: {
    invalidCredentials: 'Credenciais inválidas',
    notAuthenticated: 'Sessão expirada ou inválida',
    tooManyAttempts: 'Muitas tentativas de login. Aguarde e tente novamente.',
  },
  validation: {
    invalidBody: 'Dados enviados são inválidos',
  },
  internal: {
    unexpected: 'Erro interno no servidor',
  },
} as const;
