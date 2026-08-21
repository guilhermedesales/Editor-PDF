// Estado global do editor de template (zustand). Fica fora das telas
// porque tanto a tela do editor quanto futuros modais de "propriedades
// do campo" (Image 8 do mockup) precisam ler/escrever nesses dados sem
// prop-drilling.

import { create } from 'zustand';
import type { TemplateField } from '../types/template';

interface EditorState {
  templateId: string | null;
  templateName: string;
  pdfUri: string | null;
  pageWidth: number; // em pontos de PDF
  pageHeight: number;
  fields: TemplateField[];
  selectedFieldId: string | null;
  selectedFieldIds: string[];
  pastFields: TemplateField[][];
  futureFields: TemplateField[][];

  setPdfSource: (uri: string, pageWidth: number, pageHeight: number) => void;
  setTemplateName: (name: string) => void;
  addField: (field: TemplateField) => void;
  updateField: (id: string, patch: Partial<TemplateField>) => void;
  updateFields: (updater: (fields: TemplateField[]) => TemplateField[]) => void;
  deleteField: (id: string) => void;
  selectField: (id: string | null) => void;
  toggleFieldSelection: (id: string) => void;
  clearSelection: () => void;
  loadFromTemplate: (templateId: string, name: string, pdfUri: string, pageWidth: number, pageHeight: number, fields: TemplateField[]) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

const initialState = {
  templateId: null,
  templateName: '',
  pdfUri: null,
  pageWidth: 0,
  pageHeight: 0,
  fields: [],
  selectedFieldId: null,
  selectedFieldIds: [],
  pastFields: [],
  futureFields: [],
};

function sameFields(a: TemplateField[], b: TemplateField[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function pushHistory(state: EditorState, nextFields: TemplateField[]) {
  if (sameFields(state.fields, nextFields)) return { fields: state.fields };
  return {
    fields: nextFields,
    pastFields: [...state.pastFields, state.fields].slice(-50),
    futureFields: [],
  };
}

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setPdfSource: (uri, pageWidth, pageHeight) =>
    set({ pdfUri: uri, pageWidth, pageHeight }),

  setTemplateName: (name) => set({ templateName: name }),

  addField: (field) =>
    set((state) => ({
      ...pushHistory(state, [...state.fields, field]),
      selectedFieldId: field.id,
      selectedFieldIds: [field.id], // já seleciona o campo recém-criado,
                                  // pra abrir o painel de propriedades dele
    })),

  updateField: (id, patch) =>
    set((state) => pushHistory(state, state.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)))),

  updateFields: (updater) =>
    set((state) => pushHistory(state, updater(state.fields))),

  deleteField: (id: string) =>
    set((state) => ({
        ...pushHistory(state, state.fields.filter((f) => f.id !== id)),
        selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
        selectedFieldIds: state.selectedFieldIds.filter((selectedId) => selectedId !== id),
    })),

  selectField: (id) => set({ selectedFieldId: id, selectedFieldIds: id ? [id] : [] }),

  toggleFieldSelection: (id) =>
    set((state) => {
      const selected = state.selectedFieldIds.includes(id)
        ? state.selectedFieldIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedFieldIds, id];
      return { selectedFieldIds: selected, selectedFieldId: selected[selected.length - 1] ?? null };
    }),

  clearSelection: () => set({ selectedFieldId: null, selectedFieldIds: [] }),

  loadFromTemplate: (templateId, name, pdfUri, pageWidth, pageHeight, fields) =>
    set({ templateId, templateName: name, pdfUri, pageWidth, pageHeight, fields, selectedFieldId: null, selectedFieldIds: [], pastFields: [], futureFields: [] }),

  undo: () =>
    set((state) => {
      const previous = state.pastFields[state.pastFields.length - 1];
      if (!previous) return state;
      return {
        fields: previous,
        pastFields: state.pastFields.slice(0, -1),
        futureFields: [state.fields, ...state.futureFields],
        selectedFieldId: previous.some((f) => f.id === state.selectedFieldId) ? state.selectedFieldId : null,
        selectedFieldIds: state.selectedFieldIds.filter((id) => previous.some((f) => f.id === id)),
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.futureFields[0];
      if (!next) return state;
      return {
        fields: next,
        pastFields: [...state.pastFields, state.fields].slice(-50),
        futureFields: state.futureFields.slice(1),
        selectedFieldId: next.some((f) => f.id === state.selectedFieldId) ? state.selectedFieldId : null,
        selectedFieldIds: state.selectedFieldIds.filter((id) => next.some((f) => f.id === id)),
      };
    }),

  reset: () => set(initialState),
}));