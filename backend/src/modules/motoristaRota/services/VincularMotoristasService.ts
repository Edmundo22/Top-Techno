import { MotoristaRotaRepository } from '../repositories/MotoristaRotaRepository';

export class VincularMotoristasService {
  constructor(private readonly repository = new MotoristaRotaRepository()) {}

  async execute(idFt: number, idsCadMot: number[]): Promise<void> {
    // De-dup defensivo; o repo ainda ignora ids já vinculados (NOT EXISTS).
    const unique = [...new Set(idsCadMot)];
    await this.repository.vincular(idFt, unique);
  }
}
