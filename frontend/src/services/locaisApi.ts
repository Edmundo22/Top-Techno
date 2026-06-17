import { api } from './api';

// 1 = círculo (lat/lng + raio), 2 = polígono (lat/lng + WKT).
export type TipoLocal = 1 | 2;

export interface LocalDTO {
  idLocal: number;
  codigoPonto: string | null;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  raio: number | null;
  pontoParada: string | null;
  poligonoWkt: string | null;
  tipoLocal: number;
}

interface LocalUpsertBase {
  codigoPonto: string;
  endereco: string;
  latitude: number;
  longitude: number;
  pontoParada: string | null;
}

// União discriminada espelhando o backend: círculo tem raio (sem WKT),
// polígono tem WKT (sem raio). lat/lng sempre presentes nos dois.
export type LocalUpsertBody =
  | (LocalUpsertBase & { tipoLocal: 1; raio: number; poligonoWkt: null })
  | (LocalUpsertBase & { tipoLocal: 2; raio: null; poligonoWkt: string });

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
