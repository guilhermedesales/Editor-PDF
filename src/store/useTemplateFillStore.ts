import { create } from 'zustand';

type FillSession = {
  values: Record<string, string>;
  fileName?: string;
};

interface TemplateFillState {
  sessions: Record<string, FillSession>;
  getSession: (templateId: string) => FillSession | undefined;
  setValues: (templateId: string, values: Record<string, string>) => void;
  patchValue: (templateId: string, fieldId: string, value: string) => void;
  setFileName: (templateId: string, fileName: string) => void;
  clearSession: (templateId: string) => void;
}

export const useTemplateFillStore = create<TemplateFillState>((set, get) => ({
  sessions: {},

  getSession: (templateId) => get().sessions[templateId],

  setValues: (templateId, values) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [templateId]: { ...(state.sessions[templateId] ?? {}), values },
      },
    })),

  patchValue: (templateId, fieldId, value) =>
    set((state) => {
      const current = state.sessions[templateId] ?? { values: {} };
      return {
        sessions: {
          ...state.sessions,
          [templateId]: {
            ...current,
            values: { ...current.values, [fieldId]: value },
          },
        },
      };
    }),

  setFileName: (templateId, fileName) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [templateId]: { ...(state.sessions[templateId] ?? { values: {} }), fileName },
      },
    })),

  clearSession: (templateId) =>
    set((state) => {
      const { [templateId]: _removed, ...sessions } = state.sessions;
      return { sessions };
    }),
}));
