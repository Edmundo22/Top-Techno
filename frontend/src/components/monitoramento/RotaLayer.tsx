import { useMemo, useState } from 'react';
import { InfoWindow, Marker, Polyline } from '@react-google-maps/api';
import type { Rota } from '../../services/monitoramentoApi';
import { formatBRDateTime } from '../../utils/datetime';
import { logError } from '../../utils/logger';

const ROUTE_COLOR = '#1d4ed8';

interface RotaLayerProps {
  data: Rota;
  selected: boolean;
  onSelect: () => void;
}

type OpenMarker = 'I' | 'F' | null;

export function RotaLayer({ data, selected, onSelect }: RotaLayerProps) {
  const [openMarker, setOpenMarker] = useState<OpenMarker>(null);

  const path = useMemo<google.maps.LatLngLiteral[]>(() => {
    try {
      const decoded = google.maps.geometry.encoding.decodePath(data.polyline);
      return decoded.map((p) => ({ lat: p.lat(), lng: p.lng() }));
    } catch (err) {
      logError('RotaLayer decodePath', err, { idViagem: data.idViagem });
      return [];
    }
  }, [data.polyline, data.idViagem]);

  if (path.length === 0) return null;

  const start = path[0];
  const end = path[path.length - 1];

  const endpointIcon: google.maps.Symbol = {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: ROUTE_COLOR,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 7,
  };

  const labelFor = (letter: 'I' | 'F'): google.maps.MarkerLabel => ({
    text: letter,
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 'bold',
  });

  const handleMarkerClick = (which: 'I' | 'F') => {
    setOpenMarker((current) => (current === which ? null : which));
    onSelect();
  };

  return (
    <>
      <Polyline
        path={path}
        options={{
          geodesic: false,
          strokeColor: ROUTE_COLOR,
          strokeOpacity: selected ? 1 : 0.85,
          strokeWeight: selected ? 6 : 4,
          clickable: true,
          zIndex: selected ? 8 : 5,
        }}
        onClick={onSelect}
      />

      <Marker
        position={start}
        icon={endpointIcon}
        label={labelFor('I')}
        onClick={() => handleMarkerClick('I')}
        zIndex={15}
      />
      {openMarker === 'I' && (
        <InfoWindow
          position={start}
          onCloseClick={() => setOpenMarker(null)}
          options={{ pixelOffset: new google.maps.Size(0, -10) }}
        >
          <div className="min-w-[180px] space-y-1 text-xs text-brand-ink">
            <div className="text-sm font-semibold">{data.placa ?? 'Sem placa'}</div>
            <div>
              <span className="text-brand-ink-muted">Início: </span>
              {formatBRDateTime(data.dtIniViagem)}
            </div>
          </div>
        </InfoWindow>
      )}

      <Marker
        position={end}
        icon={endpointIcon}
        label={labelFor('F')}
        onClick={() => handleMarkerClick('F')}
        zIndex={15}
      />
      {openMarker === 'F' && (
        <InfoWindow
          position={end}
          onCloseClick={() => setOpenMarker(null)}
          options={{ pixelOffset: new google.maps.Size(0, -10) }}
        >
          <div className="min-w-[180px] space-y-1 text-xs text-brand-ink">
            <div className="text-sm font-semibold">{data.placa ?? 'Sem placa'}</div>
            <div>
              <span className="text-brand-ink-muted">Fim: </span>
              {formatBRDateTime(data.dtFimViagem)}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
