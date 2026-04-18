import type { Request, Response } from 'express';
import { authConfig } from '../../../config/auth';
import { AppError } from '../../../shared/errors/AppError';
import { ErrorMessages } from '../../../shared/errors/errorMessages';
import { ok } from '../../../shared/utils/response';
import { LoginService } from '../services/LoginService';
import { MeService } from '../services/MeService';
import type { LoginDTO } from '../schemas/login.schema';

export class AuthController {
  private readonly loginService = new LoginService();
  private readonly meService = new MeService();

  login = async (req: Request, res: Response): Promise<Response> => {
    const dto = req.body as LoginDTO;
    const { token, user } = await this.loginService.execute(dto);

    res.cookie(authConfig.cookie.name, token, authConfig.cookie.options);

    return ok(res, { user });
  };

  me = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new AppError(ErrorMessages.auth.notAuthenticated, 401);
    }
    const user = await this.meService.execute(req.user.sub);
    return ok(res, { user });
  };

  logout = async (_req: Request, res: Response): Promise<Response> => {
    res.clearCookie(authConfig.cookie.name, {
      ...authConfig.cookie.options,
      maxAge: 0,
    });
    return ok(res, { success: true });
  };
}
