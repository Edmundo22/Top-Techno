import { useState, type JSX } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface NavLeaf {
  to: string;
  label: string;
  icon?: JSX.Element;
}

interface NavGroup {
  key: string;
  label: string;
  icon: JSX.Element;
  children: NavLeaf[];
}

interface NavLink_ {
  kind: 'link';
  to: string;
  label: string;
  icon: JSX.Element;
}

interface NavGroup_ {
  kind: 'group';
  group: NavGroup;
}

type NavItem = NavLink_ | NavGroup_;

const items: NavItem[] = [
  {
    kind: 'link',
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
    kind: 'link',
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
  {
    kind: 'group',
    group: {
      key: 'cadastros',
      label: 'Cadastros',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <path
            d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      children: [
        { to: '/cadastros/locais', label: 'Locais' },
        { to: '/cadastros/motorista-por-rota', label: 'Motorista por Rota' },
      ],
    },
  },
];

const linkBase =
  'group flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors';
const linkInactive = 'text-white/75 hover:bg-white/5 hover:text-white';
const linkActive = 'bg-brand-accent text-brand-ink';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const initialGroupOpen: Record<string, boolean> = {};
  for (const it of items) {
    if (it.kind === 'group') {
      initialGroupOpen[it.group.key] = it.group.children.some((c) =>
        location.pathname.startsWith(c.to),
      );
    }
  }
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>(initialGroupOpen);

  const toggleGroup = (key: string) =>
    setGroupOpen((prev) => ({ ...prev, [key]: !prev[key] }));

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
          {items.map((item) => {
            if (item.kind === 'link') {
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `${linkBase} ${isActive ? linkActive : linkInactive} ${
                        collapsed ? 'justify-center' : ''
                      }`
                    }
                    end
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </NavLink>
                </li>
              );
            }

            const g = item.group;
            const isOpen = groupOpen[g.key] ?? false;
            const anyChildActive = g.children.some((c) => location.pathname.startsWith(c.to));

            if (collapsed) {
              return (
                <li key={g.key}>
                  <NavLink
                    to={g.children[0]?.to ?? '#'}
                    className={`${linkBase} justify-center ${
                      anyChildActive ? linkActive : linkInactive
                    }`}
                    title={g.label}
                  >
                    <span className="shrink-0">{g.icon}</span>
                  </NavLink>
                </li>
              );
            }

            return (
              <li key={g.key} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => toggleGroup(g.key)}
                  className={`${linkBase} w-full text-left ${
                    anyChildActive ? 'text-white' : linkInactive
                  }`}
                  aria-expanded={isOpen}
                >
                  <span className="shrink-0">{g.icon}</span>
                  <span className="flex-1 font-medium">{g.label}</span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    aria-hidden
                  >
                    <path
                      d="M9 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {isOpen && (
                  <ul className="mt-1 flex flex-col gap-1 pl-9">
                    {g.children.map((child) => (
                      <li key={child.to}>
                        <NavLink
                          to={child.to}
                          className={({ isActive }) =>
                            `flex h-8 items-center rounded-lg px-3 text-sm transition-colors ${
                              isActive ? linkActive : linkInactive
                            }`
                          }
                          end
                        >
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
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
