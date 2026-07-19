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

  setPdfSource: (uri: string, pageWidth: number, pageHeight: number) => void;
  setTemplateName: (name: string) => void;
  addField: (field: TemplateField) => void;
  updateField: (id: string, patch: Partial<TemplateField>) => void;
  deleteField: (id: string) => void;
  selectField: (id: string | null) => void;
  loadFromTemplate: (templateId: string, name: string, pdfUri: string, pageWidth: number, pageHeight: number, fields: TemplateField[]) => void;
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
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setPdfSource: (uri, pageWidth, pageHeight) =>
    set({ pdfUri: uri, pageWidth, pageHeight }),

  setTemplateName: (name) => set({ templateName: name }),

  addField: (field) =>
    set((state) => ({
      fields: [...state.fields, field],
      selectedFieldId: field.id, // já seleciona o campo recém-criado,
                                  // pra abrir o painel de propriedades dele
    })),

  updateField: (id, patch) =>
    set((state) => ({
      fields: state.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    })),

  deleteField: (id: string) =>
    set((state) => ({
        fields: state.fields.filter((f) => f.id !== id),
        selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
    })),

  selectField: (id) => set({ selectedFieldId: id }),

  loadFromTemplate: (templateId, name, pdfUri, pageWidth, pageHeight, fields) =>
    set({ templateId, templateName: name, pdfUri, pageWidth, pageHeight, fields }),

  reset: () => set(initialState),
}));