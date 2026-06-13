import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { PencilIcon, TrashIcon } from '../../ui/icons';
import type { MotoristaDTO } from '../../../services/motoristasApi';
import { formatCpf, formatPhone } from '../../../utils/masks';

type SortDir = 'asc' | 'desc';
type ColumnKey = 'motorista' | 'cnh' | 'cpf' | 'telfone' | 'obs';

interface SortState {
  col: ColumnKey;
  dir: SortDir;
}

interface ColumnDef {
  key: ColumnKey;
  label: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'motorista', label: 'Motorista' },
  { key: 'cnh', label: 'CNH' },
  { key: 'cpf', label: 'CPF' },
  { key: 'telfone', label: 'Telefone' },
  { key: 'obs', label: 'Observação' },
];

// Texto exibido por coluna (CPF/telefone formatados via máscara).
function displayValue(row: MotoristaDTO, col: ColumnKey): string {
  const v = row[col];
  if (v == null) return '';
  if (col === 'cpf') return formatCpf(v);
  if (col === 'telfone') return formatPhone(v);
  return String(v);
}

function compare(a: MotoristaDTO, b: MotoristaDTO, col: ColumnKey, dir: SortDir): number {
  const av = displayValue(a, col);
  const bv = displayValue(b, col);
  let cmp: number;
  if (av === '' && bv === '') cmp = 0;
  else if (av === '') cmp = -1;
  else if (bv === '') cmp = 1;
  else cmp = av.localeCompare(bv, 'pt-BR', { sensitivity: 'base', numeric: true });
  return dir === 'asc' ? cmp : -cmp;
}

interface MotoristasTableProps {
  motoristas: MotoristaDTO[];
  loading: boolean;
  globalFilter: string;
  onEdit: (motorista: MotoristaDTO) => void;
  onDelete: (motorista: MotoristaDTO) => void;
}

export function MotoristasTable({
  motoristas,
  loading,
  globalFilter,
  onEdit,
  onDelete,
}: MotoristasTableProps) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [colFilters, setColFilters] = useState<Record<ColumnKey, string>>({
    motorista: '',
    cnh: '',
    cpf: '',
    telfone: '',
    obs: '',
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
    return motoristas.filter((row) => {
      if (g) {
        const haystack = COLUMNS.map((c) => displayValue(row, c.key).toLowerCase()).join(' ');
        if (!haystack.includes(g)) return false;
      }
      for (const c of COLUMNS) {
        const f = colFilters[c.key].trim().toLowerCase();
        if (f && !displayValue(row, c.key).toLowerCase().includes(f)) return false;
      }
      return true;
    });
  }, [motoristas, globalFilter, colFilters]);

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
                  className="select-none border-b border-brand-line px-3 py-2 text-left font-semibold text-brand-ink"
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
                  Nenhum motorista encontrado.
                </td>
              </tr>
            )}
            {sorted.map((row) => (
              <tr key={row.idCadMot} className="hover:bg-brand-line-soft">
                {COLUMNS.map((c) => (
                  <td
                    key={c.key}
                    className="border-b border-brand-line px-3 py-1.5 text-left text-brand-ink"
                  >
                    {displayValue(row, c.key)}
                  </td>
                ))}
                <td className="border-b border-brand-line px-2 py-1 text-center">
                  <div className="inline-flex items-center gap-1">
                    <IconButton label="Editar" onClick={() => onEdit(row)}>
                      <PencilIcon className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label="Excluir"
                      onClick={() => onDelete(row)}
                      className="hover:bg-red-50 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex h-9 shrink-0 items-center justify-between border-t border-brand-line bg-brand-line-soft px-3 text-[11px] text-brand-ink-muted">
        <span>{sorted.length} resultado(s)</span>
        <span>{motoristas.length} total</span>
      </div>
    </div>
  );
}

interface IconButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

function IconButton({ label, onClick, children, className = '' }: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-md text-brand-ink-soft transition-colors hover:bg-brand-line hover:text-brand-ink ${className}`}
    >
      {children}
    </button>
  );
}
