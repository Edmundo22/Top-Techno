import { AppError } from '../../../shared/errors/AppError';
import { ErrorMessages } from '../../../shared/errors/errorMessages';
import { UsuarioAuthRepository } from '../repositories/UsuarioAuthRepository';

export class MeService {
  constructor(private readonly repository = new UsuarioAuthRepository()) {}

  async execute(userId: number) {
    const usuario = await this.repository.findById(userId);
    if (!usuario) {
      throw new AppError(ErrorMessages.auth.notAuthenticated, 401);
    }
    return {
      id: usuario.ID_USUARIO,
      usuario: usuario.USUARIO,
      email: usuario.EMAIL,
    };
  }
}
