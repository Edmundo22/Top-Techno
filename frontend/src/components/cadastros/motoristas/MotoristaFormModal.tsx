import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../ui/Modal';
import type { MotoristaDTO, MotoristaUpsertBody } from '../../../services/motoristasApi';
import { formatCpf, formatPhone, onlyDigits, onlyLettersAccents } from '../../../utils/masks';
import { logError } from '../../../utils/logger';

interface FormState {
  motorista: string;
  cnh: string;
  cpf: string; // exibição mascarada
  telfone: string; // exibição mascarada
  obs: string;
}

const EMPTY_FORM: FormState = { motorista: '', cnh: '', cpf: '', telfone: '', obs: '' };

interface MotoristaFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (motorista: MotoristaDTO) => void;
  initial: MotoristaDTO | null;
  submit: (body: MotoristaUpsertBody) => Promise<MotoristaDTO>;
}

export function MotoristaFormModal({
  open,
  onClose,
  onSaved,
  initial,
  submit,
}: MotoristaFormModalProps) {
  const isEdit = initial != null;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        motorista: initial.motorista ?? '',
        cnh: initial.cnh ?? '',
        cpf: formatCpf(initial.cpf ?? ''),
        telfone: formatPhone(initial.telfone ?? ''),
        obs: initial.obs ?? '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [open, initial]);

  const cnhDigits = onlyDigits(form.cnh);
  const cpfDigits = onlyDigits(form.cpf);
  const telDigits = onlyDigits(form.telfone);

  const cpfValid = cpfDigits.length === 0 || cpfDigits.length === 11;
  const telValid = telDigits.length === 0 || telDigits.length === 10 || telDigits.length === 11;

  const isValid = useMemo(
    () => form.motorista.trim().length > 0 && cnhDigits.length > 0 && cpfValid && telValid,
    [form.motorista, cnhDigits, cpfValid, telValid],
  );

  const handleSubmit = async () => {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      const motorista = await submit({
        motorista: form.motorista.trim(),
        cnh: cnhDigits,
        cpf: cpfDigits.length ? cpfDigits : null,
        telfone: telDigits.length ? telDigits : null,
        obs: form.obs.trim() ? form.obs.trim() : null,
      });
      onSaved(motorista);
    } catch (err) {
      logError('save motorista', err);
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : 'Falha ao salvar motorista.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={isEdit ? `Editar motorista — ${initial?.motorista ?? ''}` : 'Novo motorista'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || saving}>
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          label="Motorista *"
          name="motorista"
          value={form.motorista}
          onChange={(e) =>
            setForm((p) => ({ ...p, motorista: onlyLettersAccents(e.target.value) }))
          }
          placeholder="Nome do motorista"
          maxLength={120}
          autoComplete="off"
        />
        <Input
          label="CNH *"
          name="cnh"
          value={form.cnh}
          onChange={(e) => setForm((p) => ({ ...p, cnh: onlyDigits(e.target.value).slice(0, 20) }))}
          placeholder="Somente números"
          inputMode="numeric"
          autoComplete="off"
        />
        <Input
          label="CPF"
          name="cpf"
          value={form.cpf}
          onChange={(e) => setForm((p) => ({ ...p, cpf: formatCpf(e.target.value) }))}
          error={!cpfValid ? 'CPF deve ter 11 dígitos' : undefined}
          placeholder="000.000.000-00"
          inputMode="numeric"
          autoComplete="off"
        />
        <Input
          label="Telefone"
          name="telfone"
          value={form.telfone}
          onChange={(e) => setForm((p) => ({ ...p, telfone: formatPhone(e.target.value) }))}
          error={!telValid ? 'Telefone deve ter 10 ou 11 dígitos' : undefined}
          placeholder="(00) 00000-0000"
          inputMode="numeric"
          autoComplete="off"
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="obs" className="text-xs font-medium text-brand-ink-soft">
            Observação
          </label>
          <textarea
            id="obs"
            name="obs"
            value={form.obs}
            onChange={(e) => setForm((p) => ({ ...p, obs: e.target.value }))}
            maxLength={500}
            rows={3}
            className="rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink outline-none transition-colors placeholder:text-brand-ink-muted/70 focus:border-brand-accent"
            placeholder="Observações (opcional)"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
