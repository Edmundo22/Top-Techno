import { useAuth } from '../../contexts/AuthContext';
import { MenuIcon } from '../ui/icons';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onOpenNav: () => void;
}

export function Topbar({ title, subtitle, onOpenNav }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-brand-line bg-white px-3 sm:gap-3 sm:px-6">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Abrir menu"
        className="-ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-lg text-brand-ink-soft transition-colors hover:bg-brand-line-soft active:bg-brand-line lg:hidden"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[11px] font-medium uppercase tracking-wider text-brand-ink-muted sm:text-xs">
          {subtitle ?? 'TOP TECHNO'}
        </span>
        <h1 className="truncate text-base font-semibold text-brand-ink sm:text-lg">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden flex-col items-end leading-tight sm:flex">
          <span className="text-sm font-medium text-brand-ink">{user?.usuario ?? '—'}</span>
          <span className="max-w-[180px] truncate text-xs text-brand-ink-muted">
            {user?.email ?? ''}
          </span>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-accent-soft text-sm font-semibold text-brand-ink">
          {user?.usuario?.slice(0, 1).toUpperCase() ?? '?'}
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          aria-label="Sair"
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-brand-line bg-white px-2.5 text-xs font-semibold text-brand-ink-soft transition-colors hover:border-brand-ink-muted hover:text-brand-ink sm:px-3"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
            <path
              d="M15 17l5-5-5-5M20 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
