// Guarda, por documento (chave = uri do arquivo), a última página lida,
// e as preferências globais de leitura: tema de cor e brilho (aplicado
// como overlay escuro sobre o conteúdo, já que não há módulo nativo de
// brilho de tela no Expo Go).

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@editorpdf:reading_progress';
const THEME_KEY = '@editorpdf:reading_theme';
const BRIGHTNESS_KEY = '@editorpdf:reading_brightness';

export type ReadingTheme = 'claro' | 'sepia' | 'escuro';

interface ProgressMap {
  [uri: string]: { page: number; updatedAt: number };
}

export async function getLastPage(uri: string): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map: ProgressMap = JSON.parse(raw);
    return map[uri]?.page ?? null;
  } catch {
    return null;
  }
}

export async function saveLastPage(uri: string, page: number): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const map: ProgressMap = raw ? JSON.parse(raw) : {};
    map[uri] = { page, updatedAt: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // não crítico — só significa que não vai lembrar a página dessa vez
  }
}

export async function getReadingTheme(): Promise<ReadingTheme> {
  try {
    const raw = await AsyncStorage.getItem(THEME_KEY);
    if (raw === 'claro' || raw === 'sepia' || raw === 'escuro') return raw;
    return 'claro';
  } catch {
    return 'claro';
  }
}

export async function saveReadingTheme(theme: ReadingTheme): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch {
    // não crítico
  }
}

// Brilho vai de 0.3 (bem escurecido) a 1 (sem overlay nenhum).
export async function getBrightness(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(BRIGHTNESS_KEY);
    const n = raw ? parseFloat(raw) : 1;
    if (isNaN(n)) return 1;
    return Math.min(Math.max(n, 0.3), 1);
  } catch {
    return 1;
  }
}

export async function saveBrightness(value: number): Promise<void> {
  try {
    await AsyncStorage.setItem(BRIGHTNESS_KEY, String(value));
  } catch {
    // não crítico
  }
}