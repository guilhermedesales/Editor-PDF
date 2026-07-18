// Modal de edição de um campo já posicionado no template.
// Layout reorganizado: header fixo, corpo com scroll, card de
// "Tipografia" destacado (fundo cinza claro, como no mockup),
// prévia real do texto formatado, e ações fixas no rodapé.

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { colors, spacing, radius, typography } from '../constants/theme';
import { FIELD_TYPE_OPTIONS } from '../constants/fieldTypes';
import { DEFAULT_DATE_CONFIG, formatDateValue } from '../utils/dateFormat';
import { currencyToWords, plainNumberToWords } from '../utils/numberToWords';
import type { TemplateField, FieldType, DateConfig } from '../types/template';
import { Trash2, Copy, AlignLeft, AlignCenter, AlignRight, Check, ChevronDown, X } from 'lucide-react-native';

const COLOR_OPTIONS = ['#1C1B1B', '#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED'];
const FONT_OPTIONS = ['Inter', 'System', 'Times New Roman', 'Courier New'];

interface Props {
  visible: boolean;
  field: TemplateField | null;
  allFields: TemplateField[];
  onClose: () => void;
  onUpdate: (partial: Partial<TemplateField>) => void;
  onUpdateStyle: (partial: Partial<TemplateField['style']>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function samplePreview(field: TemplateField, allFields: TemplateField[]): string {
  switch (field.type) {
    case 'cpf': return '123.456.789-00';
    case 'cnpj': return '12.345.678/0001-00';
    case 'telefone': return '(21) 98765-4321';
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
    case 'numeroPorExtenso': return plainNumberToWords('10');
    case 'autoIncremento': return '001';
    case 'data': {
      const cfg = field.dateConfig ?? DEFAULT_DATE_CONFIG;
      if (cfg.auto) return formatDateValue(cfg, '');
      return cfg.parts.length === 3
        ? formatDateValue(cfg, '15/03/2026')
        : cfg.parts[0] === 'mes' ? formatDateValue(cfg, '3')
        : cfg.parts[0] === 'dia' ? '15' : '2026';
    }
    case 'hora': return '14:30';
    case 'numero': return '10';
    case 'textoMultilinha': return 'Texto de exemplo\nem múltiplas linhas';
    default: return 'Texto de exemplo';
  }
}

function Dropdown({
  value,
  onPress,
  open,
  children,
}: {
  value: string;
  onPress: () => void;
  open: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View>
      <Pressable style={styles.dropdown} onPress={onPress}>
        <Text style={styles.dropdownText} numberOfLines={1}>{value}</Text>
        <ChevronDown size={18} color={colors.secondary} />
      </Pressable>
      {open && <View style={styles.dropdownMenu}>{children}</View>}
    </View>
  );
}

export default function FieldEditorSheet({
  visible, field, allFields, onClose, onUpdate, onUpdateStyle, onDelete, onDuplicate,
}: Props) {
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showLinkMenu, setShowLinkMenu] = useState(false);

  if (!field) return null;

  const typeLabel = FIELD_TYPE_OPTIONS.find((opt) => opt.type === field.type)?.label ?? field.type;
  const dateConfig = field.dateConfig ?? DEFAULT_DATE_CONFIG;

  function adjustFontSize(delta: number) {
    const current = field!.style.fontSize ?? 12;
    onUpdateStyle({ fontSize: Math.min(Math.max(current + delta, 8), 48) });
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
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
              <X size={18} color={colors.secondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.md }}>
            <Text style={styles.sectionLabel}>Nome do Campo</Text>
            <TextInput
              style={styles.input}
              value={field.internalName}
              placeholder="Ex: nome_locatario"
              onChangeText={(text) => onUpdate({ internalName: text })}
            />

            <Text style={styles.sectionLabel}>Tipo de Dado</Text>
            <Dropdown value={typeLabel} open={showTypeMenu} onPress={() => setShowTypeMenu((v) => !v)}>
              {FIELD_TYPE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.type}
                  style={styles.dropdownItem}
                  onPress={() => { onUpdate({ type: opt.type as FieldType }); setShowTypeMenu(false); }}
                >
                  <Text style={styles.dropdownItemText}>{opt.label}</Text>
                  {field.type === opt.type && <Check size={16} color={colors.primary} />}
                </Pressable>
              ))}
            </Dropdown>

            {field.type === 'valor' && (
              <View style={styles.configBox}>
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => onUpdate({ valorConfig: { showSymbol: !(field.valorConfig?.showSymbol ?? true) } })}
                >
                  <View style={[styles.checkbox, (field.valorConfig?.showSymbol ?? true) && styles.checkboxChecked]} />
                  <Text style={styles.checkboxText}>Mostrar símbolo "R$"</Text>
                </Pressable>
              </View>
            )}

            {field.type === 'valorPorExtenso' && (
              <View style={styles.configBox}>
                <Text style={styles.configLabel}>Vincular a um campo de valor</Text>
                <Dropdown
                  value={
                    field.linkedValorFieldId
                      ? allFields.find((f) => f.id === field.linkedValorFieldId)?.internalName || 'Campo sem nome'
                      : 'Nenhum (digitar manualmente)'
                  }
                  open={showLinkMenu}
                  onPress={() => setShowLinkMenu((v) => !v)}
                >
                  <Pressable style={styles.dropdownItem} onPress={() => { onUpdate({ linkedValorFieldId: null }); setShowLinkMenu(false); }}>
                    <Text style={styles.dropdownItemText}>Nenhum (digitar manualmente)</Text>
                  </Pressable>
                  {valorFieldsAvailable.length === 0 && (
                    <Text style={styles.emptyMenuHint}>Nenhum campo de "Valor (R$)" criado ainda.</Text>
                  )}
                  {valorFieldsAvailable.map((f) => (
                    <Pressable key={f.id} style={styles.dropdownItem} onPress={() => { onUpdate({ linkedValorFieldId: f.id }); setShowLinkMenu(false); }}>
                      <Text style={styles.dropdownItemText}>{f.internalName || 'Sem nome'}</Text>
                    </Pressable>
                  ))}
                </Dropdown>
              </View>
            )}

            {field.type === 'data' && (
              <View style={styles.configBox}>
                <Text style={styles.configLabel}>O que este campo representa</Text>
                <View style={styles.rowWrap}>
                  {(['dia', 'mes', 'ano'] as const).map((part) => {
                    const active = dateConfig.parts.length === 1 && dateConfig.parts[0] === part;
                    return (
                      <Pressable key={part} style={[styles.pill, active && styles.pillActive]} onPress={() => updateDateConfig({ parts: [part] })}>
                        <Text style={[styles.pillText, active && styles.pillTextActive]}>
                          {part === 'dia' ? 'Dia' : part === 'mes' ? 'Mês' : 'Ano'}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable style={[styles.pill, dateConfig.parts.length === 3 && styles.pillActive]} onPress={() => updateDateConfig({ parts: ['dia', 'mes', 'ano'] })}>
                    <Text style={[styles.pillText, dateConfig.parts.length === 3 && styles.pillTextActive]}>Data completa</Text>
                  </Pressable>
                </View>

                {dateConfig.parts.includes('mes') && (
                  <>
                    <Text style={[styles.configLabel, { marginTop: spacing.sm }]}>Formato do mês</Text>
                    <View style={styles.rowWrap}>
                      {(['numero', 'nome', 'abreviado'] as const).map((fmt) => (
                        <Pressable key={fmt} style={[styles.pill, dateConfig.monthFormat === fmt && styles.pillActive]} onPress={() => updateDateConfig({ monthFormat: fmt })}>
                          <Text style={[styles.pillText, dateConfig.monthFormat === fmt && styles.pillTextActive]}>
                            {fmt === 'numero' ? '02' : fmt === 'nome' ? 'Fevereiro' : 'Fev.'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}

                <Pressable style={[styles.checkboxRow, { marginTop: spacing.sm }]} onPress={() => updateDateConfig({ auto: !dateConfig.auto })}>
                  <View style={[styles.checkbox, dateConfig.auto && styles.checkboxChecked]} />
                  <Text style={styles.checkboxText}>Usar data atual automaticamente</Text>
                </Pressable>
              </View>
            )}

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

            <Pressable style={styles.requiredRow} onPress={() => onUpdate({ required: !field.required })}>
              <View style={[styles.checkbox, field.required && styles.checkboxChecked]} />
              <Text style={styles.requiredText}>Campo obrigatório</Text>
            </Pressable>

            {/* --- Card de Tipografia (destacado, como no mockup) --- */}
            <View style={styles.typographyCard}>
              <Text style={styles.typographyTitle}>Tipografia</Text>

              <View style={styles.row}>
                <View style={{ flex: 1.4 }}>
                  <Text style={styles.miniLabel}>Fonte</Text>
                  <Dropdown value={field.style.fontFamily} open={showFontMenu} onPress={() => setShowFontMenu((v) => !v)}>
                    {FONT_OPTIONS.map((font) => (
                      <Pressable key={font} style={styles.dropdownItem} onPress={() => { onUpdateStyle({ fontFamily: font }); setShowFontMenu(false); }}>
                        <Text style={styles.dropdownItemText}>{font}</Text>
                        {field.style.fontFamily === font && <Check size={16} color={colors.primary} />}
                      </Pressable>
                    ))}
                  </Dropdown>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniLabel}>Tamanho</Text>
                  <View style={styles.stepperRow}>
                    <Pressable style={styles.stepButton} onPress={() => adjustFontSize(-1)}>
                      <Text style={styles.stepButtonText}>−</Text>
                    </Pressable>
                    <Text style={styles.stepValue}>{field.style.fontSize ?? 12}</Text>
                    <Pressable style={styles.stepButton} onPress={() => adjustFontSize(1)}>
                      <Text style={styles.stepButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <Text style={styles.miniLabel}>Cor</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map((color) => (
                  <Pressable
                    key={color}
                    style={[styles.swatch, { backgroundColor: color }, field.style.color === color && styles.swatchSelected]}
                    onPress={() => onUpdateStyle({ color })}
                  />
                ))}
                <View style={styles.hexBox}>
                  <View style={[styles.hexDot, { backgroundColor: field.style.color || '#1C1B1B' }]} />
                  <Text style={styles.hexText}>{(field.style.color || '#1C1B1B').toUpperCase()}</Text>
                </View>
                <Pressable style={[styles.stylePill, field.style.bold && styles.stylePillActive]} onPress={() => onUpdateStyle({ bold: !field.style.bold })}>
                  <Text style={[styles.stylePillText, field.style.bold && styles.stylePillTextActive, { fontWeight: '800' }]}>B</Text>
                </Pressable>
                <Pressable style={[styles.stylePill, field.style.italic && styles.stylePillActive]} onPress={() => onUpdateStyle({ italic: !field.style.italic })}>
                  <Text style={[styles.stylePillText, field.style.italic && styles.stylePillTextActive, { fontStyle: 'italic' }]}>I</Text>
                </Pressable>
              </View>

              <Text style={styles.miniLabel}>Alinhamento</Text>
              <View style={styles.alignRow}>
                {[
                  { value: 'left' as const, Icon: AlignLeft },
                  { value: 'center' as const, Icon: AlignCenter },
                  { value: 'right' as const, Icon: AlignRight },
                ].map(({ value, Icon }) => (
                  <Pressable
                    key={value}
                    style={[styles.alignOption, field.style.align === value && styles.alignOptionActive]}
                    onPress={() => onUpdateStyle({ align: value })}
                  >
                    <Icon size={18} color={field.style.align === value ? colors.primary : colors.secondary} />
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Largura (px)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(Math.round(field.position.width))}
                  onChangeText={(t) => {
                    const w = parseInt(t, 10);
                    if (!isNaN(w) && w > 0) onUpdate({ position: { ...field.position, width: w } });
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Altura (px)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(Math.round(field.position.height))}
                  onChangeText={(t) => {
                    const h = parseInt(t, 10);
                    if (!isNaN(h) && h > 0) onUpdate({ position: { ...field.position, height: h } });
                  }}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.actionsRow}>
            <Pressable style={styles.duplicateButton} onPress={onDuplicate}>
              <Copy size={18} color={colors.neutral} />
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={onDelete}>
              <Trash2 size={18} color={colors.danger} />
            </Pressable>
            <Pressable style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Salvar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, maxHeight: '90%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { fontSize: 18, fontWeight: '700', color: colors.neutral },
  closeButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.tertiary, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: typography.label, fontWeight: '600', color: colors.neutral, marginTop: spacing.md, marginBottom: spacing.xs },
  miniLabel: { fontSize: 12, fontWeight: '600', color: colors.secondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, fontSize: typography.body },
  dropdown: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white,
  },
  dropdownText: { fontSize: typography.body, color: colors.neutral, flex: 1 },
  dropdownMenu: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, marginTop: 4, overflow: 'hidden', backgroundColor: colors.white },
  dropdownItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  dropdownItemText: { fontSize: typography.label, color: colors.neutral },
  emptyMenuHint: { fontSize: 11, color: colors.secondary, padding: spacing.sm },
  configBox: { backgroundColor: colors.tertiary, borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm },
  configLabel: { fontSize: typography.label, fontWeight: '600', color: colors.neutral, marginBottom: spacing.xs },
  previewBox: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md,
    backgroundColor: colors.white, minHeight: 44, justifyContent: 'center',
  },
  requiredRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: colors.border, marginRight: spacing.sm },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxText: { fontSize: typography.label, color: colors.neutral },
  requiredText: { fontSize: typography.label, color: colors.neutral },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowWrap: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  typographyCard: {
    backgroundColor: '#F5F3F0', borderRadius: radius.md, padding: spacing.md,
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  typographyTitle: { fontSize: typography.body, fontWeight: '700', color: colors.neutral, marginBottom: spacing.xs },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stepButton: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  stepButtonText: { fontSize: 18, fontWeight: '700', color: colors.neutral },
  stepValue: { fontSize: typography.body, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  swatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  swatchSelected: { borderColor: colors.neutral },
  hexBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6,
  },
  hexDot: { width: 14, height: 14, borderRadius: 7 },
  hexText: { fontSize: 12, color: colors.neutral, fontWeight: '600' },
  stylePill: {
    width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  stylePillActive: { backgroundColor: colors.neutral, borderColor: colors.neutral },
  stylePillText: { fontSize: 15, color: colors.neutral },
  stylePillTextActive: { color: colors.white },
  alignRow: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  alignOption: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  alignOptionActive: { backgroundColor: colors.primaryLight },
  pill: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: typography.label, fontWeight: '600', color: colors.neutral },
  pillTextActive: { color: colors.white },
  actionsRow: {
    flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  duplicateButton: { width: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  deleteButton: { width: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  doneButton: { flex: 1, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  doneButtonText: { color: colors.white, fontWeight: '700', fontSize: typography.body },
});