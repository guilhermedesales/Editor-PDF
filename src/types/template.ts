// Tipos centrais do app.

export type FieldType =
  | 'texto'
  | 'textoFixo'
  | 'numero'
  | 'valor'
  | 'valorPorExtenso'
  | 'numeroPorExtenso'
  | 'autoIncremento'
  | 'data'
  | 'hora'
  | 'cpf'
  | 'cnpj'
  | 'telefone'
  | 'textoMultilinha';

export interface FieldPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FieldStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
}

export interface DateConfig {
  parts: Array<'dia' | 'mes' | 'ano'>;
  monthFormat: 'numero' | 'nome' | 'abreviado';
  yearFormat?: 'completo' | 'doisDigitos';
  auto: boolean;
}

export interface ValorConfig {
  showSymbol: boolean;
}

// Configuração de numeração automática: quantos dígitos (1 = "1", "2",
// 2 = "01", "02", 4 = "0001", "0002"...) e a partir de qual número
// começar a contagem.
export interface AutoIncrementConfig {
  digits: number;
  startAt: number;
}

export interface TemplateField {
  id: string;
  internalName: string;
  type: FieldType;
  position: FieldPosition;
  style: FieldStyle;
  required: boolean;
  placeholder?: string;
  defaultText?: string;
  maxLines?: number;
  dateConfig?: DateConfig;
  valorConfig?: ValorConfig;
  linkedValorFieldId?: string | null;
  autoIncrementConfig?: AutoIncrementConfig;
}

export interface Template {
  id: string;
  name: string;
  pdfUri: string;
  pageWidth: number;
  pageHeight: number;
  fields: TemplateField[];
  createdAt: number;
  updatedAt: number;
  autoIncrementCounter?: number; // próximo número "cru" (sem formatação) a usar
}

export interface TemplateFillData {
  templateId: string;
  values: Record<string, string>;
}