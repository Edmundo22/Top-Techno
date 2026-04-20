export interface Veiculo {
  idVeiculo: number;
  placa: string | null;
  latitude: number | null;
  longitude: number | null;
  dtUltPosicao: string | null;
  ignicao: string | null;
  velocidade: number | null;
  idViagem: number | null;
  idViagemStatus: number | null;
}

export interface Rota {
  idViagem: number;
  idVeiculo: number | null;
  placa: string | null;
  idViagemStatus: number | null;
  statusLabel: string | null;
  dtIniViagem: string | null;
  dtFimViagem: string | null;
  polyline: string;
}

export interface LocalDia {
  idViagemEntrada: number;
  idViagem: number;
  ordem: number | null;
  idLocal: number;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  raio: number | null;
  pontoParada: string | null;
  dtEntPrevista: string | null;
  dtSaiPrevista: string | null;
  dtEntReal: string | null;
  dtSaiReal: string | null;
}

export interface VeiculosResponse {
  veiculos: Veiculo[];
}

export interface RotasResponse {
  rotas: Rota[];
}

export interface LocaisResponse {
  locais: LocalDia[];
}

export const monitoramentoEndpoints = {
  veiculos: '/monitoramento/veiculos',
  rotas: '/monitoramento/rotas',
  locais: '/monitoramento/locais',
} as const;
