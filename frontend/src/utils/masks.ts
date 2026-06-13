// Utilitários de máscara/saneamento de input — sem dependência externa.
// CPF, telefone e CNH são guardados só com dígitos no banco; a máscara é
// apenas apresentação (formata no onChange, envia onlyDigits no submit).

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

// Mantém só letras (com acentos), espaço, apóstrofo e ponto — nomes de pessoa.
export function onlyLettersAccents(value: string): string {
  return value.replace(/[^A-Za-zÀ-ÿ\s'.]/g, '');
}

// 000.000.000-00 (progressivo conforme digita; ignora além de 11 dígitos).
export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
}

// (00) 00000-0000 (celular, 11 dígitos) ou (00) 0000-0000 (fixo, 10).
export function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
