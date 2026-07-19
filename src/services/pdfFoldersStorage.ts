// Camada de persistência das pastas da aba Arquivos. Cada pasta tem
// nome, cor e ícone customizáveis (estilo "pasta de livros", "pasta de
// contratos" etc). Os arquivos referenciam a pasta via folderId
// (ver ajuste em pdfFilesStorage.ts).

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@editorpdf:pdf_folders';

export interface PdfFolderEntry {
  id: string;
  name: string;
  color: string; // hex
  icon: string; // chave do FOLDER_ICON_MAP (ver FolderEditorModal.tsx)
  createdAt: number;
  updatedAt: number;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function getAllFolders(): Promise<PdfFolderEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PdfFolderEntry[];
  } catch (err) {
    console.warn('[pdfFoldersStorage] Storage corrompido, resetando:', err);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // se nem isso funcionar, não tem mais o que fazer por aqui
    }
    return [];
  }
}

export async function createFolder(name: string, color: string, icon: string): Promise<PdfFolderEntry> {
  const folders = await getAllFolders();
  const now = Date.now();
  const folder: PdfFolderEntry = { id: generateId(), name, color, icon, createdAt: now, updatedAt: now };
  folders.push(folder);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  return folder;
}

export async function updateFolder(id: string, patch: Partial<Pick<PdfFolderEntry, 'name' | 'color' | 'icon'>>): Promise<void> {
  const folders = await getAllFolders();
  const updated = folders.map((f) => (f.id === id ? { ...f, ...patch, updatedAt: Date.now() } : f));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function deleteFolder(id: string): Promise<void> {
  const folders = await getAllFolders();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(folders.filter((f) => f.id !== id)));
}