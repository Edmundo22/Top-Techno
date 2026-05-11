import { api } from './api';

export interface LocalDTO {
  idLocal: number;
  codigoPonto: string | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  raio: number | null;
  pontoParada: string | null;
  poligonoWkt: string | null;
}

export interface LocalUpsertBody {
  codigoPonto: string;
  endereco: string;
  latitude: number;
  longitude: number;
  raio: number;
  pontoParada: string | null;
  poligonoWkt: string | null;
}

interface ListResponse {
  data: { locais: LocalDTO[] };
}

interface SingleResponse {
  data: { local: LocalDTO };
}

export const locaisApi = {
  async list(): Promise<LocalDTO[]> {
    const res = await api.get<ListResponse>('/locais');
    return res.data.data.locais;
  },
  async create(body: LocalUpsertBody): Promise<LocalDTO> {
    const res = await api.post<SingleResponse>('/locais', body);
    return res.data.data.local;
  },
  async update(id: number, body: LocalUpsertBody): Promise<LocalDTO> {
    const res = await api.put<SingleResponse>(`/locais/${id}`, body);
    return res.data.data.local;
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/locais/${id}`);
  },
};
