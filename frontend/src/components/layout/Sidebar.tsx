import { NavLink } from 'react-router-dom';
import { useState } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: JSX.Element;
}

const items: NavItem[] = [
  {
    to: '/monitoramento',
    label: 'Monitoramento',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M4 14l4-4 4 4 8-8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 6h6v6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/historico',
    label: 'Histórico',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M12 8v5l3 2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 12a8.5 8.5 0 1 0 2.5-6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 4v4h4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex h-full shrink-0 flex-col bg-brand-ink text-white transition-[width] duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-accent text-sm font-bold text-brand-ink">
          TT
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">TOP TECHNO</span>
            <span className="text-[11px] text-white/60">Sistema interno</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="flex flex-col gap-1 px-2">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `group flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-brand-accent text-brand-ink'
                      : 'text-white/75 hover:bg-white/5 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                end
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex h-11 items-center gap-3 border-t border-white/10 px-4 text-xs font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={`h-4 w-4 shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path
            d="M15 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {!collapsed && <span>Recolher</span>}
      </button>
    </aside>
  );
}
