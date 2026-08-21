import type { CalculationConfig, TemplateField } from '../types/template';

export function parseNumericValue(raw: string): number | null {
  const normalized = raw.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  if (!normalized.trim()) return null;
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

export function formatCalculatedValue(value: number | null, format: CalculationConfig['format'] = 'numero'): string {
  if (value === null || !Number.isFinite(value)) return '';
  if (format === 'moeda') return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (format === 'porcentagem') return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

export function resolveCalculatedField(
  field: TemplateField,
  values: Record<string, string>,
  allFields: TemplateField[]
): string {
  const config = field.calculationConfig;
  if (!config?.leftFieldId || !config?.rightFieldId) return '';
  const leftField = allFields.find((f) => f.id === config.leftFieldId);
  const rightField = allFields.find((f) => f.id === config.rightFieldId);
  const left = parseNumericValue(leftField ? values[leftField.id] ?? '' : '');
  const right = parseNumericValue(rightField ? values[rightField.id] ?? '' : '');
  if (left === null || right === null) return '';
  let result: number | null = null;
  if (config.operation === 'soma') result = left + right;
  if (config.operation === 'subtracao') result = left - right;
  if (config.operation === 'multiplicacao') result = left * right;
  if (config.operation === 'divisao') result = right === 0 ? null : left / right;
  if (config.operation === 'porcentagem') result = left - (left * right) / 100;
  return formatCalculatedValue(result, config.format);
}
