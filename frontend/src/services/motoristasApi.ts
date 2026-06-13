import { api } from './api';

export interface MotoristaDTO {
  idCadMot: number;
  motorista: string | null;
  cnh: string | null;
  cpf: string | null;
  telfone: string | null; // coluna TELFONE (typo do banco) — label visual "Telefone"
  obs: string | null;
}

export interface MotoristaUpsertBody {
  motorista: string;
  cnh: string;
  cpf: string | null;
  telfone: string | null;
  obs: string | null;
}

interface ListResponse {
  data: { motoristas: MotoristaDTO[] };
}

interface SingleResponse {
  data: { motorista: MotoristaDTO };
}

export const motoristasApi = {
  async list(): Promise<MotoristaDTO[]> {
    const res = await api.get<ListResponse>('/motoristas');
    return res.data.data.motoristas;
  },
  async create(body: MotoristaUpsertBody): Promise<MotoristaDTO> {
    const res = await api.post<SingleResponse>('/motoristas', body);
    return res.data.data.motorista;
  },
  async update(id: number, body: MotoristaUpsertBody): Promise<MotoristaDTO> {
    const res = await api.put<SingleResponse>(`/motoristas/${id}`, body);
    return res.data.data.motorista;
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/motoristas/${id}`);
  },
};
