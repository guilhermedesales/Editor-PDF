import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type FillSession = {
  values: Record<string, string>;
  fileName?: string;
  updatedAt?: number;
};

interface TemplateFillState {
  sessions: Record<string, FillSession>;
  getSession: (templateId: string) => FillSession | undefined;
  loadSession: (templateId: string) => Promise<FillSession | undefined>;
  setValues: (templateId: string, values: Record<string, string>) => void;
  patchValue: (templateId: string, fieldId: string, value: string) => void;
  setFileName: (templateId: string, fileName: string) => void;
  clearSession: (templateId: string) => Promise<void>;
}

const STORAGE_KEY = '@pdfstudio:template_fill_drafts';

type SessionMap = Record<string, FillSession>;

async function readDrafts(): Promise<SessionMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as SessionMap : {};
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    return {};
  }
}

async function writeDrafts(sessions: SessionMap) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)).catch(() => {});
}

export const useTemplateFillStore = create<TemplateFillState>((set, get) => ({
  sessions: {},

  getSession: (templateId) => get().sessions[templateId],

  loadSession: async (templateId) => {
    const drafts = await readDrafts();
    set((state) => ({ sessions: { ...drafts, ...state.sessions } }));
    return drafts[templateId] ?? get().sessions[templateId];
  },

  setValues: (templateId, values) =>
    set((state) => {
      const next = {
        ...state.sessions,
        [templateId]: { ...(state.sessions[templateId] ?? {}), values, updatedAt: Date.now() },
      };
      writeDrafts(next);
      return { sessions: next };
    }),

  patchValue: (templateId, fieldId, value) =>
    set((state) => {
      const current = state.sessions[templateId] ?? { values: {} };
      const next = {
        ...state.sessions,
        [templateId]: {
          ...current,
          values: { ...current.values, [fieldId]: value },
          updatedAt: Date.now(),
        },
      };
      writeDrafts(next);
      return { sessions: next };
    }),

  setFileName: (templateId, fileName) =>
    set((state) => {
      const next = {
        ...state.sessions,
        [templateId]: { ...(state.sessions[templateId] ?? { values: {} }), fileName, updatedAt: Date.now() },
      };
      writeDrafts(next);
      return { sessions: next };
    }),

  clearSession: async (templateId) => {
    const { [templateId]: _removed, ...sessions } = get().sessions;
    set({ sessions });
    await writeDrafts(sessions);
  },
}));
