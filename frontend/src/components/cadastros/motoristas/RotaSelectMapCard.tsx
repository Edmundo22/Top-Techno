import { Card } from '../../ui/Card';
import type { RotaFtDTO } from '../../../services/motoristaRotaApi';
import { MapaRota } from './MapaRota';

interface RotaSelectMapCardProps {
  rotas: RotaFtDTO[];
  loading: boolean;
  selectedIdFt: number | null;
  onSelect: (idFt: number | null) => void;
}

function rotaLabel(r: RotaFtDTO): string {
  const linha = r.numeroLinha?.trim() || '—';
  const ft = r.numeroFt?.trim() || String(r.idFt);
  return `Linha ${linha} — FT ${ft}`;
}

export function RotaSelectMapCard({
  rotas,
  loading,
  selectedIdFt,
  onSelect,
}: RotaSelectMapCardProps) {
  const selected = rotas.find((r) => r.idFt === selectedIdFt) ?? null;
  const semTracado = selected != null && !selected.polyline;

  return (
    <Card className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rota-select" className="text-xs font-medium text-brand-ink-soft">
          Rota
        </label>
        <select
          id="rota-select"
          value={selectedIdFt ?? ''}
          onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
          disabled={loading}
          className="h-10 rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none transition-colors focus:border-brand-accent disabled:opacity-60"
        >
          <option value="">{loading ? 'Carregando rotas…' : 'Selecione uma rota'}</option>
          {rotas.map((r) => (
            <option key={r.idFt} value={r.idFt}>
              {rotaLabel(r)}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1">
        {semTracado ? (
          <div className="grid h-full place-items-center rounded-card border border-dashed border-brand-line bg-brand-line-soft/40 text-xs text-brand-ink-muted">
            Esta rota não tem traçado cadastrado.
          </div>
        ) : (
          <MapaRota polyline={selected?.polyline ?? null} />
        )}
      </div>
    </Card>
  );
}
