import { useAuth } from '../../contexts/AuthContext';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-brand-line bg-white px-6">
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-medium uppercase tracking-wider text-brand-ink-muted">
          {subtitle ?? 'TOP TECHNO'}
        </span>
        <h1 className="text-lg font-semibold text-brand-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end leading-tight">
          <span className="text-sm font-medium text-brand-ink">{user?.usuario ?? '—'}</span>
          <span className="text-xs text-brand-ink-muted">{user?.email ?? ''}</span>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-accent-soft text-sm font-semibold text-brand-ink">
          {user?.usuario?.slice(0, 1).toUpperCase() ?? '?'}
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="ml-2 inline-flex h-9 items-center gap-2 rounded-lg border border-brand-line bg-white px-3 text-xs font-semibold text-brand-ink-soft transition-colors hover:border-brand-ink-muted hover:text-brand-ink"
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
          Sair
        </button>
      </div>
    </header>
  );
}
