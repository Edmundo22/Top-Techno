import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';

const kpis = [
  { label: 'Operações ativas', hint: 'Em tempo real' },
  { label: 'Alertas abertos', hint: 'Últimas 24h' },
  { label: 'Disponibilidade', hint: 'Média 7 dias' },
  { label: 'Processos críticos', hint: 'Atualmente' },
];

export function MonitoramentoPage() {
  return (
    <AppLayout title="Monitoramento" subtitle="Operação">
      <div className="flex flex-col gap-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-brand-ink-muted">
                {kpi.label}
              </span>
              <span className="text-3xl font-semibold text-brand-ink">—</span>
              <span className="text-xs text-brand-ink-muted">{kpi.hint}</span>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-ink">Visão geral</h2>
              <span className="text-xs text-brand-ink-muted">Sem dados</span>
            </div>
            <div className="mt-6 flex h-56 items-center justify-center rounded-lg border border-dashed border-brand-line bg-brand-line-soft text-xs text-brand-ink-muted">
              Espaço reservado para gráfico operacional
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-ink">Últimos eventos</h2>
              <span className="text-xs text-brand-ink-muted">Sem registros</span>
            </div>
            <ul className="mt-4 flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-brand-line-soft bg-brand-line-soft/40 px-3 py-2"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-brand-accent" aria-hidden />
                  <span className="flex-1 text-xs text-brand-ink-soft">—</span>
                  <span className="text-[11px] text-brand-ink-muted">--:--</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
