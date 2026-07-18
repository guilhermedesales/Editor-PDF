// Camada de persistência dos arquivos PDF conhecidos pelo app (gerados
// pelas ferramentas ou importados manualmente). Segue o mesmo padrão
// do templateStorage.ts: metadados no AsyncStorage, arquivo real em disco.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';

const STORAGE_KEY = '@editorpdf:pdf_files';

export interface PdfFileEntry {
  id: string;
  name: string;
  uri: string;
  size: number;
  pages?: number;
  favorite?: boolean;
  thumbnailUri?: string;
  createdAt: number;
  updatedAt: number;
}

export async function getAllPdfFiles(): Promise<PdfFileEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PdfFileEntry[];
  } catch (err) {
    console.warn('[pdfFilesStorage] Storage corrompido, resetando:', err);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // se nem isso funcionar, não tem mais o que fazer por aqui
    }
    return [];
  }
}

export async function registerPdfFile(entry: PdfFileEntry): Promise<void> {
  const files = await getAllPdfFiles();
  const index = files.findIndex((f) => f.id === entry.id);

  if (index >= 0) {
    files[index] = { ...files[index], ...entry };
  } else {
    files.push(entry);
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

export async function toggleFavoritePdf(id: string): Promise<PdfFileEntry[]> {
  const files = await getAllPdfFiles();
  const updated = files.map((f) =>
    f.id === id ? { ...f, favorite: !f.favorite, updatedAt: Date.now() } : f
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function renamePdfFile(id: string, name: string): Promise<void> {
  const files = await getAllPdfFiles();
  const updated = files.map((f) => (f.id === id ? { ...f, name, updatedAt: Date.now() } : f));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function deletePdfFile(id: string): Promise<void> {
  const files = await getAllPdfFiles();
  const target = files.find((f) => f.id === id);

  if (target?.uri?.startsWith('file://')) {
    try {
      const file = new File(target.uri);
      if (file.exists) file.delete();
    } catch {
      // não crítico
    }
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(files.filter((f) => f.id !== id)));
}