// Lista de tipos de campo disponíveis no modal "Adicionar Campo".
// Cada tipo tem ícone + descrição curta pra facilitar reconhecimento
// visual (ver FieldTypePicker no TemplateEditorScreen).

import type { FieldType } from '../types/template';
import {
  Type,
  Hash,
  DollarSign,
  Calendar,
  Clock,
  CreditCard,
  Building2,
  Phone,
  AlignLeft,
  ListOrdered,
  BookOpenText,
} from 'lucide-react-native';

export interface FieldTypeOption {
  type: FieldType;
  label: string;
  description: string;
  icon: any;
}

export const FIELD_TYPE_OPTIONS: FieldTypeOption[] = [
  { type: 'texto', label: 'Texto', description: 'Linha única', icon: Type },
  { type: 'textoFixo', label: 'Texto Fixo', description: 'Editável no preenchimento', icon: Type },
  { type: 'textoMultilinha', label: 'Texto Multilinha', description: 'Parágrafos', icon: AlignLeft },
  { type: 'numero', label: 'Número', description: 'Ex: 10', icon: Hash },
  { type: 'calculado', label: 'Campo Calculado', description: 'Ex: total automático', icon: Hash },
  { type: 'valor', label: 'Valor (R$)', description: 'Ex: R$ 150,00', icon: DollarSign },
  { type: 'valorPorExtenso', label: 'Valor por Extenso', description: 'Ex: cento e cinquenta reais', icon: BookOpenText },
  { type: 'numeroPorExtenso', label: 'Número por Extenso', description: 'Ex: dez', icon: BookOpenText },
  { type: 'autoIncremento', label: 'Numeração Automática', description: 'Ex: nº do recibo', icon: ListOrdered },
  { type: 'data', label: 'Data', description: 'DD/MM/AAAA', icon: Calendar },
  { type: 'hora', label: 'Hora', description: 'HH:MM', icon: Clock },
  { type: 'cpf', label: 'CPF', description: '000.000.000-00', icon: CreditCard },
  { type: 'cnpj', label: 'CNPJ', description: '00.000.000/0000-00', icon: Building2 },
  { type: 'telefone', label: 'Telefone', description: '(00) 00000-0000', icon: Phone },
];