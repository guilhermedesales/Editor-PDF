// Camada de persistência das planilhas vinculadas a templates.
//
// Segue o mesmo padrão do templateStorage.ts: o JSON no AsyncStorage é
// a fonte da verdade (columns + rows). O arquivo .xlsx em disco é só
// uma "renderização" desse JSON — toda vez que uma linha é adicionada
// (ou a config de colunas muda), o workbook inteiro é regenerado a
// partir do JSON e o arquivo é sobrescrito. Isso evita ter que
// reabrir/editar um .xlsx existente, que é bem mais frágil.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { buildXlsxBase64 } from '../utils/xlsxBuilder';

const STORAGE_KEY = '@editorpdf:spreadsheets';
const SPREADSHEETS_DIR_NAME = 'template-spreadsheets';

export interface SpreadsheetColumn {
  id: string;
  label: string;
  fieldId: string | null; // null = coluna fixa (ex: "Data/Hora")
}

export interface SpreadsheetEntry {
  id: string;
  name: string;
  templateId: string; // vínculo 1:1 com o template
  uri: string; // arquivo .xlsx em disco
  columns: SpreadsheetColumn[];
  rows: Record<string, string>[];
  createdAt: number;
  updatedAt: number;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getSpreadsheetsDir(): Directory {
  const dir = new Directory(Paths.document, SPREADSHEETS_DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

async function writeXlsxFile(entry: SpreadsheetEntry): Promise<string> {
  const base64 = buildXlsxBase64(entry.columns, entry.rows, entry.name);
  const dir = getSpreadsheetsDir();
  const file = new File(dir, `${entry.id}.xlsx`);
  if (file.exists) file.delete();
  file.create();
  file.write(base64, { encoding: 'base64' } as any);
  return file.uri;
}

export async function getAllSpreadsheets(): Promise<SpreadsheetEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SpreadsheetEntry[];
  } catch (err) {
    console.warn('[spreadsheetsStorage] Storage corrompido, resetando:', err);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // se nem isso funcionar, não tem mais o que fazer por aqui
    }
    return [];
  }
}

export async function getSpreadsheetById(id: string): Promise<SpreadsheetEntry | undefined> {
  const all = await getAllSpreadsheets();
  return all.find((s) => s.id === id);
}

export async function getSpreadsheetByTemplateId(templateId: string): Promise<SpreadsheetEntry | undefined> {
  const all = await getAllSpreadsheets();
  return all.find((s) => s.templateId === templateId);
}

async function persistAll(list: SpreadsheetEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// Cria uma nova planilha vazia (config de colunas já definida pelo
// SpreadsheetLinkModal) vinculada a um template, e gera o .xlsx inicial.
export async function createSpreadsheet(
  name: string,
  templateId: string,
  columns: SpreadsheetColumn[]
): Promise<SpreadsheetEntry> {
  const now = Date.now();
  const entry: SpreadsheetEntry = {
    id: generateId(), name, templateId, uri: '', columns, rows: [], createdAt: now, updatedAt: now,
  };
  entry.uri = await writeXlsxFile(entry);

  const all = await getAllSpreadsheets();
  all.push(entry);
  await persistAll(all);
  return entry;
}

// Atualiza nome/colunas de uma planilha existente (usado ao editar o
// vínculo do template). Regenera o .xlsx pra refletir o novo cabeçalho,
// preservando as linhas já salvas (colunas removidas somem do arquivo,
// mas continuam nos dados brutos de cada linha até serem sobrescritas).
export async function updateSpreadsheetConfig(
  id: string,
  patch: { name?: string; columns?: SpreadsheetColumn[] }
): Promise<SpreadsheetEntry | undefined> {
  const all = await getAllSpreadsheets();
  const index = all.findIndex((s) => s.id === id);
  if (index < 0) return undefined;

  const updated: SpreadsheetEntry = { ...all[index], ...patch, updatedAt: Date.now() };
  updated.uri = await writeXlsxFile(updated);
  all[index] = updated;
  await persistAll(all);
  return updated;
}

// Adiciona uma linha nova (ex: ao preencher um template) e regenera o
// .xlsx com a linha incluída.
export async function appendSpreadsheetRow(
  id: string,
  values: Record<string, string>
): Promise<SpreadsheetEntry | undefined> {
  const all = await getAllSpreadsheets();
  const index = all.findIndex((s) => s.id === id);
  if (index < 0) return undefined;

  const updated: SpreadsheetEntry = {
    ...all[index], rows: [...all[index].rows, values], updatedAt: Date.now(),
  };
  updated.uri = await writeXlsxFile(updated);
  all[index] = updated;
  await persistAll(all);
  return updated;
}

export async function renameSpreadsheet(id: string, name: string): Promise<void> {
  await updateSpreadsheetConfig(id, { name });
}

export async function deleteSpreadsheet(id: string): Promise<void> {
  const all = await getAllSpreadsheets();
  const target = all.find((s) => s.id === id);

  if (target?.uri?.startsWith('file://')) {
    try {
      const file = new File(target.uri);
      if (file.exists) file.delete();
    } catch {
      // não crítico
    }
  }

  await persistAll(all.filter((s) => s.id !== id));
}