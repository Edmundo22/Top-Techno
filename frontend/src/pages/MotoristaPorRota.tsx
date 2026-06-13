import { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PlusIcon, SearchIcon } from '../components/ui/icons';
import { MotoristasTable } from '../components/cadastros/motoristas/MotoristasTable';
import { MotoristaFormModal } from '../components/cadastros/motoristas/MotoristaFormModal';
import { motoristasApi, type MotoristaDTO } from '../services/motoristasApi';
import { extractErrorMessage } from '../services/api';
import { logError, logSuccess } from '../utils/logger';

export function MotoristaPorRotaPage() {
  const [motoristas, setMotoristas] = useState<MotoristaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MotoristaDTO | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MotoristaDTO | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchMotoristas = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await motoristasApi.list();
      setMotoristas(data);
      logSuccess('motoristas carregados', { total: data.length });
    } catch (err) {
      logError('list motoristas', err);
      setLoadError(extractErrorMessage(err, 'Falha ao carregar motoristas.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMotoristas();
  }, [fetchMotoristas]);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (motorista: MotoristaDTO) => {
    setEditing(motorista);
    setShowForm(true);
  };

  const handleSaved = (motorista: MotoristaDTO) => {
    setMotoristas((prev) => {
      const exists = prev.some((m) => m.idCadMot === motorista.idCadMot);
      return exists
        ? prev.map((m) => (m.idCadMot === motorista.idCadMot ? motorista : m))
        : [motorista, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await motoristasApi.remove(confirmDelete.idCadMot);
      setMotoristas((prev) => prev.filter((m) => m.idCadMot !== confirmDelete.idCadMot));
      logSuccess('motorista excluído', { idCadMot: confirmDelete.idCadMot });
      setConfirmDelete(null);
    } catch (err) {
      logError('delete motorista', err);
      setDeleteError(extractErrorMessage(err, 'Falha ao excluir motorista.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout
      title="Cadastros / Motorista por Rota"
      subtitle="Cadastro de motoristas e vínculo com rotas"
    >
      <div className="flex h-[calc(100vh-140px)] min-h-0 flex-col gap-3 lg:flex-row">
        {/* Coluna esquerda — CRUD de motoristas */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:basis-[45%]">
          <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-card border border-brand-line bg-white px-4 py-3 shadow-card">
            <label className="relative flex items-center">
              <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-brand-ink-muted" />
              <input
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Filtro universal…"
                className="h-9 w-56 rounded-md border border-brand-line bg-white pl-9 pr-3 text-xs text-brand-ink outline-none placeholder:text-brand-ink-muted/70 transition-colors hover:border-brand-ink-soft focus:border-brand-accent"
              />
            </label>

            {loadError && (
              <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-700">
                {loadError}
              </span>
            )}

            <div className="ml-auto">
              <Button onClick={openCreate}>
                <PlusIcon className="h-4 w-4" />
                Novo motorista
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <MotoristasTable
              motoristas={motoristas}
              loading={loading}
              globalFilter={globalFilter}
              onEdit={openEdit}
              onDelete={(m) => {
                setDeleteError(null);
                setConfirmDelete(m);
              }}
            />
          </div>
        </div>

        {/* Coluna direita — vínculo motorista↔rota (próximos commits) */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto lg:basis-[55%]">
          <div className="grid flex-1 place-items-center rounded-card border border-dashed border-brand-line bg-brand-line-soft/40 p-6 text-center text-sm text-brand-ink-muted">
            Selecione uma rota para gerenciar os motoristas vinculados.
          </div>
        </div>
      </div>

      <MotoristaFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
        initial={editing}
        submit={(body) =>
          editing ? motoristasApi.update(editing.idCadMot, body) : motoristasApi.create(body)
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
        title="Excluir motorista"
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
          Tem certeza que deseja excluir o motorista{' '}
          <strong>{confirmDelete?.motorista ?? `#${confirmDelete?.idCadMot ?? ''}`}</strong>? Essa
          ação não pode ser desfeita.
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
