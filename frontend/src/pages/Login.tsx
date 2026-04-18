import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { extractErrorMessage } from '../services/api';

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) {
    return <Navigate to="/monitoramento" replace />;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(usuario.trim(), senha);
      navigate('/monitoramento', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Não foi possível entrar.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-brand-surface lg:grid-cols-[1.1fr_1fr]">
      <div className="hidden flex-col justify-between bg-brand-ink p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-accent text-sm font-bold text-brand-ink">
            TT
          </div>
          <span className="text-base font-semibold tracking-wide">TOP TECHNO</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Gestão de entregas <span className="text-brand-accent">em tempo real</span>.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Desenhe rotas, acompanhe a frota no mapa e veja o que já foi entregue — tudo num só painel.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-white/50">
          <span>© TOP TECHNO Logística</span>
          <span>·</span>
          <span>Acesso restrito à operação</span>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-6 rounded-2xl border border-brand-line bg-white p-8 shadow-card"
        >
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-accent-soft px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-brand-ink">
              Central de operações
            </span>
            <h1 className="text-xl font-semibold text-brand-ink">Entrar no painel logístico</h1>
            <p className="text-sm text-brand-ink-muted">
              Use seu usuário e senha para acompanhar rotas e entregas da frota.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Usuário"
              name="usuario"
              autoComplete="username"
              autoFocus
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="seu.usuario"
            />
            <Input
              label="Senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
