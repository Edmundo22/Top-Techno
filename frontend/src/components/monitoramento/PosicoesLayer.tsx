import { useEffect, useRef } from 'react';
import { useGoogleMap } from '@react-google-maps/api';
import { useLivePoll } from '../../hooks/useLivePoll';
import {
  type ViagemPosicao,
  type ViagemPosicoesResponse,
  monitoramentoEndpoints,
} from '../../services/monitoramentoApi';
import {
  formatBRDate,
  formatBRDateTimeFull,
  formatBRTime,
} from '../../utils/datetime';

interface PosicoesLayerProps {
  idViagem: number;
  placa: string;
}

const POLL_INTERVAL_MS = 15_000;

const COLOR_POSICAO_PROXIMA = '#1d4ed8'; // azul (≤ 500m)
const COLOR_POSICAO_LONGE = '#dc2626'; // vermelho (> 500m ou null)
const DIST_THRESHOLD_M = 500;

function pickCorPosicao(distRota: number | null): string {
  if (distRota == null) return COLOR_POSICAO_LONGE;
  return distRota <= DIST_THRESHOLD_M
    ? COLOR_POSICAO_PROXIMA
    : COLOR_POSICAO_LONGE;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDist(dist: number | null): string {
  if (dist == null) return '—';
  return `${dist.toFixed(2)} m`;
}

function buildInfoContent(placa: string, p: ViagemPosicao): string {
  const placaEsc = escapeHtml(placa);
  const dataEsc = escapeHtml(formatBRDate(p.dtPosicao));
  const horaEsc = escapeHtml(formatBRTime(p.dtPosicao));
  const vel = p.velocidade != null ? `${p.velocidade} km/h` : '—';
  const ign = escapeHtml(p.ignicao ?? '—');
  const distRota = escapeHtml(formatDist(p.distRota));
  const pontoParadaRow = p.pontoParada
    ? `<div><span style="color:#6B7280">Ponto de parada: </span>${escapeHtml(p.pontoParada)}</div>`
    : '';
  return `
    <div style="min-width:220px;font-size:12px;color:#1F2937">
      <div style="font-size:13px;font-weight:600;margin-bottom:4px">${placaEsc} · Posição #${p.posi}</div>
      <div><span style="color:#6B7280">Data: </span>${dataEsc}</div>
      <div><span style="color:#6B7280">Horário: </span>${horaEsc}</div>
      <div><span style="color:#6B7280">Velocidade: </span>${vel}</div>
      <div><span style="color:#6B7280">Ignição: </span>${ign}</div>
      <div><span style="color:#6B7280">Dist. rota: </span>${distRota}</div>
      ${pontoParadaRow}
    </div>
  `;
}

/**
 * Renderiza as bolinhas numeradas das posições de uma viagem no mapa.
 *
 * Renderless — devolve `null`. Cria `google.maps.Marker` + `InfoWindow`
 * imperativamente via `useGoogleMap()` + refs + cleanup com `setMap(null)`,
 * mesmo padrão de `MapaMonitoramento::clearRotas` e dos demais markers.
 *
 * Faz seu próprio polling 15s do endpoint `/monitoramento/viagem-posicoes`
 * pra que cada placa selecionada tenha sua própria fonte de dados.
 */
export function PosicoesLayer({ idViagem, placa }: PosicoesLayerProps) {
  const map = useGoogleMap();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowsRef = useRef<google.maps.InfoWindow[]>([]);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);

  const poll = useLivePoll<ViagemPosicoesResponse>(
    monitoramentoEndpoints.viagemPosicoes(idViagem),
    { intervalMs: POLL_INTERVAL_MS },
  );

  const posicoes = poll.data?.posicoes ?? [];

  useEffect(() => {
    const cleanup = () => {
      listenersRef.current.forEach((l) => google.maps.event.removeListener(l));
      infoWindowsRef.current.forEach((iw) => iw.close());
      markersRef.current.forEach((m) => m.setMap(null));
      listenersRef.current = [];
      infoWindowsRef.current = [];
      markersRef.current = [];
    };
    cleanup();

    if (!map) return;

    posicoes.forEach((p) => {
      if (p.latitude == null || p.longitude == null) return;

      const color = pickCorPosicao(p.distRota);

      const marker = new google.maps.Marker({
        position: { lat: p.latitude, lng: p.longitude },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          scale: 11,
        },
        label: {
          text: String(p.posi),
          color: '#ffffff',
          fontSize: '9px',
          fontWeight: 'bold',
        },
        title: formatBRDateTimeFull(p.dtPosicao),
        zIndex: 15,
      });
      markersRef.current.push(marker);

      const infoWindow = new google.maps.InfoWindow({
        content: buildInfoContent(placa, p),
        pixelOffset: new google.maps.Size(0, -10),
      });
      infoWindowsRef.current.push(infoWindow);

      const listener = marker.addListener('click', () => {
        infoWindowsRef.current.forEach((iw) => iw.close());
        infoWindow.open({ map, anchor: marker });
      });
      listenersRef.current.push(listener);
    });

    return cleanup;
  }, [map, placa, posicoes]);

  return null;
}
