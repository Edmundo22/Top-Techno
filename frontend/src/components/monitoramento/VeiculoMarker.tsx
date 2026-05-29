import { useEffect, useRef } from 'react';
import { useGoogleMap } from '@react-google-maps/api';
import type { Veiculo } from '../../services/monitoramentoApi';
import { formatBRDateTimeFull } from '../../utils/datetime';

interface VeiculoMarkerProps {
  data: Veiculo;
  color?: string;
}

const CAR_PATH =
  'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Renderização imperativa do Marker + InfoWindow, modelada no mesmo padrão
// que já era usado pelas rotas e pelo Circle do raio. Razão: a renderização
// declarativa via <Marker> + <OverlayView> do @react-google-maps/api falhava
// silenciosamente quando os dados chegavam antes do mapa estar com projeção
// pronta (sintoma: ao F5 os ícones dos veículos não apareciam até um remount
// forçado pelo ciclo select+deselect).
export function VeiculoMarker({ data, color = '#000000' }: VeiculoMarkerProps) {
  const map = useGoogleMap();
  const markerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  useEffect(() => {
    // Cleanup sempre roda antes de criar — garante remoção de instância antiga.
    const cleanup = () => {
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current);
        clickListenerRef.current = null;
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
    cleanup();

    if (!map || data.latitude == null || data.longitude == null) return;

    const position = { lat: data.latitude, lng: data.longitude };

    const icon: google.maps.Symbol = {
      path: CAR_PATH,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: color,
      strokeWeight: 1,
      scale: 1.6,
      anchor: new google.maps.Point(12, 12),
      // Label posicionado acima do ícone. Coordenadas em pre-scale (path coord).
      labelOrigin: new google.maps.Point(12, -3),
    };

    const marker = new google.maps.Marker({
      position,
      map,
      icon,
      label: {
        text: data.placa ?? '—',
        color,
        fontSize: '11px',
        fontWeight: 'bold',
        className: 'tt-veiculo-label',
      },
      zIndex: 20,
    });
    markerRef.current = marker;

    const placa = escapeHtml(data.placa ?? 'Sem placa');
    const dtUlt = escapeHtml(formatBRDateTimeFull(data.dtUltPosicao));
    const ignicao = escapeHtml(data.ignicao ?? '—');
    const velocidade =
      data.velocidade != null ? `${data.velocidade} km/h` : '—';

    const content = `
      <div style="min-width:200px;font-size:12px;color:#1F2937">
        <div style="font-size:13px;font-weight:600;margin-bottom:4px">${placa}</div>
        <div><span style="color:#6B7280">Última posição: </span>${dtUlt}</div>
        <div><span style="color:#6B7280">Ignição: </span>${ignicao}</div>
        <div><span style="color:#6B7280">Velocidade: </span>${velocidade}</div>
      </div>
    `;

    const infoWindow = new google.maps.InfoWindow({
      content,
      pixelOffset: new google.maps.Size(0, -28),
    });
    infoWindowRef.current = infoWindow;

    clickListenerRef.current = marker.addListener('click', () => {
      infoWindow.open({ map, anchor: marker });
    });

    return cleanup;
  }, [
    map,
    color,
    data.latitude,
    data.longitude,
    data.placa,
    data.dtUltPosicao,
    data.ignicao,
    data.velocidade,
  ]);

  return null;
}
