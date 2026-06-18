import { forwardRef, useImperativeHandle, useRef } from 'react';
import { RouteIcon } from '../ui/icons';
import type { FilterCardHandle } from './PlacasFilterCard';

interface LinhasFilterCardProps {
  linhas: string[];
  selectedLinhas: string[];
  onToggleLinha: (linha: string) => void;
  /** Cor de cada linha selecionada (paleta da página). Pinta o pill ativo para
   *  casar visualmente com a placa correspondente. */
  colorByLinha?: Map<string, string>;
}

export const LinhasFilterCard = forwardRef<FilterCardHandle, LinhasFilterCardProps>(
  function LinhasFilterCard({ linhas, selectedLinhas, onToggleLinha, colorByLinha }, ref) {
    const listRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

    useImperativeHandle(ref, () => ({
      scrollToItem: (value: string) => {
        const el = itemRefs.current.get(value);
        const container = listRef.current;
        if (!el || !container) return;
        const top = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2;
        container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      },
    }));

    const selectedCount = linhas.filter((l) => selectedLinhas.includes(l)).length;

    return (
      <section className="flex h-full min-h-0 flex-col gap-2 rounded-card border border-brand-line bg-white p-2 shadow-card">
        <header className="flex items-center justify-between gap-2 px-1 pt-0.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-ink-soft">
            <RouteIcon className="h-3.5 w-3.5" />
            Linhas
          </span>
          <span className="flex items-center gap-1">
            {selectedCount > 0 && (
              <span className="rounded-full bg-brand-accent px-1.5 py-px text-[10px] font-bold tabular-nums text-brand-ink">
                {selectedCount} sel.
              </span>
            )}
            <span className="rounded-full bg-brand-line-soft px-1.5 py-px text-[10px] font-bold tabular-nums text-brand-ink">
              {linhas.length}
            </span>
          </span>
        </header>
        <div ref={listRef} className="relative flex flex-col gap-1.5 overflow-y-auto pr-0.5">
          {linhas.length === 0 ? (
            <span className="px-1 py-2 text-[11px] text-brand-ink-muted">
              Nenhuma linha
            </span>
          ) : (
            linhas.map((linha) => {
              const active = selectedLinhas.includes(linha);
              const color = active ? colorByLinha?.get(linha) : undefined;
              return (
                <button
                  key={linha}
                  ref={(el) => {
                    if (el) itemRefs.current.set(linha, el);
                    else itemRefs.current.delete(linha);
                  }}
                  type="button"
                  onClick={() => onToggleLinha(linha)}
                  aria-pressed={active}
                  style={
                    color ? { backgroundColor: color, borderColor: color, color: '#ffffff' } : undefined
                  }
                  className={`rounded-full border px-2 py-1 text-[11px] font-semibold tabular-nums transition-colors ${
                    active
                      ? color
                        ? 'hover:opacity-90'
                        : 'border-brand-accent bg-brand-accent text-brand-ink hover:bg-brand-accent-hover'
                      : 'border-brand-line bg-brand-surface text-brand-ink hover:border-brand-ink-soft hover:bg-brand-line-soft'
                  }`}
                >
                  {linha}
                </button>
              );
            })
          )}
        </div>
      </section>
    );
  },
);
