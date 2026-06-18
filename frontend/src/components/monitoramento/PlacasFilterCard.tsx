import { forwardRef, useImperativeHandle, useRef } from 'react';
import { CarIcon, EyeIcon } from '../ui/icons';

export interface FilterCardHandle {
  /** Centraliza o item (placa) na rolagem do card. */
  scrollToItem: (value: string) => void;
}

interface PlacasFilterCardProps {
  placas: string[];
  selectedPlacas: string[];
  onTogglePlaca: (placa: string) => void;
  /** Subconjunto das placas selecionadas em que o usuário ligou o botão
   *  "Mostrar posições". Opcional — quando ausente, o botão de olho não
   *  aparece (tela Histórico não tem essa feature). */
  selectedPosicoesPlacas?: string[];
  onTogglePosicoes?: (placa: string) => void;
  /** Cor de cada placa selecionada (paleta da página). Quando presente, pinta
   *  o pill ativo para casar visualmente com a linha correspondente. */
  colorByPlaca?: Map<string, string>;
}

export const PlacasFilterCard = forwardRef<FilterCardHandle, PlacasFilterCardProps>(
  function PlacasFilterCard(
    { placas, selectedPlacas, onTogglePlaca, selectedPosicoesPlacas, onTogglePosicoes, colorByPlaca },
    ref,
  ) {
    const listRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

    useImperativeHandle(ref, () => ({
      scrollToItem: (value: string) => {
        const el = itemRefs.current.get(value);
        const container = listRef.current;
        if (!el || !container) return;
        // Centraliza dentro do próprio container (sem mexer no scroll da página).
        // Funciona tanto na lista vertical (lg) quanto no strip horizontal (mobile).
        const top = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2;
        const left = el.offsetLeft - container.clientWidth / 2 + el.offsetWidth / 2;
        container.scrollTo({
          top: Math.max(0, top),
          left: Math.max(0, left),
          behavior: 'smooth',
        });
      },
    }));

    const selectedCount = placas.filter((p) => selectedPlacas.includes(p)).length;

    return (
      <section className="flex min-h-0 flex-col gap-2 rounded-card border border-brand-line bg-white p-2 shadow-card lg:h-full">
        <header className="flex items-center justify-between gap-2 px-1 pt-0.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-ink-soft">
            <CarIcon className="h-3.5 w-3.5" />
            Placas
          </span>
          <span className="flex items-center gap-1">
            {selectedCount > 0 && (
              <span className="rounded-full bg-brand-accent px-1.5 py-px text-[10px] font-bold tabular-nums text-brand-ink">
                {selectedCount} sel.
              </span>
            )}
            <span className="rounded-full bg-brand-line-soft px-1.5 py-px text-[10px] font-bold tabular-nums text-brand-ink">
              {placas.length}
            </span>
          </span>
        </header>
        <div
          ref={listRef}
          className="relative flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0 lg:pr-0.5"
        >
          {placas.length === 0 ? (
            <span className="px-1 py-2 text-[11px] text-brand-ink-muted">
              Nenhuma placa
            </span>
          ) : (
            placas.map((placa) => {
              const active = selectedPlacas.includes(placa);
              const color = active ? colorByPlaca?.get(placa) : undefined;
              const posicoesActive =
                selectedPosicoesPlacas?.includes(placa) ?? false;
              const showPosicoesButton = active && onTogglePosicoes != null;
              return (
                <div
                  key={placa}
                  ref={(el) => {
                    if (el) itemRefs.current.set(placa, el);
                    else itemRefs.current.delete(placa);
                  }}
                  className="flex shrink-0 items-stretch gap-1 lg:shrink"
                >
                  <button
                    type="button"
                    onClick={() => onTogglePlaca(placa)}
                    aria-pressed={active}
                    style={
                      color ? { backgroundColor: color, borderColor: color, color: '#ffffff' } : undefined
                    }
                    className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums transition-colors lg:min-w-0 lg:flex-1 lg:truncate ${
                      active
                        ? color
                          ? 'hover:opacity-90'
                          : 'border-brand-accent bg-brand-accent text-brand-ink hover:bg-brand-accent-hover'
                        : 'border-brand-line bg-brand-surface text-brand-ink hover:border-brand-ink-soft hover:bg-brand-line-soft'
                    }`}
                  >
                    {placa}
                  </button>
                  {showPosicoesButton && (
                    <button
                      type="button"
                      onClick={() => onTogglePosicoes(placa)}
                      aria-pressed={posicoesActive}
                      title={
                        posicoesActive ? 'Ocultar posições' : 'Mostrar posições'
                      }
                      className={`flex shrink-0 items-center justify-center rounded-full border px-1.5 transition-colors ${
                        posicoesActive
                          ? 'border-brand-ink bg-brand-ink text-white hover:bg-brand-ink-soft'
                          : 'border-brand-line bg-brand-surface text-brand-ink-soft hover:bg-brand-line-soft hover:text-brand-ink'
                      }`}
                    >
                      <EyeIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    );
  },
);
