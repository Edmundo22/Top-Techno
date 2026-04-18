import { AppError } from '../../../shared/errors/AppError';
import { ErrorMessages } from '../../../shared/errors/errorMessages';
import { UsuarioAuthRepository } from '../repositories/UsuarioAuthRepository';
import { signSessionToken, type TokenUser } from './tokenService';

export interface MeResult {
  user: TokenUser;
  token: string;
}

export class MeService {
  constructor(private readonly repository = new UsuarioAuthRepository()) {}

  async execute(userId: number): Promise<MeResult> {
    const usuario = await this.repository.findById(userId);
    if (!usuario) {
      throw new AppError(ErrorMessages.auth.notAuthenticated, 401);
    }
    const user: TokenUser = {
      id: usuario.ID_USUARIO,
      usuario: usuario.USUARIO,
      email: usuario.EMAIL,
    };
    return { user, token: signSessionToken(user) };
  }
}
