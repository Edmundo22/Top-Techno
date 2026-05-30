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
  temRota: boolean;
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
  idFt: number | null;
  numeroLinha: string | null;
  numeroFt: string | null;
}

export interface LocalDia {
  idViagemEntrada: number;
  idViagem: number;
  ordem: number | null;
  idLocal: number;
  codigoPonto: string | null;
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

export interface ViagemEntrada {
  placa: string | null;
  local: string | null;
  entPrev: string | null;
  entReal: string | null;
  saiPrev: string | null;
  saiReal: string | null;
  tDentroMin: number | null;
  ordem: number | null;
  dtEntPrevistaIso: string | null;
  dtEntRealIso: string | null;
  dtSaiPrevistaIso: string | null;
  dtSaiRealIso: string | null;
}

export interface ViagemEntradasResponse {
  entradas: ViagemEntrada[];
}

export interface ViagemPosicao {
  posi: number;
  dtPosicao: string | null;
  velocidade: number | null;
  ignicao: string | null;
  latitude: number | null;
  longitude: number | null;
  distRota: number | null;
  pontoParada: string | null;
}

export interface ViagemPosicoesResponse {
  posicoes: ViagemPosicao[];
}

export const monitoramentoEndpoints = {
  veiculos: '/monitoramento/veiculos',
  rotas: '/monitoramento/rotas',
  locais: '/monitoramento/locais',
  viagemEntradas: (idViagem: number) =>
    `/monitoramento/viagem-entradas?idViagem=${idViagem}`,
  viagemPosicoes: (idViagem: number) =>
    `/monitoramento/viagem-posicoes?idViagem=${idViagem}`,
} as const;
