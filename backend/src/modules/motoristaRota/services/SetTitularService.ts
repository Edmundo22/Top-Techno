import { MotoristaRotaRepository } from '../repositories/MotoristaRotaRepository';

export class SetTitularService {
  constructor(private readonly repository = new MotoristaRotaRepository()) {}

  // titular=true → marca este como único titular (zera os demais da rota).
  // titular=false → rota fica sem titular (estado válido).
  async execute(idFt: number, idCadMot: number, titular: boolean): Promise<void> {
    await this.repository.setTitular(idFt, idCadMot, titular);
  }
}
