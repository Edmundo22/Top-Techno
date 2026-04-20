import { useMemo, useState } from 'react';
import { Circle, InfoWindow, Marker } from '@react-google-maps/api';
import type { LocalDia } from '../../services/monitoramentoApi';
import { formatBRDateTimeFull } from '../../utils/datetime';

interface LocalMarkerProps {
  data: LocalDia;
  color?: string;
}

export function LocalMarker({ data, color = '#000000' }: LocalMarkerProps) {
  const [openInfo, setOpenInfo] = useState(false);
  const [showRaio, setShowRaio] = useState(false);

  const position = useMemo(() => {
    if (data.latitude == null || data.longitude == null) return null;
    return { lat: data.latitude, lng: data.longitude };
  }, [data.latitude, data.longitude]);

  if (!position) return null;

  const icon: google.maps.Symbol = {
    path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: color,
    strokeWeight: 2,
    scale: 5,
  };

  return (
    <>
      <Marker position={position} icon={icon} onClick={() => setOpenInfo((v) => !v)} zIndex={10} />

      {showRaio && data.raio != null && data.raio > 0 && (
        <Circle
          center={position}
          radius={data.raio}
          options={{
            fillColor: color,
            fillOpacity: 0.12,
            strokeColor: color,
            strokeOpacity: 0.6,
            strokeWeight: 1,
            clickable: false,
          }}
        />
      )}

      {openInfo && (
        <InfoWindow
          position={position}
          onCloseClick={() => setOpenInfo(false)}
          options={{ pixelOffset: new google.maps.Size(0, -14) }}
        >
          <div className="min-w-[240px] max-w-[300px] space-y-1 text-xs text-brand-ink">
            <div className="text-sm font-semibold">{data.endereco ?? 'Sem endereço'}</div>
            <div>
              <span className="text-brand-ink-muted">Ponto de parada: </span>
              {data.pontoParada ?? '—'}
            </div>
            <div className="pt-1 text-[11px] uppercase tracking-wider text-brand-ink-muted">
              Previsto
            </div>
            <div>
              <span className="text-brand-ink-muted">Entrada: </span>
              {formatBRDateTimeFull(data.dtEntPrevista)}
            </div>
            <div>
              <span className="text-brand-ink-muted">Saída: </span>
              {formatBRDateTimeFull(data.dtSaiPrevista)}
            </div>
            <div className="pt-1 text-[11px] uppercase tracking-wider text-brand-ink-muted">
              Realizado
            </div>
            <div>
              <span className="text-brand-ink-muted">Entrada: </span>
              {formatBRDateTimeFull(data.dtEntReal)}
            </div>
            <div>
              <span className="text-brand-ink-muted">Saída: </span>
              {formatBRDateTimeFull(data.dtSaiReal)}
            </div>

            <button
              type="button"
              onClick={() => setShowRaio((v) => !v)}
              className={`mt-2 w-full rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                showRaio
                  ? 'bg-brand-accent text-brand-ink hover:bg-brand-accent-hover'
                  : 'border border-brand-line bg-white text-brand-ink hover:bg-brand-line-soft'
              }`}
              disabled={data.raio == null || data.raio <= 0}
            >
              {data.raio == null || data.raio <= 0
                ? 'Raio indisponível'
                : showRaio
                ? `Ocultar raio (${data.raio} m)`
                : `Mostrar raio (${data.raio} m)`}
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
