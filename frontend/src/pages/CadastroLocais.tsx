import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PlusIcon, SearchIcon } from '../components/ui/icons';
import { LocaisTable } from '../components/cadastros/locais/LocaisTable';
import { LocalFormModal } from '../components/cadastros/locais/LocalFormModal';
import { MapaCadastroLocais } from '../components/cadastros/locais/MapaCadastroLocais';
import {
  ShowAllPoligonosCard,
  StatsCards,
} from '../components/cadastros/locais/StatsCards';
import { locaisApi, type LocalDTO } from '../services/locaisApi';
import { extractErrorMessage } from '../services/api';
import { logError, logSuccess } from '../utils/logger';

export function CadastroLocaisPage() {
  const [locais, setLocais] = useState<LocalDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);
  const [activePoligonoId, setActivePoligonoId] = useState<number | null>(null);
  const [showAllPoligonos, setShowAllPoligonos] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LocalDTO | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<LocalDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchLocais = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await locaisApi.list();
      setLocais(data);
      logSuccess('locais carregados', { total: data.length });
    } catch (err) {
      logError('list locais', err);
      setLoadError(extractErrorMessage(err, 'Falha ao carregar locais.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocais();
  }, [fetchLocais]);

  const handleToggleMarker = (id: number) =>
    setActiveMarkerId((prev) => (prev === id ? null : id));
  const handleTogglePoligono = (id: number) =>
    setActivePoligonoId((prev) => (prev === id ? null : id));

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (local: LocalDTO) => {
    setEditing(local);
    setShowForm(true);
  };

  const handleSaved = (local: LocalDTO) => {
    setLocais((prev) => {
      const exists = prev.some((l) => l.idLocal === local.idLocal);
      return exists
        ? prev.map((l) => (l.idLocal === local.idLocal ? local : l))
        : [local, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await locaisApi.remove(confirmDelete.idLocal);
      setLocais((prev) => prev.filter((l) => l.idLocal !== confirmDelete.idLocal));
      if (activeMarkerId === confirmDelete.idLocal) setActiveMarkerId(null);
      if (activePoligonoId === confirmDelete.idLocal) setActivePoligonoId(null);
      setConfirmDelete(null);
    } catch (err) {
      logError('delete local', err);
      setDeleteError(extractErrorMessage(err, 'Falha ao excluir local.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout title="Cadastros / Locais" subtitle="Gerenciamento de pontos físicos">
      <div className="flex flex-col gap-3 lg:h-[calc(100vh-140px)] lg:min-h-0">
        <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-card border border-brand-line bg-white px-4 py-3 shadow-card">
          <label className="relative flex items-center">
            <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-brand-ink-muted" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Filtro universal…"
              className="h-9 w-72 rounded-md border border-brand-line bg-white pl-9 pr-3 text-xs text-brand-ink outline-none placeholder:text-brand-ink-muted/70 transition-colors hover:border-brand-ink-soft focus:border-brand-accent"
            />
          </label>

          <StatsCards locais={locais} />

          {loadError && (
            <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700">
              {loadError}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <ShowAllPoligonosCard
              active={showAllPoligonos}
              onToggle={() => setShowAllPoligonos((v) => !v)}
            />
            <Button onClick={openCreate}>
              <PlusIcon className="h-4 w-4" />
              Novo local
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
          <div className="min-h-[60vh] flex-1 lg:min-h-0 lg:basis-3/5">
            <LocaisTable
              locais={locais}
              loading={loading}
              globalFilter={globalFilter}
              activeMarkerId={activeMarkerId}
              activePoligonoId={activePoligonoId}
              onToggleMarker={handleToggleMarker}
              onTogglePoligono={handleTogglePoligono}
              onEdit={openEdit}
              onDelete={(l) => {
                setDeleteError(null);
                setConfirmDelete(l);
              }}
            />
          </div>
          <div className="min-h-[320px] flex-1 lg:basis-2/5 lg:min-h-0">
            <MapaCadastroLocais
              locais={locais}
              activeMarkerId={activeMarkerId}
              activePoligonoId={activePoligonoId}
              showAllPoligonos={showAllPoligonos}
            />
          </div>
        </div>
      </div>

      <LocalFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        initial={editing}
        allLocais={locais}
        submit={(body) =>
          editing ? locaisApi.update(editing.idLocal, body) : locaisApi.create(body)
        }
      />

      <Modal
        open={confirmDelete != null}
        onClose={() => {
          if (!deleting) {
            setConfirmDelete(null);
            setDeleteError(null);
          }
        }}
        title="Excluir local"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              disabled={deleting}
              onClick={() => {
                setConfirmDelete(null);
                setDeleteError(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="!bg-red-600 !text-white hover:!bg-red-700"
            >
              {deleting ? 'Excluindo…' : 'Excluir'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-brand-ink">
          Tem certeza que deseja excluir o local{' '}
          <strong>{confirmDelete?.codigoPonto ?? `#${confirmDelete?.idLocal ?? ''}`}</strong>?
          Essa ação não pode ser desfeita.
        </p>
        {deleteError && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {deleteError}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
