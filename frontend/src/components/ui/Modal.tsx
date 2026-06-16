import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CollapseIcon, ExpandIcon } from './icons';

type ModalSize = 'md' | 'lg' | 'xl';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: ModalSize;
  footer?: ReactNode;
}

const sizeClasses: Record<ModalSize, string> = {
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-6xl',
};

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Cada abertura começa em modo janela.
  useEffect(() => {
    if (!open) setFullscreen(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const firstInput = contentRef.current?.querySelector<HTMLElement>(
      'input, textarea, select, button',
    );
    firstInput?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40 ${
        fullscreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={contentRef}
        className={`flex flex-col overflow-hidden bg-brand-surface shadow-float ${
          fullscreen
            ? 'h-full max-h-screen w-full max-w-none rounded-none'
            : `max-h-[92vh] w-full ${sizeClasses[size]} rounded-card`
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-brand-line px-3 sm:px-5">
          <h2 className="min-w-0 truncate text-sm font-semibold text-brand-ink sm:text-base">
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? 'Restaurar tamanho' : 'Tela cheia'}
              title={fullscreen ? 'Restaurar tamanho' : 'Tela cheia'}
              className="grid h-8 w-8 place-items-center rounded-lg text-brand-ink-muted transition-colors hover:bg-brand-line-soft"
            >
              {fullscreen ? (
                <CollapseIcon className="h-4 w-4" />
              ) : (
                <ExpandIcon className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="grid h-8 w-8 place-items-center rounded-lg text-brand-ink-muted transition-colors hover:bg-brand-line-soft"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-5">{children}</div>
        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-brand-line bg-brand-line-soft px-4 py-3 sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
