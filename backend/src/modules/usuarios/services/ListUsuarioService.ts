import { UsuarioRepository } from '../repositories/UsuarioRepository';

export class ListUsuarioService {
  constructor(private readonly repository = new UsuarioRepository()) {}

  async execute() {
    const rows = await this.repository.list();
    return rows.map((r) => ({
      id: r.ID_USUARIO,
      usuario: r.USUARIO,
      email: r.EMAIL,
    }));
  }
}
