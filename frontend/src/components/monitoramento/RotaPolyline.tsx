import { useMemo } from 'react';
import { Polyline } from '@react-google-maps/api';
import type { Rota } from '../../services/monitoramentoApi';

interface RotaPolylineProps {
  data: Rota;
  color?: string;
}

export function RotaPolyline({ data, color = '#1F2937' }: RotaPolylineProps) {
  const path = useMemo<google.maps.LatLngLiteral[]>(() => {
    try {
      const decoded = google.maps.geometry.encoding.decodePath(data.polyline);
      return decoded.map((p) => ({ lat: p.lat(), lng: p.lng() }));
    } catch {
      return [];
    }
  }, [data.polyline]);

  if (path.length === 0) return null;

  return (
    <Polyline
      path={path}
      options={{
        geodesic: false,
        strokeColor: color,
        strokeOpacity: 0.85,
        strokeWeight: 4,
        clickable: false,
        zIndex: 5,
      }}
    />
  );
}
