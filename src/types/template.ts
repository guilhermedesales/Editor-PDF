// Tipos centrais do app.

export type FieldType =
  | 'texto'
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

// Configuração específica de campos de data. Permite criar campos
// "fatiados" — ex: 3 campos separados pra "Rio de Janeiro, __ de
// _______ de 2026", um só com dia, outro só com mês (por extenso),
// outro só com ano (automático).
export interface DateConfig {
  parts: Array<'dia' | 'mes' | 'ano'>; // quais partes esse campo representa
  monthFormat: 'numero' | 'nome' | 'abreviado'; // só relevante se 'mes' estiver em parts
  auto: boolean; // se true, usa a data atual em vez de pedir input
}

// Configuração específica de campos do tipo 'valor'.
export interface ValorConfig {
  showSymbol: boolean; // se true, mostra "R$" antes do número
}

export interface TemplateField {
  id: string;
  internalName: string;
  type: FieldType;
  position: FieldPosition;
  style: FieldStyle;
  required: boolean;
  placeholder?: string;
  maxLines?: number;
  dateConfig?: DateConfig; // só usado quando type === 'data'
  valorConfig?: ValorConfig; // só usado quando type === 'valor'
  // quando type === 'valorPorExtenso', pode "puxar" o valor de outro
  // campo do tipo 'valor' em vez de pedir input próprio
  linkedValorFieldId?: string | null;
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
  autoIncrementCounter?: number;
}

export interface TemplateFillData {
  templateId: string;
  values: Record<string, string>;
}