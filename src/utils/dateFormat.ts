// Formata campos de data configuráveis: dia isolado, mês isolado (com
// 3 formatos possíveis), ano isolado, ou os 3 juntos. Também resolve
// o modo automático (pega a data de hoje em vez de pedir input).

import type { DateConfig } from '../types/template';

const MESES_NOME = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const MESES_ABREV = [
  'jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.',
  'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.',
];

export function formatMonth(monthNumber: number, format: DateConfig['monthFormat']): string {
  if (monthNumber < 1 || monthNumber > 12) return '';
  if (format === 'nome') return MESES_NOME[monthNumber - 1];
  if (format === 'abreviado') return MESES_ABREV[monthNumber - 1];
  return String(monthNumber).padStart(2, '0');
}

export const DEFAULT_DATE_CONFIG: DateConfig = {
  parts: ['dia', 'mes', 'ano'],
  monthFormat: 'numero',
  auto: false,
};

// Dado o valor bruto digitado (já mascarado, ex: "15/03/2026" ou "15"
// ou "3" pro mês) e a config, devolve o texto final que aparece no PDF.
export function formatDateValue(config: DateConfig, rawValue: string): string {
  const today = new Date();

  if (config.auto) {
    if (config.parts.length === 3) {
      return `${String(today.getDate()).padStart(2, '0')}/${formatMonth(
        today.getMonth() + 1,
        config.monthFormat
      )}/${today.getFullYear()}`;
    }
    if (config.parts[0] === 'dia') return String(today.getDate()).padStart(2, '0');
    if (config.parts[0] === 'mes') return formatMonth(today.getMonth() + 1, config.monthFormat);
    if (config.parts[0] === 'ano') return String(today.getFullYear());
    return '';
  }

  if (config.parts.length === 3) {
    const [dia, mes, ano] = rawValue.split('/');
    if (!dia || !mes || !ano) return rawValue;
    const mesFormatado = formatMonth(parseInt(mes, 10), config.monthFormat);
    return `${dia}/${mesFormatado}/${ano}`;
  }

  if (config.parts[0] === 'mes') {
    const n = parseInt(rawValue, 10);
    if (isNaN(n)) return rawValue;
    return formatMonth(n, config.monthFormat);
  }

  return rawValue;
}

export function placeholderForDateConfig(config: DateConfig): string {
  if (config.parts.length === 3) return 'DD/MM/AAAA';
  if (config.parts[0] === 'dia') return 'DD';
  if (config.parts[0] === 'ano') return 'AAAA';
  if (config.monthFormat === 'numero') return 'MM';
  return 'Ex: 3';
}