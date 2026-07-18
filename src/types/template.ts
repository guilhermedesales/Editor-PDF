// Tipos centrais do app. Tudo que envolve um "Template" ou um "Campo"
// passa por aqui — mantendo isso centralizado evita bugs de forma
// diferente representada em cada tela.

// Tipos de campo suportados no MVP. Adicionar um novo tipo = adicionar
// aqui + tratar a formatação/máscara dele no FieldRenderer (fill mode).
export type FieldType =
  | 'texto'
  | 'numero'
  | 'valor'
  | 'valorPorExtenso'
  | 'data'
  | 'hora'
  | 'cpf'
  | 'cnpj'
  | 'telefone'
  | 'textoMultilinha';

// Posição e tamanho são armazenados em PONTOS DE PDF (não pixels de tela).
// Motivo: o PDF tem um tamanho fixo em pontos (ex: A4 = 595x842pt),
// independente da resolução do celular. Se guardássemos em pixels de tela,
// o campo ficaria desalinhado ao abrir o template em outro aparelho.
// A conversão pixel-de-tela <-> ponto-de-pdf acontece só na hora de
// desenhar (editor) e na hora de gerar o PDF final (pdf-lib usa pontos).
export interface FieldPosition {
  x: number; // distância da borda esquerda da página, em pontos
  y: number; // distância do TOPO da página, em pontos (convertida pro
             // sistema de coordenadas do pdf-lib, que é bottom-left, só
             // no momento de gerar o PDF)
  width: number;
  height: number;
}

export interface FieldStyle {
  fontFamily: string;
  fontSize: number;
  color: string; // hex, ex: '#1C1B1B'
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
}

export interface TemplateField {
  id: string; // uuid gerado na criação do campo
  internalName: string; // "Nome Paciente" — usado pra gerar o form depois
  type: FieldType;
  position: FieldPosition;
  style: FieldStyle;
  required: boolean;
  placeholder?: string;
  maxLines?: number; // relevante só pra textoMultilinha
}

export interface Template {
  id: string;
  name: string; // "Recibo Consulta", "Contrato Padrão"...
  pdfUri: string; // caminho local do PDF original (copiado pro
                   // sandbox do app via expo-file-system)
  pageWidth: number; // em pontos de PDF, primeira página
  pageHeight: number;
  fields: TemplateField[];
  createdAt: number;
  updatedAt: number;
}

// Estrutura salva quando o usuário PREENCHE um template (não é o template
// em si, é uma "resposta" — útil se no futuro quisermos histórico).
export interface TemplateFillData {
  templateId: string;
  values: Record<string, string>; // chave = TemplateField.id
}