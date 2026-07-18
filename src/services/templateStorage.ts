// Camada de persistência dos templates. Isolar isso num service (em vez
// de chamar AsyncStorage direto nas telas) significa que, se um dia
// trocarmos AsyncStorage por SQLite (recomendável quando os templates
// tiverem muitos campos/PDFs grandes), só este arquivo muda.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Template } from '../types/template';

const STORAGE_KEY = '@editorpdf:templates';

// Lê todos os templates salvos. Retorna [] se ainda não existir nada
// (primeiro uso do app) em vez de deixar o JSON.parse quebrar.
export async function getAllTemplates(): Promise<Template[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Template[];
  } catch {
    // Se o JSON salvo corromper por algum motivo, não travamos o app —
    // voltamos pra lista vazia em vez de propagar o erro pra tela inicial.
    return [];
  }
}

export async function getTemplateById(id: string): Promise<Template | undefined> {
  const templates = await getAllTemplates();
  return templates.find((t) => t.id === id);
}

// Salva (cria ou atualiza) um template. Como guardamos a lista inteira
// serializada, sempre lemos tudo, alteramos em memória e regravamos —
// simples e suficiente para a escala esperada (dezenas de templates).
export async function saveTemplate(template: Template): Promise<void> {
  const templates = await getAllTemplates();
  const index = templates.findIndex((t) => t.id === template.id);

  if (index >= 0) {
    templates[index] = template;
  } else {
    templates.push(template);
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export async function deleteTemplate(id: string): Promise<void> {
  const templates = await getAllTemplates();
  const filtered = templates.filter((t) => t.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}