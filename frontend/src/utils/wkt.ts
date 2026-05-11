// Helpers para conversão entre paths do Google Maps e WKT POLYGON.
//
// SQL Server `geography` armazena binário (ex.: 0xE6100000010C...). O backend
// converte com `LOCAL_GEO.STAsText()` (leitura) e `geography::STGeomFromText(@wkt, 4326)`
// (escrita). Aqui lidamos só com o lado WKT.
//
// Detalhes importantes:
// - Ordem das coordenadas em `geography`: `(longitude latitude)`.
// - `geography` exige orientação CCW (left-hand rule) no anel externo de polígonos.
//   Polígonos CW são interpretados como "tudo, exceto a área desenhada" — falha
//   na validação ou cria áreas absurdas. Por isso `pathToWktPolygon` orienta o
//   anel automaticamente.
// - LOCAL_GEO no banco pode estar como Point (legado), Polygon ou MultiPolygon.
//   O parser aceita Polygon e MultiPolygon. Para MultiPolygon retorna o anel
//   externo do primeiro polígono (mais que suficiente para a tela de cadastro).

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

function fmt(n: number): string {
  return Number.isFinite(n) ? n.toString() : '0';
}

// Shoelace: positivo = CCW quando x=lng, y=lat (consistente com `geography`).
export function signedAreaShoelace(path: LatLngLiteral[]): number {
  let sum = 0;
  const n = path.length;
  if (n < 3) return 0;
  for (let i = 0; i < n; i++) {
    const a = path[i];
    const b = path[(i + 1) % n];
    sum += a.lng * b.lat - b.lng * a.lat;
  }
  return sum / 2;
}

export function isCounterClockwise(path: LatLngLiteral[]): boolean {
  return signedAreaShoelace(path) > 0;
}

// Aceita o anel já com ou sem o ponto final repetido — normaliza internamente.
function normalizeRing(path: LatLngLiteral[]): LatLngLiteral[] {
  if (path.length === 0) return path;
  const first = path[0];
  const last = path[path.length - 1];
  if (first.lat === last.lat && first.lng === last.lng) {
    return path.slice(0, -1);
  }
  return path;
}

export function pathToWktPolygon(path: LatLngLiteral[]): string {
  const open = normalizeRing(path);
  if (open.length < 3) {
    throw new Error('Polígono precisa de ao menos 3 pontos');
  }
  const oriented = isCounterClockwise(open) ? open : [...open].reverse();
  const ring = oriented.map((p) => `${fmt(p.lng)} ${fmt(p.lat)}`);
  ring.push(ring[0]); // fecha o anel
  return `POLYGON((${ring.join(', ')}))`;
}

export function pathFromGoogleLatLngs(
  path: google.maps.LatLng[] | google.maps.MVCArray<google.maps.LatLng>,
): LatLngLiteral[] {
  const arr: google.maps.LatLng[] = Array.isArray(path)
    ? path
    : (path as google.maps.MVCArray<google.maps.LatLng>).getArray();
  return arr.map((p) => ({ lat: p.lat(), lng: p.lng() }));
}

function parseRing(inner: string): LatLngLiteral[] {
  return inner
    .split(/\s*,\s*/)
    .filter(Boolean)
    .map((pair) => {
      const [lngStr, latStr] = pair.trim().split(/\s+/);
      const lng = Number(lngStr);
      const lat = Number(latStr);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error(`Coordenada inválida no WKT: "${pair}"`);
      }
      return { lat, lng };
    });
}

// Retorna o anel externo de um POLYGON ou do primeiro polígono de um
// MULTIPOLYGON. Lança se a string não for nenhum dos dois.
export function parseWktPolygon(wkt: string): LatLngLiteral[] {
  const trimmed = wkt.trim();

  const polyMatch = /^POLYGON\s*\(\((.+)\)\)\s*$/i.exec(trimmed);
  if (polyMatch) {
    const outer = polyMatch[1].split(/\)\s*,\s*\(/)[0]; // descarta holes
    return parseRing(outer);
  }

  const multiMatch = /^MULTIPOLYGON\s*\(\((.+)\)\)\s*$/i.exec(trimmed);
  if (multiMatch) {
    // Estrutura: ((ring1),(ring2)),((ring3))...
    // Pegamos só o primeiro polígono (entre o primeiro `((` e o primeiro `))`)
    const firstPoly = /\(\(([^()]+)\)/.exec(multiMatch[1]);
    if (!firstPoly) {
      throw new Error('WKT MULTIPOLYGON inválido');
    }
    return parseRing(firstPoly[1]);
  }

  throw new Error('WKT POLYGON/MULTIPOLYGON inválido');
}

export function centroidOf(path: LatLngLiteral[]): LatLngLiteral {
  if (path.length === 0) return { lat: 0, lng: 0 };
  let lat = 0;
  let lng = 0;
  for (const p of path) {
    lat += p.lat;
    lng += p.lng;
  }
  return { lat: lat / path.length, lng: lng / path.length };
}
