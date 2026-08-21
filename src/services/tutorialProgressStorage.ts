import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@pdfstudio:tutorial_progress';

export type TutorialStatus = 'completed' | 'skipped';

async function readProgress(): Promise<Record<string, TutorialStatus>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as Record<string, TutorialStatus> : {};
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    return {};
  }
}

export async function shouldShowTutorial(id: string): Promise<boolean> {
  const progress = await readProgress();
  return !progress[id];
}

export async function markTutorial(id: string, status: TutorialStatus): Promise<void> {
  const progress = await readProgress();
  progress[id] = status;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export async function resetTutorial(id: string): Promise<void> {
  const progress = await readProgress();
  delete progress[id];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
