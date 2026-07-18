// Paleta e tipografia centralizadas (baseado no style guide do app).
// Qualquer componente novo deve puxar cores daqui, nunca hardcodar hex
// direto na tela — isso evita inconsistência visual conforme o app cresce.

export const colors = {
  primary: '#2563EB',
  primaryLight: '#DBEAFE', // usado no fundo dos campos durante a edição
                           // do template, pra diferenciar "marcação" de
                           // "texto real"
  secondary: '#6B7280',
  tertiary: '#F5F5F5',
  neutral: '#111111',
  white: '#FFFFFF',
  danger: '#DC2626',
  border: '#E5E7EB',
};

export const typography = {
  fontFamily: 'Inter', // caso não tenha a fonte carregada ainda, cai no
                        // fallback padrão do sistema — carregar via
                        // expo-font é um passo opcional futuro
  headline: 32,
  body: 16,
  label: 14,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
};