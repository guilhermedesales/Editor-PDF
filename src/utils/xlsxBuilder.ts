// Monta um workbook .xlsx (uma única aba) a partir de colunas + linhas
// e devolve o conteúdo já em base64, pronto pra escrever em disco com
// expo-file-system. Usa a SheetJS (xlsx), que é pure JS — não exige
// módulo nativo, então funciona no Expo Go.

import * as XLSX from 'xlsx';
import type { SpreadsheetColumn } from '../services/spreadsheetsStorage';

export function buildXlsxBase64(
  columns: SpreadsheetColumn[],
  rows: Record<string, string>[],
  sheetName = 'Dados'
): string {
  const header = columns.map((c) => c.label);
  const data = rows.map((row) => columns.map((c) => row[c.id] ?? ''));

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);
  const workbook = XLSX.utils.book_new();

  // Nome da aba não pode passar de 31 caracteres nem ter certos
  // caracteres especiais — corta e sanitiza pra não quebrar o SheetJS.
  const safeSheetName = sheetName.replace(/[\\/*?:[\]]/g, '').slice(0, 31) || 'Dados';
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  return XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
}