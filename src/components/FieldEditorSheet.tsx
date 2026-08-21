import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { spacing, radius, typography } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import { FIELD_TYPE_OPTIONS } from '../constants/fieldTypes';
import { DEFAULT_DATE_CONFIG, formatDateValue } from '../utils/dateFormat';
import { currencyToWords, plainNumberToWords } from '../utils/numberToWords';
import { DEFAULT_AUTO_INCREMENT_CONFIG, formatAutoIncrement } from '../utils/autoIncrement';
import type { TemplateField, FieldType, DateConfig, AutoIncrementConfig, CalculationConfig } from '../types/template';
import { Trash2, Copy, AlignLeft, AlignCenter, AlignRight, Check, ChevronDown, X } from 'lucide-react-native';

const COLOR_OPTIONS = ['#1C1B1B', '#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED'];
const FONT_OPTIONS = ['Inter', 'System', 'Times New Roman', 'Courier New'];
const DIGIT_OPTIONS = [1, 2, 3, 4, 5];

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
    case 'textoFixo': return field.defaultText || 'Texto fixo';
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
    case 'calculado': return 'Resultado automático';
    case 'autoIncremento': {
      const cfg = field.autoIncrementConfig ?? DEFAULT_AUTO_INCREMENT_CONFIG;
      return formatAutoIncrement(cfg.startAt, cfg);
    }
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

function Dropdown({ value, onPress, open, children, colors }: { value: string; onPress: () => void; open: boolean; children?: React.ReactNode; colors: any }) {
  return (
    <View>
      <Pressable style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.white }]} onPress={onPress}>
        <Text style={[styles.dropdownText, { color: colors.neutral }]} numberOfLines={1}>{value}</Text>
        <ChevronDown size={18} color={colors.secondary} />
      </Pressable>
      {open && <View style={[styles.dropdownMenu, { borderColor: colors.border, backgroundColor: colors.white }]}>{children}</View>}
    </View>
  );
}

export default function FieldEditorSheet({
  visible, field, allFields, onClose, onUpdate, onUpdateStyle, onDelete, onDuplicate,
}: Props) {
  const { colors } = useThemeStore();
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showLinkMenu, setShowLinkMenu] = useState(false);

  if (!field) return null;

  const typeLabel = FIELD_TYPE_OPTIONS.find((opt) => opt.type === field.type)?.label ?? field.type;
  const dateConfig = field.dateConfig ?? DEFAULT_DATE_CONFIG;
  const autoConfig = field.autoIncrementConfig ?? DEFAULT_AUTO_INCREMENT_CONFIG;

  function adjustFontSize(delta: number) {
    const current = field!.style.fontSize ?? 12;
    onUpdateStyle({ fontSize: Math.min(Math.max(current + delta, 8), 48) });
  }

  function updateDateConfig(partial: Partial<DateConfig>) {
    onUpdate({ dateConfig: { ...dateConfig, ...partial } });
  }

  function updateAutoConfig(partial: Partial<AutoIncrementConfig>) {
    onUpdate({ autoIncrementConfig: { ...autoConfig, ...partial } });
  }

  function updateCalculationConfig(partial: Partial<CalculationConfig>) {
    onUpdate({ calculationConfig: { operation: 'soma', format: 'numero', ...field!.calculationConfig, ...partial } });
  }

  const valorFieldsAvailable = allFields.filter((f) => f.type === 'valor' && f.id !== field.id);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.white }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.neutral }]}>Propriedades do Campo</Text>
            <Pressable onPress={onClose} hitSlop={8} style={[styles.closeButton, { backgroundColor: colors.tertiary }]}>
              <X size={18} color={colors.secondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.md }}>
            <Text style={[styles.sectionLabel, { color: colors.neutral }]}>Nome do Campo</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.neutral }]}
              value={field.internalName}
              placeholder="Ex: nome_locatario"
              placeholderTextColor={colors.secondary}
              onChangeText={(text) => onUpdate({ internalName: text })}
            />

            <Text style={[styles.sectionLabel, { color: colors.neutral }]}>Tipo de Dado</Text>
            <Dropdown value={typeLabel} open={showTypeMenu} onPress={() => setShowTypeMenu((v) => !v)} colors={colors}>
              {FIELD_TYPE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.type}
                  style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                  onPress={() => { onUpdate({ type: opt.type as FieldType }); setShowTypeMenu(false); }}
                >
                  <Text style={[styles.dropdownItemText, { color: colors.neutral }]}>{opt.label}</Text>
                  {field.type === opt.type && <Check size={16} color={colors.primary} />}
                </Pressable>
              ))}
            </Dropdown>

            {field.type === 'textoFixo' && (
              <View style={[styles.configBox, { backgroundColor: colors.tertiary }]}>
                <Text style={[styles.configLabel, { color: colors.neutral }]}>Texto inicial no template</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.neutral }]}
                  value={field.defaultText ?? ''}
                  placeholder="Ex: Rio de Janeiro,"
                  placeholderTextColor={colors.secondary}
                  onChangeText={(text) => onUpdate({ defaultText: text })}
                />
              </View>
            )}

            {field.type === 'valor' && (
              <View style={[styles.configBox, { backgroundColor: colors.tertiary }]}>
                <Pressable
                  style={styles.checkboxRow}
                  onPress={() => onUpdate({ valorConfig: { showSymbol: !(field.valorConfig?.showSymbol ?? true) } })}
                >
                  <View style={[styles.checkbox, { borderColor: colors.border }, (field.valorConfig?.showSymbol ?? true) && { backgroundColor: colors.primary, borderColor: colors.primary }]} />
                  <Text style={[styles.checkboxText, { color: colors.neutral }]}>Mostrar símbolo "R$"</Text>
                </Pressable>
              </View>
            )}

            {field.type === 'autoIncremento' && (
              <View style={[styles.configBox, { backgroundColor: colors.tertiary }]}>
                <Text style={[styles.configLabel, { color: colors.neutral }]}>Quantidade de dígitos</Text>
                <View style={styles.rowWrap}>
                  {DIGIT_OPTIONS.map((d) => (
                    <Pressable
                      key={d}
                      style={[styles.pill, { backgroundColor: colors.white, borderColor: colors.border }, autoConfig.digits === d && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => updateAutoConfig({ digits: d })}
                    >
                      <Text style={[styles.pillText, { color: colors.neutral }, autoConfig.digits === d && { color: colors.white }]}>
                        {formatAutoIncrement(1, { digits: d, startAt: 1 })}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.configLabel, { color: colors.neutral, marginTop: spacing.sm }]}>Começar a contar em</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.neutral }]}
                  keyboardType="numeric"
                  value={String(autoConfig.startAt)}
                  onChangeText={(t) => {
                    const n = parseInt(t.replace(/\D/g, ''), 10);
                    updateAutoConfig({ startAt: isNaN(n) ? 1 : Math.max(n, 0) });
                  }}
                />
              </View>
            )}

            {field.type === 'calculado' && (
              <View style={[styles.configBox, { backgroundColor: colors.tertiary }]}>
                <Text style={[styles.configLabel, { color: colors.neutral }]}>Campo calculado</Text>
                <Text style={[styles.configLabel, { color: colors.neutral }]}>Primeiro valor</Text>
                <Dropdown colors={colors} value={allFields.find((f) => f.id === field.calculationConfig?.leftFieldId)?.internalName || 'Selecione'} open={showLinkMenu} onPress={() => setShowLinkMenu((v) => !v)}>
                  {allFields.filter((f) => f.id !== field.id && f.type !== 'calculado').map((f) => (
                    <Pressable key={f.id} style={[styles.dropdownItem, { borderBottomColor: colors.border }]} onPress={() => { updateCalculationConfig({ leftFieldId: f.id }); setShowLinkMenu(false); }}>
                      <Text style={[styles.dropdownItemText, { color: colors.neutral }]}>{f.internalName || f.type}</Text>
                    </Pressable>
                  ))}
                </Dropdown>
                <Text style={[styles.configLabel, { color: colors.neutral, marginTop: spacing.sm }]}>Operação</Text>
                <View style={styles.rowWrap}>
                  {([['soma', '+'], ['subtracao', '−'], ['multiplicacao', '×'], ['divisao', '÷'], ['porcentagem', '% desc.']] as const).map(([value, label]) => (
                    <Pressable key={value} style={[styles.pill, { backgroundColor: colors.white, borderColor: colors.border }, field.calculationConfig?.operation === value && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => updateCalculationConfig({ operation: value })}>
                      <Text style={[styles.pillText, { color: colors.neutral }, field.calculationConfig?.operation === value && { color: colors.white }]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.configLabel, { color: colors.neutral, marginTop: spacing.sm }]}>Segundo valor</Text>
                <View style={styles.rowWrap}>
                  {allFields.filter((f) => f.id !== field.id && f.type !== 'calculado').map((f) => (
                    <Pressable key={f.id} style={[styles.pill, { backgroundColor: colors.white, borderColor: colors.border }, field.calculationConfig?.rightFieldId === f.id && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => updateCalculationConfig({ rightFieldId: f.id })}>
                      <Text style={[styles.pillText, { color: field.calculationConfig?.rightFieldId === f.id ? colors.white : colors.neutral }]}>{f.internalName || f.type}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.configLabel, { color: colors.neutral, marginTop: spacing.sm }]}>Formato</Text>
                <View style={styles.rowWrap}>
                  {([['numero', 'Número'], ['moeda', 'Moeda'], ['porcentagem', '%']] as const).map(([value, label]) => (
                    <Pressable key={value} style={[styles.pill, { backgroundColor: colors.white, borderColor: colors.border }, field.calculationConfig?.format === value && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => updateCalculationConfig({ format: value })}>
                      <Text style={[styles.pillText, { color: field.calculationConfig?.format === value ? colors.white : colors.neutral }]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {field.type === 'valorPorExtenso' && (
              <View style={[styles.configBox, { backgroundColor: colors.tertiary }]}>
                <Text style={[styles.configLabel, { color: colors.neutral }]}>Vincular a um campo de valor</Text>
                <Dropdown
                  colors={colors}
                  value={
                    field.linkedValorFieldId
                      ? allFields.find((f) => f.id === field.linkedValorFieldId)?.internalName || 'Campo sem nome'
                      : 'Nenhum (digitar manualmente)'
                  }
                  open={showLinkMenu}
                  onPress={() => setShowLinkMenu((v) => !v)}
                >
                  <Pressable style={[styles.dropdownItem, { borderBottomColor: colors.border }]} onPress={() => { onUpdate({ linkedValorFieldId: null }); setShowLinkMenu(false); }}>
                    <Text style={[styles.dropdownItemText, { color: colors.neutral }]}>Nenhum (digitar manualmente)</Text>
                  </Pressable>
                  {valorFieldsAvailable.length === 0 && (
                    <Text style={[styles.emptyMenuHint, { color: colors.secondary }]}>Nenhum campo de "Valor (R$)" criado ainda.</Text>
                  )}
                  {valorFieldsAvailable.map((f) => (
                    <Pressable key={f.id} style={[styles.dropdownItem, { borderBottomColor: colors.border }]} onPress={() => { onUpdate({ linkedValorFieldId: f.id }); setShowLinkMenu(false); }}>
                      <Text style={[styles.dropdownItemText, { color: colors.neutral }]}>{f.internalName || 'Sem nome'}</Text>
                    </Pressable>
                  ))}
                </Dropdown>
              </View>
            )}

            {field.type === 'data' && (
              <View style={[styles.configBox, { backgroundColor: colors.tertiary }]}>
                <Text style={[styles.configLabel, { color: colors.neutral }]}>O que este campo representa</Text>
                <View style={styles.rowWrap}>
                  {(['dia', 'mes', 'ano'] as const).map((part) => {
                    const active = dateConfig.parts.length === 1 && dateConfig.parts[0] === part;
                    return (
                      <Pressable key={part} style={[styles.pill, { backgroundColor: colors.white, borderColor: colors.border }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => updateDateConfig({ parts: [part] })}>
                        <Text style={[styles.pillText, { color: colors.neutral }, active && { color: colors.white }]}>
                          {part === 'dia' ? 'Dia' : part === 'mes' ? 'Mês' : 'Ano'}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable style={[styles.pill, { backgroundColor: colors.white, borderColor: colors.border }, dateConfig.parts.length === 3 && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => updateDateConfig({ parts: ['dia', 'mes', 'ano'] })}>
                    <Text style={[styles.pillText, { color: colors.neutral }, dateConfig.parts.length === 3 && { color: colors.white }]}>Data completa</Text>
                  </Pressable>
                </View>

                {dateConfig.parts.includes('mes') && (
                  <>
                    <Text style={[styles.configLabel, { color: colors.neutral, marginTop: spacing.sm }]}>Formato do mês</Text>
                    <View style={styles.rowWrap}>
                      {(['numero', 'nome', 'abreviado'] as const).map((fmt) => (
                        <Pressable key={fmt} style={[styles.pill, { backgroundColor: colors.white, borderColor: colors.border }, dateConfig.monthFormat === fmt && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => updateDateConfig({ monthFormat: fmt })}>
                          <Text style={[styles.pillText, { color: colors.neutral }, dateConfig.monthFormat === fmt && { color: colors.white }]}>
                            {fmt === 'numero' ? '02' : fmt === 'nome' ? 'Fevereiro' : 'Fev.'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}

                {dateConfig.parts.includes('ano') && (
                  <>
                    <Text style={[styles.configLabel, { color: colors.neutral, marginTop: spacing.sm }]}>Formato do ano</Text>
                    <View style={styles.rowWrap}>
                      {([
                        { value: 'completo' as const, label: '2026' },
                        { value: 'doisDigitos' as const, label: '26' },
                      ]).map((option) => (
                        <Pressable
                          key={option.value}
                          style={[styles.pill, { backgroundColor: colors.white, borderColor: colors.border }, (dateConfig.yearFormat ?? 'completo') === option.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                          onPress={() => updateDateConfig({ yearFormat: option.value })}
                        >
                          <Text style={[styles.pillText, { color: colors.neutral }, (dateConfig.yearFormat ?? 'completo') === option.value && { color: colors.white }]}>{option.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}

                <Pressable style={[styles.checkboxRow, { marginTop: spacing.sm }]} onPress={() => updateDateConfig({ auto: !dateConfig.auto })}>
                  <View style={[styles.checkbox, { borderColor: colors.border }, dateConfig.auto && { backgroundColor: colors.primary, borderColor: colors.primary }]} />
                  <Text style={[styles.checkboxText, { color: colors.neutral }]}>Usar data atual automaticamente</Text>
                </Pressable>
              </View>
            )}

            <Text style={[styles.sectionLabel, { color: colors.neutral }]}>Prévia no PDF</Text>
            <View style={[styles.previewBox, { borderColor: colors.border, backgroundColor: colors.white }]}>
              <Text
                style={{
                  fontSize: field.style.fontSize ?? 12,
                  color: field.style.color || colors.neutral,
                  fontWeight: field.style.bold ? '700' : '400',
                  fontStyle: field.style.italic ? 'italic' : 'normal',
                  textAlign: field.style.align,
                }}
              >
                {samplePreview(field, allFields)}
              </Text>
            </View>

            <Pressable style={styles.requiredRow} onPress={() => onUpdate({ required: !field.required })}>
              <View style={[styles.checkbox, { borderColor: colors.border }, field.required && { backgroundColor: colors.primary, borderColor: colors.primary }]} />
              <Text style={[styles.requiredText, { color: colors.neutral }]}>Campo obrigatório</Text>
            </Pressable>

            <View style={[styles.typographyCard, { backgroundColor: colors.tertiary }]}>
              <Text style={[styles.typographyTitle, { color: colors.neutral }]}>Tipografia</Text>

              <View style={styles.row}>
                <View style={{ flex: 1.4 }}>
                  <Text style={[styles.miniLabel, { color: colors.secondary }]}>Fonte</Text>
                  <Dropdown colors={colors} value={field.style.fontFamily} open={showFontMenu} onPress={() => setShowFontMenu((v) => !v)}>
                    {FONT_OPTIONS.map((font) => (
                      <Pressable key={font} style={[styles.dropdownItem, { borderBottomColor: colors.border }]} onPress={() => { onUpdateStyle({ fontFamily: font }); setShowFontMenu(false); }}>
                        <Text style={[styles.dropdownItemText, { color: colors.neutral }]}>{font}</Text>
                        {field.style.fontFamily === font && <Check size={16} color={colors.primary} />}
                      </Pressable>
                    ))}
                  </Dropdown>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.miniLabel, { color: colors.secondary }]}>Tamanho</Text>
                  <View style={styles.stepperRow}>
                    <Pressable style={[styles.stepButton, { backgroundColor: colors.white, borderColor: colors.border }]} onPress={() => adjustFontSize(-1)}>
                      <Text style={[styles.stepButtonText, { color: colors.neutral }]}>−</Text>
                    </Pressable>
                    <Text style={[styles.stepValue, { color: colors.neutral }]}>{field.style.fontSize ?? 12}</Text>
                    <Pressable style={[styles.stepButton, { backgroundColor: colors.white, borderColor: colors.border }]} onPress={() => adjustFontSize(1)}>
                      <Text style={[styles.stepButtonText, { color: colors.neutral }]}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <Text style={[styles.miniLabel, { color: colors.secondary }]}>Cor</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map((color) => (
                  <Pressable
                    key={color}
                    style={[styles.swatch, { backgroundColor: color }, field.style.color === color && { borderColor: colors.neutral }]}
                    onPress={() => onUpdateStyle({ color })}
                  />
                ))}
                <View style={[styles.hexBox, { backgroundColor: colors.white, borderColor: colors.border }]}>
                  <View style={[styles.hexDot, { backgroundColor: field.style.color || colors.neutral }]} />
                  <Text style={[styles.hexText, { color: colors.neutral }]}>{(field.style.color || '#1C1B1B').toUpperCase()}</Text>
                </View>
                <Pressable style={[styles.stylePill, { backgroundColor: colors.white, borderColor: colors.border }, field.style.bold && { backgroundColor: colors.neutral, borderColor: colors.neutral }]} onPress={() => onUpdateStyle({ bold: !field.style.bold })}>
                  <Text style={[styles.stylePillText, { color: colors.neutral, fontWeight: '800' }, field.style.bold && { color: colors.white }]}>B</Text>
                </Pressable>
                <Pressable style={[styles.stylePill, { backgroundColor: colors.white, borderColor: colors.border }, field.style.italic && { backgroundColor: colors.neutral, borderColor: colors.neutral }]} onPress={() => onUpdateStyle({ italic: !field.style.italic })}>
                  <Text style={[styles.stylePillText, { color: colors.neutral, fontStyle: 'italic' }, field.style.italic && { color: colors.white }]}>I</Text>
                </Pressable>
              </View>

              <Text style={[styles.miniLabel, { color: colors.secondary }]}>Alinhamento</Text>
              <View style={[styles.alignRow, { backgroundColor: colors.white, borderColor: colors.border }]}>
                {[
                  { value: 'left' as const, Icon: AlignLeft },
                  { value: 'center' as const, Icon: AlignCenter },
                  { value: 'right' as const, Icon: AlignRight },
                ].map(({ value, Icon }) => (
                  <Pressable
                    key={value}
                    style={[styles.alignOption, field.style.align === value && { backgroundColor: colors.primaryLight }]}
                    onPress={() => onUpdateStyle({ align: value })}
                  >
                    <Icon size={18} color={field.style.align === value ? colors.primary : colors.secondary} />
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionLabel, { color: colors.neutral }]}>Largura (px)</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.neutral }]}
                  keyboardType="numeric"
                  value={String(Math.round(field.position.width))}
                  onChangeText={(t) => {
                    const w = parseInt(t, 10);
                    if (!isNaN(w) && w > 0) onUpdate({ position: { ...field.position, width: w } });
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionLabel, { color: colors.neutral }]}>Altura (px)</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.neutral }]}
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

          <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
            <Pressable style={[styles.duplicateButton, { borderColor: colors.border }]} onPress={onDuplicate}>
              <Copy size={20} color={colors.neutral} />
            </Pressable>
            <Pressable style={[styles.deleteButton, { borderColor: colors.danger }]} onPress={onDelete}>
              <Trash2 size={20} color={colors.danger} />
            </Pressable>
            <Pressable style={[styles.doneButton, { backgroundColor: colors.primary }]} onPress={onClose}>
              <Text style={[styles.doneButtonText, { color: colors.white }]}>Salvar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingHorizontal: spacing.md, paddingTop: spacing.sm, maxHeight: '90%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { fontSize: 18, fontWeight: '700' },
  closeButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: typography.label, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.xs },
  miniLabel: { fontSize: 12, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, fontSize: typography.body },
  dropdown: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { fontSize: typography.body, flex: 1 },
  dropdownMenu: { borderWidth: 1, borderRadius: radius.sm, marginTop: 4, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderBottomWidth: 1 },
  dropdownItemText: { fontSize: typography.label },
  emptyMenuHint: { fontSize: 11, padding: spacing.sm },
  configBox: { borderRadius: radius.md, padding: spacing.sm, marginTop: spacing.sm },
  configLabel: { fontSize: typography.label, fontWeight: '600', marginBottom: spacing.xs },
  previewBox: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.md, minHeight: 44, justifyContent: 'center' },
  requiredRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, marginRight: spacing.sm },
  checkboxText: { fontSize: typography.label },
  requiredText: { fontSize: typography.label },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowWrap: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  typographyCard: { borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm },
  typographyTitle: { fontSize: typography.body, fontWeight: '700', marginBottom: spacing.xs },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stepButton: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  stepButtonText: { fontSize: 18, fontWeight: '700' },
  stepValue: { fontSize: typography.body, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  swatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  hexBox: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  hexDot: { width: 14, height: 14, borderRadius: 7 },
  hexText: { fontSize: 12, fontWeight: '600' },
  stylePill: { width: 34, height: 34, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stylePillText: { fontSize: 15 },
  alignRow: { flexDirection: 'row', borderRadius: radius.sm, borderWidth: 1, overflow: 'hidden' },
  alignOption: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  pill: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: 1 },
  pillText: { fontSize: typography.label, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.md, borderTopWidth: 1 },
  duplicateButton: { width: 52, height: 52, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  deleteButton: { width: 52, height: 52, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  doneButton: { flex: 1, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  doneButtonText: { fontWeight: '700', fontSize: typography.body },
});