// Camada de I/O compartilhada pelas ferramentas de PDF: importar um
// PDF existente (registrando no gerenciador de arquivos) e salvar um
// PDF recém-gerado (merge, conversão, split, compactação).

import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { PDFDocument } from 'pdf-lib';
import { registerPdfFile } from './pdfFilesStorage';

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function countPages(bytes: Uint8Array): Promise<number | undefined> {
  try {
    const doc = await PDFDocument.load(bytes);
    return doc.getPageCount();
  } catch {
    return undefined;
  }
}

// Abre o seletor de arquivos, copia o PDF escolhido pra pasta gerenciada
// do app e registra no pdfFilesStorage — assim ele passa a aparecer na
// aba Arquivos.
export async function pickAndImportPdf(): Promise<{ id: string; uri: string; name: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
  if (result.canceled) return null;

  const asset = result.assets[0];
  const id = generateId();
  const destFile = new File(Paths.document, `${id}.pdf`);
  const bytes = await new File(asset.uri).bytes();
  destFile.create();
  destFile.write(bytes);

  const name = asset.name.replace(/\.pdf$/i, '');
  await registerPdfFile({
    id, name, uri: destFile.uri, size: bytes.byteLength,
    pages: await countPages(bytes), createdAt: Date.now(), updatedAt: Date.now(),
  });

  return { id, uri: destFile.uri, name };
}

// Usado pelas ferramentas que só precisam LER vários PDFs temporariamente
// (ex: Juntar PDFs) sem necessariamente importar cada um pra pasta
// gerenciada — só o resultado final é que vira um arquivo registrado.
export async function pickMultiplePdfs(): Promise<{ uri: string; name: string }[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf', multiple: true, copyToCacheDirectory: true,
  });
  if (result.canceled) return [];
  return result.assets.map((a) => ({ uri: a.uri, name: a.name }));
}

// Salva bytes de um PDF gerado pelo app (merge, conversão, split,
// compactação) em disco e registra no pdfFilesStorage.
export async function saveGeneratedPdf(bytes: Uint8Array, name: string): Promise<{ id: string; uri: string }> {
  const id = generateId();
  const file = new File(Paths.document, `${id}.pdf`);
  file.create();
  file.write(bytes);

  await registerPdfFile({
    id, name, uri: file.uri, size: bytes.byteLength,
    pages: await countPages(bytes), createdAt: Date.now(), updatedAt: Date.now(),
  });

  return { id, uri: file.uri };
}