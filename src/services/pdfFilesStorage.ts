// Registro dos PDFs "conhecidos" pelo app: os gerados via Preencher
// Template (ver TemplateFillScreen) mais quaisquer arquivos importados
// manualmente. É deliberadamente simples — só metadado + favorito —
// porque o conteúdo real do PDF já vive em disco (Paths.cache/document);
// aqui a gente só guarda o caminho e informações de exibição.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@editorpdf:pdf_files';

export interface PdfFileEntry {
  id: string;
  name: string;
  uri: string;
  size: number;
  pages?: number;
  thumbnailUri?: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export async function getAllPdfFiles(): Promise<PdfFileEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PdfFileEntry[];
  } catch {
    return [];
  }
}

export async function registerPdfFile(entry: Omit<PdfFileEntry, 'favorite'>): Promise<void> {
  const files = await getAllPdfFiles();
  const index = files.findIndex((f) => f.id === entry.id);
  const toSave: PdfFileEntry = { ...entry, favorite: index >= 0 ? files[index].favorite : false };
  if (index >= 0) files[index] = toSave;
  else files.push(toSave);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

export async function toggleFavoritePdf(id: string): Promise<PdfFileEntry[]> {
  const files = await getAllPdfFiles();
  const updated = files.map((f) => (f.id === id ? { ...f, favorite: !f.favorite } : f));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function removePdfFile(id: string): Promise<void> {
  const files = await getAllPdfFiles();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(files.filter((f) => f.id !== id)));
}