import { api } from './api';

export interface RotaFtDTO {
  idFt: number;
  numeroLinha: string | null;
  numeroFt: string | null;
  polyline: string | null;
}

export interface VinculadoDTO {
  idCadMotRota: number;
  idCadMot: number;
  motorista: string | null;
  cnh: string | null;
  titular: boolean;
  dtInsercao: string | null;
}

export interface DisponivelDTO {
  idCadMot: number;
  motorista: string | null;
  cnh: string | null;
}

interface RotasResponse {
  data: { rotas: RotaFtDTO[] };
}

interface VinculadosResponse {
  data: { vinculados: VinculadoDTO[] };
}

interface DisponiveisResponse {
  data: { disponiveis: DisponivelDTO[] };
}

export const motoristaRotaApi = {
  async listRotas(): Promise<RotaFtDTO[]> {
    const res = await api.get<RotasResponse>('/motorista-rota/rotas');
    return res.data.data.rotas;
  },
  async listVinculados(idFt: number): Promise<VinculadoDTO[]> {
    const res = await api.get<VinculadosResponse>('/motorista-rota/vinculados', {
      params: { idFt },
    });
    return res.data.data.vinculados;
  },
  async listDisponiveis(idFt: number): Promise<DisponivelDTO[]> {
    const res = await api.get<DisponiveisResponse>('/motorista-rota/disponiveis', {
      params: { idFt },
    });
    return res.data.data.disponiveis;
  },
  async vincular(idFt: number, idsCadMot: number[]): Promise<void> {
    await api.post('/motorista-rota/vincular', { idFt, idsCadMot });
  },
  async setTitular(idFt: number, idCadMot: number, titular: boolean): Promise<void> {
    await api.patch('/motorista-rota/titular', { idFt, idCadMot, titular });
  },
  async desvincular(idCadMotRota: number): Promise<void> {
    await api.delete(`/motorista-rota/vinculo/${idCadMotRota}`);
  },
};
