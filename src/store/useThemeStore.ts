// Estado global de tema (claro/escuro), persistido em AsyncStorage.
// Diferente do resto do app (que hoje importa `colors` estático de
// constants/theme.ts), telas com dark mode chamam useThemeStore() e
// usam `colors` daqui — assim dá pra migrar tela por tela sem quebrar
// as que ainda não foram atualizadas.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export interface ColorPalette {
  primary: string;
  primaryLight: string;
  secondary: string;
  tertiary: string;
  neutral: string;
  white: string; // usado como cor de "superfície" (cards, sheets)
  danger: string;
  border: string;
  background: string;
}

const LIGHT: ColorPalette = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  secondary: '#6B7280',
  tertiary: '#F5F5F5',
  neutral: '#111111',
  white: '#FFFFFF',
  danger: '#DC2626',
  border: '#E5E7EB',
  background: '#FFFFFF',
};

const DARK: ColorPalette = {
  primary: '#3B82F6',
  primaryLight: '#1E3A5F',
  secondary: '#9CA3AF',
  tertiary: '#1E1E20',
  neutral: '#F2F2F2',
  white: '#1C1C1E', // "superfície" no escuro é um cinza-escuro, não branco
  danger: '#F87171',
  border: '#2E2E30',
  background: '#0F0F10',
};

interface ThemeState {
  mode: ThemeMode;
  colors: ColorPalette;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const STORAGE_KEY = '@editorpdf:theme_mode';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  colors: LIGHT,
  hydrated: false,

  setMode: (mode) => {
    set({ mode, colors: mode === 'dark' ? DARK : LIGHT });
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {
      // não crítico — só significa que a preferência não persiste
    });
  },

  toggle: () => get().setMode(get().mode === 'dark' ? 'light' : 'dark'),
}));

// Chamado uma vez, no boot do App (ver App.tsx), pra recuperar a
// preferência salva antes de a interface ser exibida.
export async function hydrateThemeStore() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      useThemeStore.getState().setMode(saved);
    }
  } finally {
    useThemeStore.setState({ hydrated: true });
  }
}