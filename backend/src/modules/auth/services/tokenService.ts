import jwt, { type SignOptions } from 'jsonwebtoken';
import { authConfig } from '../../../config/auth';

export interface TokenUser {
  id: number;
  usuario: string;
  email: string;
}

export function signSessionToken(user: TokenUser): string {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: authConfig.jwt.expiresIn as SignOptions['expiresIn'],
    subject: String(user.id),
  };
  return jwt.sign({ usuario: user.usuario, email: user.email }, authConfig.jwt.secret, options);
}
