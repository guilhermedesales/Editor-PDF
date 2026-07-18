// Camada de persistência dos templates.
//
// IMPORTANTE: o AsyncStorage no Android usa SQLite por baixo, que tem
// um limite de ~2MB por LINHA (erro "Row too big to fit into
// CursorWindow"). Guardar imagem em base64 dentro do JSON estourava
// esse limite. A imagem agora vai para um arquivo real em disco e o
// AsyncStorage guarda só o caminho (file://...).
//
// getAllTemplates() também está protegido contra o CENÁRIO DE
// RECUPERAÇÃO: se ainda existir uma linha antiga grande demais (de uma
// tentativa de salvamento anterior que travou no meio), o getItem em si
// lança esse erro nativo — não dá pra simplesmente dar catch no
// JSON.parse, o erro acontece antes disso. Nesse caso, resetamos o
// storage automaticamente em vez de deixar o app travado pra sempre.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import type { Template } from '../types/template';

const STORAGE_KEY = '@editorpdf:templates';
const IMAGES_DIR_NAME = 'template-images';

function getImagesDir(): Directory {
  const dir = new Directory(Paths.document, IMAGES_DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

async function persistImageIfNeeded(pdfUri: string, templateId: string): Promise<string> {
  if (!pdfUri.startsWith('data:')) {
    return pdfUri;
  }

  const match = pdfUri.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return pdfUri;

  const [, ext, base64Data] = match;
  const dir = getImagesDir();
  const file = new File(dir, `${templateId}.${ext}`);
  if (file.exists) file.delete();
  file.create();
  file.write(base64Data, { encoding: 'base64' } as any);
  return file.uri;
}

export async function getAllTemplates(): Promise<Template[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Template[];
  } catch (err) {
    // Isso acontece quando existe uma linha antiga grande demais presa
    // no SQLite (de um salvamento que travou no meio, antes da migração
    // pra arquivo). Não tem como "consertar" essa linha — ela já é
    // grande demais pro Android nem conseguir LER. A única saída segura
    // é resetar essa chave, senão o app trava pra sempre no boot.
    console.warn('[templateStorage] Storage corrompido, resetando:', err);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // se nem isso funcionar, não tem mais o que fazer por aqui
    }
    return [];
  }
}

export async function getTemplateById(id: string): Promise<Template | undefined> {
  const templates = await getAllTemplates();
  return templates.find((t) => t.id === id);
}

export async function saveTemplate(template: Template): Promise<void> {
  const persistedUri = await persistImageIfNeeded(template.pdfUri, template.id);
  const templateToSave: Template = { ...template, pdfUri: persistedUri };

  const templates = await getAllTemplates();
  const index = templates.findIndex((t) => t.id === templateToSave.id);

  if (index >= 0) {
    const oldUri = templates[index].pdfUri;
    if (oldUri && oldUri !== persistedUri && oldUri.startsWith('file://')) {
      try {
        const oldFile = new File(oldUri);
        if (oldFile.exists) oldFile.delete();
      } catch {
        // não crítico
      }
    }
    templates[index] = templateToSave;
  } else {
    templates.push(templateToSave);
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export async function deleteTemplate(id: string): Promise<void> {
  const templates = await getAllTemplates();
  const target = templates.find((t) => t.id === id);

  if (target?.pdfUri?.startsWith('file://')) {
    try {
      const file = new File(target.pdfUri);
      if (file.exists) file.delete();
    } catch {
      // ignora
    }
  }

  const filtered = templates.filter((t) => t.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// Função de emergência: limpa TODOS os templates e imagens salvas.
// Útil pra debug ou como botão de "resetar dados" nas Configurações.
export async function resetAllTemplates(): Promise<void> {
  try {
    const dir = getImagesDir();
    if (dir.exists) dir.delete();
  } catch {
    // ignora
  }
  await AsyncStorage.removeItem(STORAGE_KEY);
}