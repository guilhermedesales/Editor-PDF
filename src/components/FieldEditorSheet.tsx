// Modal de edição de um campo já posicionado no template.
//
// Agora inclui: troca de tipo de campo, seletor de fonte, prévia real
// de como o texto vai aparecer no PDF (incluindo máscara/formato do
// tipo escolhido), e as configurações específicas de 'valor' (símbolo
// R$), 'valorPorExtenso' (vínculo com um campo de valor) e 'data'
// (partes, formato do mês, modo automático).

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { colors, spacing, radius, typography } from '../constants/theme';
import { FIELD_TYPE_OPTIONS } from '../constants/fieldTypes';
import { DEFAULT_DATE_CONFIG, formatDateValue, placeholderForDateConfig } from '../utils/dateFormat';
import { maskCurrency, applyMaskFor } from '../utils/masks';
import { currencyToWords, plainNumberToWords } from '../utils/numberToWords';
import type { TemplateField, FieldType, DateConfig } from '../types/template';
import { Trash2, Copy, AlignLeft, AlignCenter, AlignRight, Check, ChevronDown } from 'lucide-react-native';

const COLOR_OPTIONS = ['#1C1B1B', '#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED'];
const FONT_OPTIONS = ['Inter', 'System', 'Times New Roman', 'Courier New'];

interface Props {
  visible: boolean;
  field: TemplateField | null;
  allFields: TemplateField[]; // pra listar campos de tipo 'valor' no vínculo
  onClose: () => void;
  onUpdate: (partial: Partial<TemplateField>) => void;
  onUpdateStyle: (partial: Partial<TemplateField['style']>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function samplePreview(field: TemplateField, allFields: TemplateField[]): string {
  switch (field.type) {
    case 'cpf':
      return '123.456.789-00';
    case 'cnpj':
      return '12.345.678/0001-00';
    case 'telefone':
      return '(21) 98765-4321';
    case 'valor': {
      const symbol = field.valorConfig?.showSymbol ?? true;
      return `${symbol ? 'R$ ' : ''}150,00`;
    }
    case 'valorPorExtenso': {
      if (field.linkedValorFieldId) {
        const linked = allFields.find((f) => f.id === field.linkedValorFieldId);
        return linked ? currencyToWords('150,00') : 'vincule um campo de valor';
      }
      return currencyToWords('150,00');
    }
    case 'numeroPorExtenso':
      return plainNumberToWords('10');
    case 'autoIncremento':
      return '001';
    case 'data': {
      const cfg = field.dateConfig ?? DEFAULT_DATE_CONFIG;
      if (cfg.auto) return formatDateValue(cfg, '');
      return cfg.parts.length === 3
        ? formatDateValue(cfg, '15/03/2026')
        : cfg.parts[0] === 'mes'
        ? formatDateValue(cfg, '3')
        : cfg.parts[0] === 'dia'
        ? '15'
        : '2026';
    }
    case 'hora':
      return '14:30';
    case 'numero':
      return '10';
    case 'textoMultilinha':
      return 'Texto de exemplo\nem múltiplas linhas';
    default:
      return 'Texto de exemplo';
  }
}

export default function FieldEditorSheet({
  visible,
  field,
  allFields,
  onClose,
  onUpdate,
  onUpdateStyle,
  onDelete,
  onDuplicate,
}: Props) {
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showLinkMenu, setShowLinkMenu] = useState(false);

  if (!field) return null;

  const typeLabel = FIELD_TYPE_OPTIONS.find((opt) => opt.type === field.type)?.label ?? field.type;
  const dateConfig = field.dateConfig ?? DEFAULT_DATE_CONFIG;

  function adjustFontSize(delta: number) {
    const current = field!.style.fontSize ?? 12;
    const next = Math.min(Math.max(current + delta, 8), 48);
    onUpdateStyle({ fontSize: next });
  }

  function updateDateConfig(partial: Partial<DateConfig>) {
    onUpdate({ dateConfig: { ...dateConfig, ...partial } });
  }

  const valorFieldsAvailable = allFields.filter((f) => f.type === 'valor' && f.id !== field.id);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Propriedades do Campo</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.closeX}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Nome do Campo</Text>
            <TextInput
              style={styles.input}
              value={field.internalName}
              placeholder="Ex: nome_locatario"
              onChangeText={(text) => onUpdate({ internalName: text })}
            />

            <Text style={styles.sectionLabel}>Tipo de Dado</Text>
            <Pressable style={styles.dropdown} onPress={() => setShowTypeMenu((v) => !v)}>
              <Text style={styles.dropdownText}>{typeLabel}</Text>
              <ChevronDown size={18} color={colors.secondary} />
            </Pressable>
            {showTypeMenu && (
              <View style={styles.dropdownMenu}>
                {FIELD_TYPE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.type}
                    style={styles.dropdownItem}
                    onPress={() => {
                      onUpdate({ type: opt.type as FieldType });
                      setShowTypeMenu(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{opt.label}</Text>
                    {field.type === opt.type && <Check size={16} color={colors.primary} />}
                  </Pressable>
                ))}
              </View>
            )}

            {/* --- Configurações específicas por tipo --- */}

            {field.type === 'valor' && (
              <View style={styles.configBox}>
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() =>
                    onUpdate({
                      valorConfig: { showSymbol: !(field.valorConfig?.showSymbol ?? true) },
                    })
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      (field.valorConfig?.showSymbol ?? true) && styles.checkboxChecked,
                    ]}
                  />
                  <Text style={styles.checkboxText}>Mostrar símbolo "R$"</Text>
                </Pressable>
              </View>
            )}

            {field.type === 'valorPorExtenso' && (
              <View style={styles.configBox}>
                <Text style={styles.configLabel}>Vincular a um campo de valor</Text>
                <Pressable style={styles.dropdown} onPress={() => setShowLinkMenu((v) => !v)}>
                  <Text style={styles.dropdownText}>
                    {field.linkedValorFieldId
                      ? allFields.find((f) => f.id === field.linkedValorFieldId)?.internalName ||
                        'Campo sem nome'
                      : 'Nenhum (digitar manualmente)'}
                  </Text>
                  <ChevronDown size={18} color={colors.secondary} />
                </Pressable>
                {showLinkMenu && (
                  <View style={styles.dropdownMenu}>
                    <Pressable
                      style={styles.dropdownItem}
                      onPress={() => {
                        onUpdate({ linkedValorFieldId: null });
                        setShowLinkMenu(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Nenhum (digitar manualmente)</Text>
                    </Pressable>
                    {valorFieldsAvailable.length === 0 && (
                      <Text style={styles.emptyMenuHint}>
                        Nenhum campo de "Valor (R$)" criado ainda.
                      </Text>
                    )}
                    {valorFieldsAvailable.map((f) => (
                      <Pressable
                        key={f.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          onUpdate({ linkedValorFieldId: f.id });
                          setShowLinkMenu(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{f.internalName || 'Sem nome'}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}

            {field.type === 'data' && (
              <View style={styles.configBox}>
                <Text style={styles.configLabel}>O que este campo representa</Text>
                <View style={styles.rowWrap}>
                  {(['dia', 'mes', 'ano'] as const).map((part) => {
                    const isFull = dateConfig.parts.length === 3;
                    const active = isFull || dateConfig.parts[0] === part;
                    return (
                      <Pressable
                        key={part}
                        style={[styles.pill, active && styles.pillActive]}
                        onPress={() => updateDateConfig({ parts: [part] })}
                      >
                        <Text style={[styles.pillText, active && styles.pillTextActive]}>
                          {part === 'dia' ? 'Dia' : part === 'mes' ? 'Mês' : 'Ano'}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    style={[styles.pill, dateConfig.parts.length === 3 && styles.pillActive]}
                    onPress={() => updateDateConfig({ parts: ['dia', 'mes', 'ano'] })}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        dateConfig.parts.length === 3 && styles.pillTextActive,
                      ]}
                    >
                      Data completa
                    </Text>
                  </Pressable>
                </View>

                {(dateConfig.parts.includes('mes')) && (
                  <>
                    <Text style={[styles.configLabel, { marginTop: spacing.sm }]}>
                      Formato do mês
                    </Text>
                    <View style={styles.rowWrap}>
                      {(['numero', 'nome', 'abreviado'] as const).map((fmt) => (
                        <Pressable
                          key={fmt}
                          style={[styles.pill, dateConfig.monthFormat === fmt && styles.pillActive]}
                          onPress={() => updateDateConfig({ monthFormat: fmt })}
                        >
                          <Text
                            style={[
                              styles.pillText,
                              dateConfig.monthFormat === fmt && styles.pillTextActive,
                            ]}
                          >
                            {fmt === 'numero' ? '02' : fmt === 'nome' ? 'Fevereiro' : 'Fev.'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}

                <Pressable
                  style={[styles.checkboxRow, { marginTop: spacing.sm }]}
                  onPress={() => updateDateConfig({ auto: !dateConfig.auto })}
                >
                  <View style={[styles.checkbox, dateConfig.auto && styles.checkboxChecked]} />
                  <Text style={styles.checkboxText}>Usar data atual automaticamente</Text>
                </Pressable>
              </View>
            )}

            {/* --- Prévia real --- */}
            <Text style={styles.sectionLabel}>Prévia no PDF</Text>
            <View style={styles.previewBox}>
              <Text
                style={{
                  fontSize: field.style.fontSize ?? 12,
                  color: field.style.color || '#1C1B1B',
                  fontWeight: field.style.bold ? '700' : '400',
                  fontStyle: field.style.italic ? 'italic' : 'normal',
                  textAlign: field.style.align,
                }}
              >
                {samplePreview(field, allFields)}
              </Text>
            </View>

            <Pressable
              style={styles.requiredRow}
              onPress={() => onUpdate({ required: !field.required })}
            >
              <View style={[styles.checkbox, field.required && styles.checkboxChecked]} />
              <Text style={styles.requiredText}>Campo obrigatório</Text>
            </Pressable>

            <View style={styles.divider} />

            <Text style={styles.groupTitle}>Tipografia</Text>

            <Text style={styles.sectionLabel}>Fonte</Text>
            <Pressable style={styles.dropdown} onPress={() => setShowFontMenu((v) => !v)}>
              <Text style={styles.dropdownText}>{field.style.fontFamily}</Text>
              <ChevronDown size={18} color={colors.secondary} />
            </Pressable>
            {showFontMenu && (
              <View style={styles.dropdownMenu}>
                {FONT_OPTIONS.map((font) => (
                  <Pressable
                    key={font}
                    style={styles.dropdownItem}
                    onPress={() => {
                      onUpdateStyle({ fontFamily: font });
                      setShowFontMenu(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { fontFamily: font === 'System' ? undefined : undefined }]}>
                      {font}
                    </Text>
                    {field.style.fontFamily === font && <Check size={16} color={colors.primary} />}
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.sectionLabel}>Tamanho da Fonte</Text>
            <View style={styles.row}>
              <Pressable style={styles.stepButton} onPress={() => adjustFontSize(-1)}>
                <Text style={styles.stepButtonText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{field.style.fontSize ?? 12}</Text>
              <Pressable style={styles.stepButton} onPress={() => adjustFontSize(1)}>
                <Text style={styles.stepButtonText}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>Cor</Text>
            <View style={styles.row}>
              {COLOR_OPTIONS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.swatch,
                    { backgroundColor: color },
                    field.style.color === color && styles.swatchSelected,
                  ]}
                  onPress={() => onUpdateStyle({ color })}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Estilo</Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.pill, field.style.bold && styles.pillActive]}
                onPress={() => onUpdateStyle({ bold: !field.style.bold })}
              >
                <Text style={[styles.pillText, field.style.bold && styles.pillTextActive]}>
                  Negrito
                </Text>
              </Pressable>
              <Pressable
                style={[styles.pill, field.style.italic && styles.pillActive]}
                onPress={() => onUpdateStyle({ italic: !field.style.italic })}
              >
                <Text style={[styles.pillText, field.style.italic && styles.pillTextActive]}>
                  Itálico
                </Text>
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>Alinhamento</Text>
            <View style={styles.row}>
              {[
                { value: 'left' as const, Icon: AlignLeft },
                { value: 'center' as const, Icon: AlignCenter },
                { value: 'right' as const, Icon: AlignRight },
              ].map(({ value, Icon }) => (
                <Pressable
                  key={value}
                  style={[styles.pill, field.style.align === value && styles.pillActive]}
                  onPress={() => onUpdateStyle({ align: value })}
                >
                  <Icon size={18} color={field.style.align === value ? colors.white : colors.neutral} />
                </Pressable>
              ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>Tamanho (px)</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.miniLabel}>Largura</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(Math.round(field.position.width))}
                  onChangeText={(t) => {
                    const w = parseInt(t, 10);
                    if (!isNaN(w) && w > 0) {
                      onUpdate({ position: { ...field.position, width: w } });
                    }
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.miniLabel}>Altura</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(Math.round(field.position.height))}
                  onChangeText={(t) => {
                    const h = parseInt(t, 10);
                    if (!isNaN(h) && h > 0) {
                      onUpdate({ position: { ...field.position, height: h } });
                    }
                  }}
                />
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Pressable style={styles.duplicateButton} onPress={onDuplicate}>
                <Copy size={16} color={colors.neutral} />
              </Pressable>
              <Pressable style={styles.deleteButton} onPress={onDelete}>
                <Trash2 size={16} color={colors.danger} />
                <Text style={styles.deleteButtonText}>Excluir</Text>
              </Pressable>
              <Pressable style={styles.doneButton} onPress={onClose}>
                <Text style={styles.doneButtonText}>Salvar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '88%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: typography.body, fontWeight: '700' },
  closeX: { fontSize: 18, color: colors.secondary },
  sectionLabel: {
    fontSize: typography.label, fontWeight: '600', color: colors.neutral,
    marginTop: spacing.sm, marginBottom: spacing.xs,
  },
  miniLabel: { fontSize: 11, color: colors.secondary, marginBottom: 2 },
  groupTitle: {
    fontSize: typography.label, fontWeight: '700', color: colors.primary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm,
  },
  dropdown: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  dropdownText: { fontSize: typography.body, color: colors.neutral },
  dropdownMenu: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    marginTop: 4, overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  dropdownItemText: { fontSize: typography.label, color: colors.neutral },
  emptyMenuHint: { fontSize: 11, color: colors.secondary, padding: spacing.sm },
  configBox: {
    backgroundColor: colors.tertiary, borderRadius: radius.md, padding: spacing.sm,
    marginTop: spacing.sm,
  },
  configLabel: { fontSize: typography.label, fontWeight: '600', color: colors.neutral, marginBottom: spacing.xs },
  previewBox: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
    padding: spacing.md, backgroundColor: colors.white, minHeight: 44, justifyContent: 'center',
  },
  requiredRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: colors.border,
    marginRight: spacing.sm,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxText: { fontSize: typography.label, color: colors.neutral },
  requiredText: { fontSize: typography.label, color: colors.neutral },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  rowWrap: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  stepButton: {
    width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.tertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepButtonText: { fontSize: 18, fontWeight: '700', color: colors.neutral },
  stepValue: { fontSize: typography.body, fontWeight: '600', minWidth: 32, textAlign: 'center' },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: colors.neutral },
  pill: {
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.full,
    backgroundColor: colors.tertiary,
  },
  pillActive: { backgroundColor: colors.primary },
  pillText: { fontSize: typography.label, fontWeight: '600', color: colors.neutral },
  pillTextActive: { color: colors.white },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md },
  duplicateButton: {
    width: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteButton: {
    flex: 1, flexDirection: 'row', gap: spacing.xs, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.danger, alignItems: 'center', justifyContent: 'center',
  },
  deleteButtonText: { color: colors.danger, fontWeight: '600' },
  doneButton: {
    flex: 2, borderRadius: radius.md, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  doneButtonText: { color: colors.white, fontWeight: '700' },
});