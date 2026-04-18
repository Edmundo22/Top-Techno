import crypto from 'node:crypto';
import { AppError } from '../../../shared/errors/AppError';
import { ErrorMessages } from '../../../shared/errors/errorMessages';
import type { LoginDTO } from '../schemas/login.schema';
import { UsuarioAuthRepository } from '../repositories/UsuarioAuthRepository';
import { signSessionToken, type TokenUser } from './tokenService';

export interface LoginResult {
  token: string;
  user: TokenUser;
}

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    const dummy = Buffer.alloc(bufA.length);
    crypto.timingSafeEqual(bufA, dummy);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export class LoginService {
  constructor(private readonly repository = new UsuarioAuthRepository()) {}

  async execute(dto: LoginDTO): Promise<LoginResult> {
    const usuarioRow = await this.repository.findByUsuario(dto.usuario);

    if (!usuarioRow) {
      const dummy = 'x'.repeat(Math.max(1, dto.senha.length));
      timingSafeEqualString(dto.senha, dummy);
      throw new AppError(ErrorMessages.auth.invalidCredentials, 401);
    }

    const senhaBanco = usuarioRow.SENHA ?? '';
    if (!timingSafeEqualString(dto.senha, senhaBanco)) {
      throw new AppError(ErrorMessages.auth.invalidCredentials, 401);
    }

    const user: TokenUser = {
      id: usuarioRow.ID_USUARIO,
      usuario: usuarioRow.USUARIO,
      email: usuarioRow.EMAIL,
    };

    return {
      token: signSessionToken(user),
      user,
    };
  }
}
