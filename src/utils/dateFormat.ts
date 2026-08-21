// Formata campos de data configuráveis: dia isolado, mês isolado (com
// 3 formatos possíveis), ano isolado, ou os 3 juntos. Também resolve
// o modo automático (pega a data de hoje em vez de pedir input).

import type { DateConfig } from '../types/template';

export const MESES_NOME = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
export const MESES_ABREV = [
  'jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.',
  'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.',
];

export const MONTH_OPTIONS = MESES_NOME.map((label, index) => ({ label, value: String(index + 1).padStart(2, '0') }));

function formatYear(year: string, config: DateConfig): string {
  if ((config.yearFormat ?? 'completo') !== 'doisDigitos') return year;
  return year.length >= 2 ? year.slice(-2) : year;
}

export function formatMonth(monthNumber: number, format: DateConfig['monthFormat']): string {
  if (monthNumber < 1 || monthNumber > 12) return '';
  if (format === 'nome') return MESES_NOME[monthNumber - 1];
  if (format === 'abreviado') return MESES_ABREV[monthNumber - 1];
  return String(monthNumber).padStart(2, '0');
}

export const DEFAULT_DATE_CONFIG: DateConfig = {
  parts: ['dia', 'mes', 'ano'],
  monthFormat: 'numero',
  yearFormat: 'completo',
  auto: false,
};

export function rawValueFromDate(config: DateConfig, date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  if (config.parts.length === 3) return `${day}/${month}/${year}`;
  if (config.parts[0] === 'dia') return day;
  if (config.parts[0] === 'mes') return month;
  if (config.parts[0] === 'ano') return year;
  return '';
}

// Dado o valor bruto digitado (já mascarado, ex: "15/03/2026" ou "15"
// ou "3" pro mês) e a config, devolve o texto final que aparece no PDF.
export function formatDateValue(config: DateConfig, rawValue: string): string {
  const effectiveRawValue = config.auto && !rawValue ? rawValueFromDate(config) : rawValue;

  if (config.parts.length === 3) {
    const [dia, mes, ano] = effectiveRawValue.split('/');
    if (!dia || !mes || !ano) return effectiveRawValue;
    const mesFormatado = formatMonth(parseInt(mes, 10), config.monthFormat);
    return `${dia}/${mesFormatado}/${formatYear(ano, config)}`;
  }

  if (config.parts[0] === 'mes') {
    const n = parseInt(effectiveRawValue, 10);
    if (isNaN(n)) return effectiveRawValue;
    return formatMonth(n, config.monthFormat);
  }

  if (config.parts[0] === 'ano') return formatYear(effectiveRawValue, config);

  return effectiveRawValue;
}

export function placeholderForDateConfig(config: DateConfig): string {
  if (config.parts.length === 3) return 'DD/MM/AAAA';
  if (config.parts[0] === 'dia') return 'DD';
  if (config.parts[0] === 'ano') return (config.yearFormat ?? 'completo') === 'doisDigitos' ? 'AA' : 'AAAA';
  if (config.monthFormat === 'numero') return 'MM';
  return 'Ex: 3';
}