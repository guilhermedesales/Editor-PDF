// Funções de máscara aplicadas enquanto o usuário digita, na tela de
// Preencher. Todas recebem o texto bruto digitado e devolvem o texto
// já formatado — chamadas a cada onChangeText.

export function maskCPF(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function maskCNPJ(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return d
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

// Máscara de valor monetário: trata a digitação como centavos (igual
// campo de valor em app de banco). Digitar "15000" vira "150,00".
export function maskCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const cents = digits === '' ? 0 : parseInt(digits, 10);
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  const reaisFormatted = reais.toLocaleString('pt-BR');
  return `${reaisFormatted},${String(centavos).padStart(2, '0')}`;
}

// Máscara de data completa (todas as 3 partes no mesmo campo).
export function maskFullDate(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  return d
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
}

export function maskDayOrMonth(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 2);
}

export function maskYear(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 4);
}

export function applyMaskFor(
  type: 'cpf' | 'cnpj' | 'telefone' | 'valor',
  raw: string
): string {
  switch (type) {
    case 'cpf':
      return maskCPF(raw);
    case 'cnpj':
      return maskCNPJ(raw);
    case 'telefone':
      return maskPhone(raw);
    case 'valor':
      return maskCurrency(raw);
  }
}