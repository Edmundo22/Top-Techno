import { api } from './api';

export interface Posicao {
  idViagemPosicao: number;
  idViagem: number | null;
  idPosicao: number | null;
  idVeiculo: number | null;
  placa: string | null;
  dtPosicao: string | null;
  velocidade: number | null;
  ignicao: string | null;
  ignicaoOn: boolean | null;
  latitude: number | null;
  longitude: number | null;
  idLocal: number | null;
  distRota: number | null;
  pontoParada: string | null;
}

export interface RotaHistorico {
  idViagem: number;
  idVeiculo: number | null;
  placa: string | null;
  idViagemStatus: number | null;
  statusLabel: string | null;
  dtIniViagem: string | null;
  dtFimViagem: string | null;
  polyline: string;
}

export interface LocalHistorico {
  idHistorico: number;
  idVeiculo: number | null;
  placa: string | null;
  idLocal: number;
  latitude: number | null;
  longitude: number | null;
  raio: number | null;
  pontoParada: string | null;
  endereco: string | null;
  dtEntrada: string | null;
  dtSaida: string | null;
  tempoPermanenciaMin: number | null;
}

interface Envelope<T> {
  data: T;
}

export async function fetchPosicoesHistorico(data: string): Promise<Posicao[]> {
  const res = await api.get<Envelope<{ posicoes: Posicao[] }>>('/historico/posicoes', {
    params: { data },
  });
  return res.data.data.posicoes;
}

export async function fetchRotasHistorico(data: string): Promise<RotaHistorico[]> {
  const res = await api.get<Envelope<{ rotas: RotaHistorico[] }>>('/historico/rotas', {
    params: { data },
  });
  return res.data.data.rotas;
}

export async function fetchLocaisHistorico(data: string): Promise<LocalHistorico[]> {
  const res = await api.get<Envelope<{ locais: LocalHistorico[] }>>('/historico/locais', {
    params: { data },
  });
  return res.data.data.locais;
}
