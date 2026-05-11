import { useMemo, useState, type ChangeEvent } from 'react';
import { HexIcon, PencilIcon, PinIcon, TrashIcon } from '../../ui/icons';
import type { LocalDTO } from '../../../services/locaisApi';

type SortDir = 'asc' | 'desc';
type ColumnKey = 'codigoPonto' | 'endereco' | 'latitude' | 'longitude' | 'raio' | 'pontoParada';

interface SortState {
  col: ColumnKey;
  dir: SortDir;
}

interface ColumnDef {
  key: ColumnKey;
  label: string;
  align?: 'left' | 'right';
  width?: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'codigoPonto', label: 'Código' },
  { key: 'endereco', label: 'Endereço' },
  { key: 'latitude', label: 'Latitude', align: 'right' },
  { key: 'longitude', label: 'Longitude', align: 'right' },
  { key: 'raio', label: 'Raio (m)', align: 'right' },
  { key: 'pontoParada', label: 'Ponto de Parada' },
];

interface LocaisTableProps {
  locais: LocalDTO[];
  loading: boolean;
  globalFilter: string;
  activeMarkerId: number | null;
  activePoligonoId: number | null;
  onToggleMarker: (id: number) => void;
  onTogglePoligono: (id: number) => void;
  onEdit: (local: LocalDTO) => void;
  onDelete: (local: LocalDTO) => void;
}

function asText(v: string | number | null | undefined): string {
  if (v == null) return '';
  return String(v);
}

function compare(a: LocalDTO, b: LocalDTO, col: ColumnKey, dir: SortDir): number {
  const av = a[col];
  const bv = b[col];
  let cmp: number;
  if (av == null && bv == null) cmp = 0;
  else if (av == null) cmp = -1;
  else if (bv == null) cmp = 1;
  else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
  else cmp = String(av).localeCompare(String(bv), 'pt-BR', { sensitivity: 'base' });
  return dir === 'asc' ? cmp : -cmp;
}

export function LocaisTable({
  locais,
  loading,
  globalFilter,
  activeMarkerId,
  activePoligonoId,
  onToggleMarker,
  onTogglePoligono,
  onEdit,
  onDelete,
}: LocaisTableProps) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [colFilters, setColFilters] = useState<Record<ColumnKey, string>>({
    codigoPonto: '',
    endereco: '',
    latitude: '',
    longitude: '',
    raio: '',
    pontoParada: '',
  });

  const handleSort = (col: ColumnKey) => {
    setSort((prev) => {
      if (!prev || prev.col !== col) return { col, dir: 'asc' };
      if (prev.dir === 'asc') return { col, dir: 'desc' };
      return null;
    });
  };

  const handleFilterChange = (col: ColumnKey) => (e: ChangeEvent<HTMLInputElement>) => {
    setColFilters((prev) => ({ ...prev, [col]: e.target.value }));
  };

  const filtered = useMemo(() => {
    const g = globalFilter.trim().toLowerCase();
    return locais.filter((row) => {
      if (g) {
        const haystack = COLUMNS.map((c) => asText(row[c.key]).toLowerCase()).join(' ');
        if (!haystack.includes(g)) return false;
      }
      for (const c of COLUMNS) {
        const f = colFilters[c.key].trim().toLowerCase();
        if (f && !asText(row[c.key]).toLowerCase().includes(f)) return false;
      }
      return true;
    });
  }, [locais, globalFilter, colFilters]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => compare(a, b, sort.col, sort.dir));
    return arr;
  }, [filtered, sort]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-card border border-brand-line bg-white shadow-card">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-brand-line-soft">
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`select-none border-b border-brand-line px-3 py-2 text-${
                    c.align ?? 'left'
                  } font-semibold text-brand-ink`}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(c.key)}
                    className="inline-flex items-center gap-1 hover:text-brand-ink"
                  >
                    <span>{c.label}</span>
                    <span aria-hidden className="text-brand-ink-muted">
                      {sort?.col === c.key ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </button>
                </th>
              ))}
              <th
                scope="col"
                className="border-b border-brand-line px-3 py-2 text-center font-semibold text-brand-ink"
              >
                Ações
              </th>
            </tr>
            <tr>
              {COLUMNS.map((c) => (
                <th key={`f-${c.key}`} className="border-b border-brand-line bg-white px-2 py-1">
                  <input
                    type="text"
                    value={colFilters[c.key]}
                    onChange={handleFilterChange(c.key)}
                    placeholder="filtrar"
                    className="h-7 w-full rounded-md border border-brand-line bg-white px-2 text-[11px] text-brand-ink outline-none placeholder:text-brand-ink-muted/70 transition-colors hover:border-brand-ink-soft focus:border-brand-accent"
                  />
                </th>
              ))}
              <th className="border-b border-brand-line bg-white" />
            </tr>
          </thead>
          <tbody>
            {loading && sorted.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length + 1}
                  className="px-3 py-8 text-center text-brand-ink-muted"
                >
                  Carregando…
                </td>
              </tr>
            )}
            {!loading && sorted.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length + 1}
                  className="px-3 py-8 text-center text-brand-ink-muted"
                >
                  Nenhum local encontrado.
                </td>
              </tr>
            )}
            {sorted.map((row) => {
              const markerActive = activeMarkerId === row.idLocal;
              const poligonoActive = activePoligonoId === row.idLocal;
              const hasPoligono = !!row.poligonoWkt;
              return (
                <tr key={row.idLocal} className="hover:bg-brand-line-soft">
                  {COLUMNS.map((c) => (
                    <td
                      key={c.key}
                      className={`border-b border-brand-line px-3 py-1.5 text-${
                        c.align ?? 'left'
                      } text-brand-ink`}
                    >
                      {asText(row[c.key])}
                    </td>
                  ))}
                  <td className="border-b border-brand-line px-2 py-1 text-center">
                    <div className="inline-flex items-center gap-1">
                      <IconButton
                        label="Mostrar marker + raio"
                        active={markerActive}
                        onClick={() => onToggleMarker(row.idLocal)}
                        activeClassName="bg-red-100 text-red-700 ring-1 ring-red-300"
                      >
                        <PinIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label={hasPoligono ? 'Mostrar polígono' : 'Sem polígono cadastrado'}
                        active={poligonoActive}
                        disabled={!hasPoligono}
                        onClick={() => onTogglePoligono(row.idLocal)}
                        activeClassName="bg-red-100 text-red-700 ring-1 ring-red-300"
                      >
                        <HexIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label="Editar"
                        onClick={() => onEdit(row)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label="Excluir"
                        onClick={() => onDelete(row)}
                        activeClassName=""
                        className="hover:bg-red-50 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex h-9 shrink-0 items-center justify-between border-t border-brand-line bg-brand-line-soft px-3 text-[11px] text-brand-ink-muted">
        <span>{sorted.length} resultado(s)</span>
        <span>{locais.length} total</span>
      </div>
    </div>
  );
}

interface IconButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeClassName?: string;
  className?: string;
}

function IconButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
  activeClassName = 'bg-brand-accent text-brand-ink ring-1 ring-brand-accent-hover',
  className = '',
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-md text-brand-ink-soft transition-colors hover:bg-brand-line hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? activeClassName : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}
