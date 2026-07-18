// Lista de tipos de campo disponíveis no modal "Adicionar Campo"
// (Image 5 do mockup). Centralizado aqui pra tela e futuras validações
// de formatação puxarem do mesmo lugar.

import type { FieldType } from '../types/template';

export const FIELD_TYPE_OPTIONS: { type: FieldType; label: string }[] = [
  { type: 'texto', label: 'Texto' },
  { type: 'numero', label: 'Número' },
  { type: 'valor', label: 'Valor' },
  { type: 'valorPorExtenso', label: 'Valor por Extenso' },
  { type: 'data', label: 'Data' },
  { type: 'hora', label: 'Hora' },
  { type: 'cpf', label: 'CPF' },
  { type: 'cnpj', label: 'CNPJ' },
  { type: 'telefone', label: 'Telefone' },
  { type: 'textoMultilinha', label: 'Texto Multilinha' },
];