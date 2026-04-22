import { useMemo, useState } from 'react';
import { InfoWindow, Marker, OverlayView } from '@react-google-maps/api';
import type { Veiculo } from '../../services/monitoramentoApi';
import { formatBRDateTimeFull } from '../../utils/datetime';

interface VeiculoMarkerProps {
  data: Veiculo;
  color?: string;
}

const CAR_PATH =
  'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z';

const labelOffset = () => ({ x: -40, y: -32 });

export function VeiculoMarker({ data, color = '#000000' }: VeiculoMarkerProps) {
  const [open, setOpen] = useState(false);

  const position = useMemo(() => {
    if (data.latitude == null || data.longitude == null) return null;
    return { lat: data.latitude, lng: data.longitude };
  }, [data.latitude, data.longitude]);

  if (!position) return null;

  const icon: google.maps.Symbol = {
    path: CAR_PATH,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: color,
    strokeWeight: 1,
    scale: 1.6,
    anchor: new google.maps.Point(12, 12),
  };

  return (
    <>
      <Marker position={position} icon={icon} onClick={() => setOpen((v) => !v)} zIndex={20} />

      <OverlayView
        position={position}
        mapPaneName={OverlayView.OVERLAY_LAYER}
        getPixelPositionOffset={labelOffset}
      >
        <div
          style={{ color }}
          className="pointer-events-none w-20 select-none text-center text-[11px] font-bold drop-shadow-[0_1px_0_#fff]"
        >
          {data.placa ?? '—'}
        </div>
      </OverlayView>

      {open && (
        <InfoWindow
          position={position}
          onCloseClick={() => setOpen(false)}
          options={{ pixelOffset: new google.maps.Size(0, -28) }}
        >
          <div className="min-w-[200px] space-y-1 text-xs text-brand-ink">
            <div className="text-sm font-semibold">{data.placa ?? 'Sem placa'}</div>
            <div>
              <span className="text-brand-ink-muted">Última posição: </span>
              {formatBRDateTimeFull(data.dtUltPosicao)}
            </div>
            <div>
              <span className="text-brand-ink-muted">Ignição: </span>
              {data.ignicao ?? '—'}
            </div>
            <div>
              <span className="text-brand-ink-muted">Velocidade: </span>
              {data.velocidade != null ? `${data.velocidade} km/h` : '—'}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
