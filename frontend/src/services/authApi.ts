import { api } from './api';

export interface AuthUser {
  id: number;
  usuario: string;
  email: string;
}

interface LoginResponse {
  data: { user: AuthUser };
}

interface MeResponse {
  data: { user: AuthUser };
}

export const authApi = {
  async login(usuario: string, senha: string): Promise<AuthUser> {
    const res = await api.post<LoginResponse>('/auth/login', { usuario, senha });
    return res.data.data.user;
  },
  async me(): Promise<AuthUser> {
    const res = await api.get<MeResponse>('/auth/me');
    return res.data.data.user;
  },
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
