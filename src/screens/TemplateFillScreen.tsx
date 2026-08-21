// Tela do Modo 2 (Preenchimento do Template).

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, Dimensions, ScrollView,
  TextInput, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import { PDFDocument } from 'pdf-lib';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ArrowLeft, Table } from 'lucide-react-native';
import { spacing, radius, typography } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import { useTemplateFillStore } from '../store/useTemplateFillStore';
import { getTemplateById, saveTemplate } from '../services/templateStorage';
import { getSpreadsheetByTemplateId, appendSpreadsheetRow, type SpreadsheetEntry } from '../services/spreadsheetsStorage';
import { currencyToWords, plainNumberToWords } from '../utils/numberToWords';
import { applyMaskFor, maskFullDate, maskDayOrMonth, maskYear } from '../utils/masks';
import { DEFAULT_DATE_CONFIG, MONTH_OPTIONS, formatDateValue, placeholderForDateConfig, rawValueFromDate } from '../utils/dateFormat';
import type { Template, TemplateField } from '../types/template';
import { DEFAULT_AUTO_INCREMENT_CONFIG, formatAutoIncrement, nextAutoIncrementNumber } from '../utils/autoIncrement';

const SCREEN_WIDTH = Dimensions.get('window').width;

function keyboardTypeFor(type: TemplateField['type']) {
  switch (type) {
    case 'numero':
    case 'valor':
    case 'numeroPorExtenso':
    case 'cpf':
    case 'cnpj':
    case 'telefone':
      return 'numeric' as const;
    default:
      return 'default' as const;
  }
}

function sanitizeFileName(name: string) {
  return name.trim().replace(/[\\/:*?"<>|]/g, '').slice(0, 80) || 'documento';
}

// Aplica a máscara certa conforme o tipo, enquanto o usuário digita.
function maskForField(field: TemplateField, raw: string): string {
  if (field.type === 'cpf') return applyMaskFor('cpf', raw);
  if (field.type === 'cnpj') return applyMaskFor('cnpj', raw);
  if (field.type === 'telefone') return applyMaskFor('telefone', raw);
  if (field.type === 'valor') return applyMaskFor('valor', raw);
  if (field.type === 'data') {
    const cfg = field.dateConfig ?? DEFAULT_DATE_CONFIG;
    if (cfg.parts.length === 3) return maskFullDate(raw);
    if (cfg.parts[0] === 'ano') return maskYear(raw);
    return maskDayOrMonth(raw);
  }
  return raw;
}

function placeholderForField(field: TemplateField): string {
  switch (field.type) {
    case 'cpf': return '000.000.000-00';
    case 'cnpj': return '00.000.000/0000-00';
    case 'hora': return 'HH:MM';
    case 'valor': return '0,00';
    case 'valorPorExtenso': return 'Ex: 150,00';
    case 'numeroPorExtenso': return 'Ex: 10';
    case 'telefone': return '(00) 00000-0000';
    case 'textoFixo': return field.defaultText || 'Texto fixo';
    case 'data': return placeholderForDateConfig(field.dateConfig ?? DEFAULT_DATE_CONFIG);
    default: return '';
  }
}

// Resolve o texto FINAL que aparece no PDF (e na planilha) pra cada
// campo, já aplicando: extenso, vínculo de valor, formato de data,
// símbolo R$.
function resolveFinalValue(
  field: TemplateField,
  values: Record<string, string>,
  allFields: TemplateField[]
): string {
  if (field.type === 'textoFixo') return values[field.id] ?? field.defaultText ?? '';
  if (field.type === 'valorPorExtenso') {
    if (field.linkedValorFieldId) {
      const linked = allFields.find((f) => f.id === field.linkedValorFieldId);
      const linkedRaw = linked ? values[linked.id] : undefined;
      return linkedRaw ? currencyToWords(linkedRaw) : '';
    }
    return currencyToWords(values[field.id] ?? '');
  }
  if (field.type === 'numeroPorExtenso') return plainNumberToWords(values[field.id] ?? '');
  if (field.type === 'valor') {
    const raw = values[field.id] ?? '';
    const symbol = field.valorConfig?.showSymbol ?? true;
    return raw ? `${symbol ? 'R$ ' : ''}${raw}` : '';
  }
  if (field.type === 'data') {
    const cfg = field.dateConfig ?? DEFAULT_DATE_CONFIG;
    return formatDateValue(cfg, values[field.id] ?? '');
  }
  return values[field.id] ?? '';
}

export default function TemplateFillScreen({ route, navigation }: any) {
  const templateId: string = route.params.templateId;
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const viewShotRef = useRef<ViewShot>(null);

  const { getSession, setValues: persistValues, patchValue: persistValue, setFileName: persistFileName } = useTemplateFillStore();

  const [template, setTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [linkedSpreadsheet, setLinkedSpreadsheet] = useState<SpreadsheetEntry | null>(null);
  const [saveToSpreadsheet, setSaveToSpreadsheet] = useState(true);
  const [monthPickerFieldId, setMonthPickerFieldId] = useState<string | null>(null);

  useEffect(() => {
    getTemplateById(templateId).then((t) => {
      if (t) {
        const session = getSession(templateId);
        setTemplate(t);
        setValues(session?.values ?? {});
        setFileName(session?.fileName ?? t.name);
      } else {
        Alert.alert('Template não encontrado');
        navigation.goBack();
      }
    });
  }, [templateId, getSession]);

  useEffect(() => {
    getSpreadsheetByTemplateId(templateId).then((s) => setLinkedSpreadsheet(s ?? null));
  }, [templateId]);

  useEffect(() => {
    if (!template) return;
    const autoValues: Record<string, string> = {};
    template.fields.forEach((f) => {
      if (f.type === 'textoFixo') {
        autoValues[f.id] = f.defaultText ?? '';
      }
      if (f.type === 'autoIncremento') {
        const config = f.autoIncrementConfig ?? DEFAULT_AUTO_INCREMENT_CONFIG;
        const nextRaw = nextAutoIncrementNumber(template, config);
        autoValues[f.id] = formatAutoIncrement(nextRaw, config);
      }
      if (f.type === 'data' && f.dateConfig?.auto) {
        autoValues[f.id] = rawValueFromDate(f.dateConfig);
      }
    });
    if (Object.keys(autoValues).length > 0) {
      setValues((prev) => {
        const next = { ...autoValues, ...prev };
        persistValues(template.id, next);
        return next;
      });
    }
  }, [template, persistValues]);

  if (!template) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const displayWidth = SCREEN_WIDTH - spacing.md * 2;
  const scale = template.pageWidth ? displayWidth / template.pageWidth : 1;
  const displayHeight = template.pageHeight * scale;

  function setValue(fieldId: string, text: string) {
    setValues((prev) => ({ ...prev, [fieldId]: text }));
    persistValue(templateId, fieldId, text);
  }

  function setDatePart(field: TemplateField, part: 'dia' | 'mes' | 'ano', text: string) {
    const cfg = field.dateConfig ?? DEFAULT_DATE_CONFIG;
    if (cfg.parts.length !== 3) {
      setValue(field.id, part === 'ano' ? maskYear(text) : maskDayOrMonth(text));
      return;
    }
    const [day = '', month = '', year = ''] = (values[field.id] ?? '').split('/');
    const next = { dia: day, mes: month, ano: year, [part]: part === 'ano' ? maskYear(text) : maskDayOrMonth(text) };
    setValue(field.id, `${next.dia}/${next.mes}/${next.ano}`);
  }

  function renderDateInput(field: TemplateField) {
    const cfg = field.dateConfig ?? DEFAULT_DATE_CONFIG;
    const rawValue = values[field.id] ?? '';
    const [day = '', month = '', year = ''] = rawValue.split('/');
    const selectedMonth = cfg.parts.length === 3 ? month : rawValue;
    const selectedMonthLabel = selectedMonth ? formatDateValue({ ...cfg, parts: ['mes'], auto: false }, selectedMonth) : 'Selecionar mês';

    if (cfg.parts.length === 3) {
      return (
        <View style={styles.dateRow}>
          <TextInput
            style={[styles.formInput, styles.datePartInput, { borderColor: colors.border, color: colors.neutral }]}
            value={day}
            onChangeText={(t) => setDatePart(field, 'dia', t)}
            placeholder="DD"
            placeholderTextColor={colors.secondary}
            keyboardType="numeric"
          />
          <Pressable style={[styles.monthSelect, { borderColor: colors.border }]} onPress={() => setMonthPickerFieldId(field.id)}>
            <Text style={[styles.monthSelectText, { color: selectedMonth ? colors.neutral : colors.secondary }]}>{selectedMonthLabel}</Text>
          </Pressable>
          <TextInput
            style={[styles.formInput, styles.yearPartInput, { borderColor: colors.border, color: colors.neutral }]}
            value={year}
            onChangeText={(t) => setDatePart(field, 'ano', t)}
            placeholder="AAAA"
            placeholderTextColor={colors.secondary}
            keyboardType="numeric"
          />
        </View>
      );
    }

    if (cfg.parts[0] === 'mes') {
      return (
        <Pressable style={[styles.formInput, styles.monthOnlySelect, { borderColor: colors.border }]} onPress={() => setMonthPickerFieldId(field.id)}>
          <Text style={{ color: rawValue ? colors.neutral : colors.secondary }}>{rawValue ? selectedMonthLabel : placeholderForField(field)}</Text>
        </Pressable>
      );
    }

    return (
      <TextInput
        style={[styles.formInput, { borderColor: colors.border, color: colors.neutral }]}
        value={rawValue}
        onChangeText={(t) => setValue(field.id, maskForField(field, t))}
        placeholder={placeholderForField(field)}
        placeholderTextColor={colors.secondary}
        keyboardType="numeric"
      />
    );
  }

  // Monta a linha que vai pra planilha, respeitando a config de
  // colunas definida no SpreadsheetLinkModal (coluna fixa "Data/Hora"
  // + uma coluna por campo mapeado).
  function buildSpreadsheetRow(tpl: Template, sheet: SpreadsheetEntry): Record<string, string> {
    const row: Record<string, string> = {};
    sheet.columns.forEach((col) => {
      if (col.fieldId === null) {
        row[col.id] = new Date().toLocaleString('pt-BR');
        return;
      }
      const field = tpl.fields.find((f) => f.id === col.fieldId);
      row[col.id] = field ? resolveFinalValue(field, values, tpl.fields) : '';
    });
    return row;
  }

  async function handleConfirmGenerate() {
    setShowNameModal(false);
    setGenerating(true);
    try {
      const shotUri = await viewShotRef.current!.capture!();
      const shotFile = new File(shotUri);
      const pngBytes = await shotFile.bytes();

      const pdfDoc = await PDFDocument.create();
      const pngImage = await pdfDoc.embedPng(pngBytes);
      const page = pdfDoc.addPage([template!.pageWidth, template!.pageHeight]);
      page.drawImage(pngImage, { x: 0, y: 0, width: template!.pageWidth, height: template!.pageHeight });
      const pdfBytes = await pdfDoc.save();

      const finalName = `${sanitizeFileName(fileName)}.pdf`;
      const outFile = new File(Paths.cache, finalName);
      if (outFile.exists) outFile.delete();
      outFile.create();
      outFile.write(pdfBytes);

      const hasAutoIncrement = template!.fields.some((f) => f.type === 'autoIncremento');
      if (hasAutoIncrement) {
        const autoField = template!.fields.find((f) => f.type === 'autoIncremento')!;
        const config = autoField.autoIncrementConfig ?? DEFAULT_AUTO_INCREMENT_CONFIG;
        const usedRaw = nextAutoIncrementNumber(template!, config);
        await saveTemplate({
          ...template!,
          autoIncrementCounter: usedRaw + 1,
          updatedAt: Date.now(),
        });
      }

      if (linkedSpreadsheet && saveToSpreadsheet) {
        const row = buildSpreadsheetRow(template!, linkedSpreadsheet);
        await appendSpreadsheetRow(linkedSpreadsheet.id, row);
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(outFile.uri, {
          mimeType: 'application/pdf', dialogTitle: 'Compartilhar PDF', UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF gerado', `Salvo em: ${outFile.uri}`);
      }
    } catch (err: any) {
      Alert.alert('Erro ao gerar PDF', String(err?.message ?? err));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.neutral} />
        </Pressable>
        <Text style={[styles.toolbarTitle, { color: colors.neutral }]} numberOfLines={1}>Preencher Template</Text>
        <Pressable onPress={() => setShowNameModal(true)} disabled={generating}>
          <Text style={[styles.toolbarAction, { color: colors.primary }, generating && { opacity: 0.4 }]}>Concluir</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl + insets.bottom }}>
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: colors.neutral }]}>Dados do Documento</Text>
          {template.fields.map((field) => {
            const isReadOnly = field.type === 'autoIncremento';
            const isDerivedExtenso = field.type === 'valorPorExtenso' && !!field.linkedValorFieldId;

            return (
              <View key={field.id} style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.secondary }]}>
                  {field.internalName || 'Campo'}
                  {field.required && <Text style={[styles.required, { color: colors.danger }]}> *</Text>}
                </Text>

                {isReadOnly ? (
                  <View style={[styles.autoBox, { borderColor: colors.border, backgroundColor: colors.tertiary }]}>
                    <Text style={[styles.autoValue, { color: colors.neutral }]}>
                      {resolveFinalValue(field, values, template.fields) || (field.type === 'autoIncremento' ? values[field.id] : '')}
                    </Text>
                    <Text style={[styles.autoTag, { color: colors.primary, backgroundColor: colors.primaryLight }]}>Automático</Text>
                  </View>
                ) : isDerivedExtenso ? (
                  <View style={[styles.autoBox, { borderColor: colors.border, backgroundColor: colors.tertiary }]}>
                    <Text style={[styles.autoValue, { color: colors.neutral }]} numberOfLines={2}>
                      {resolveFinalValue(field, values, template.fields) || 'Preencha o campo de valor vinculado'}
                    </Text>
                    <Text style={[styles.autoTag, { color: colors.primary, backgroundColor: colors.primaryLight }]}>Vinculado</Text>
                  </View>
                ) : (
                  <>
                    {field.type === 'data' ? renderDateInput(field) : (
                    <TextInput
                      style={[
                        styles.formInput,
                        { borderColor: colors.border, color: colors.neutral },
                        (field.type === 'textoMultilinha') && styles.formInputMultiline,
                      ]}
                      value={values[field.id] ?? ''}
                      onChangeText={(t) => setValue(field.id, maskForField(field, t))}
                      placeholder={placeholderForField(field)}
                      placeholderTextColor={colors.secondary}
                      keyboardType={keyboardTypeFor(field.type)}
                      multiline={field.type === 'textoMultilinha'}
                      numberOfLines={field.type === 'textoMultilinha' ? 4 : 1}
                    />
                    )}
                    {(field.type === 'valorPorExtenso' || field.type === 'numeroPorExtenso') &&
                      !!values[field.id] && (
                        <Text style={[styles.extensoPreview, { color: colors.primary }]} numberOfLines={2}>
                          {resolveFinalValue(field, values, template.fields)}
                        </Text>
                      )}
                  </>
                )}
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.neutral }]}>Prévia</Text>
        <View style={styles.previewWrapper}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={{ width: displayWidth, height: displayHeight }}>
            <Image source={{ uri: template.pdfUri }} style={{ width: displayWidth, height: displayHeight }} resizeMode="contain" />
            {template.fields.map((field) => {
              const finalValue = resolveFinalValue(field, values, template.fields);
              return (
                <Text
                  key={field.id}
                  numberOfLines={field.type === 'textoMultilinha' ? field.maxLines ?? 4 : 1}
                  style={{
                    position: 'absolute',
                    left: field.position.x * scale,
                    top: field.position.y * scale,
                    width: field.position.width * scale,
                    height: field.position.height * scale,
                    fontSize: (field.style.fontSize ?? 12) * scale,
                    color: field.style.color || colors.neutral,
                    fontWeight: field.style.bold ? '700' : '400',
                    fontStyle: field.style.italic ? 'italic' : 'normal',
                    textAlign: field.style.align,
                  }}
                >
                  {finalValue}
                </Text>
              );
            })}
          </ViewShot>
        </View>
      </ScrollView>

      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.white, paddingBottom: spacing.md + insets.bottom }]}>
            <Text style={[styles.modalTitle, { color: colors.neutral }]}>Nome do Arquivo</Text>
            <TextInput
              autoFocus
              style={[styles.nameInput, { borderColor: colors.border, color: colors.neutral }]}
              value={fileName}
              onChangeText={(text) => { setFileName(text); persistFileName(templateId, text); }}
              placeholder="Ex: Contrato João da Silva"
              placeholderTextColor={colors.secondary}
            />

            {linkedSpreadsheet && (
              <Pressable style={styles.spreadsheetCheckRow} onPress={() => setSaveToSpreadsheet((v) => !v)}>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: colors.border },
                    saveToSpreadsheet && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                />
                <Table size={16} color={colors.secondary} />
                <Text style={[styles.spreadsheetCheckText, { color: colors.neutral }]} numberOfLines={2}>
                  Salvar também na planilha "{linkedSpreadsheet.name}"
                </Text>
              </Pressable>
            )}

            <Pressable style={[styles.confirmButton, { backgroundColor: colors.primary }]} onPress={handleConfirmGenerate}>
              <Text style={styles.confirmButtonText}>Gerar e Compartilhar</Text>
            </Pressable>
            <Pressable onPress={() => setShowNameModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.secondary }]}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>


      <Modal visible={!!monthPickerFieldId} transparent animationType="fade" onRequestClose={() => setMonthPickerFieldId(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.white, paddingBottom: spacing.md + insets.bottom }]}> 
            <Text style={[styles.modalTitle, { color: colors.neutral }]}>Selecionar mês</Text>
            {MONTH_OPTIONS.map((month) => (
              <Pressable
                key={month.value}
                style={[styles.monthOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  const field = template.fields.find((f) => f.id === monthPickerFieldId);
                  if (field) setDatePart(field, 'mes', month.value);
                  setMonthPickerFieldId(null);
                }}
              >
                <Text style={[styles.monthOptionText, { color: colors.neutral }]}>{month.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {generating && (
        <View style={styles.overlayLoading}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.overlayLoadingText}>Gerando PDF...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toolbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  toolbarTitle: { fontSize: typography.body, fontWeight: '600', flex: 1, textAlign: 'center' },
  toolbarAction: { fontSize: typography.body, fontWeight: '700' },
  formSection: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  sectionTitle: {
    fontSize: typography.body, fontWeight: '700',
    marginBottom: spacing.sm, paddingHorizontal: spacing.md,
  },
  formField: { marginBottom: spacing.md },
  formLabel: { fontSize: typography.label, fontWeight: '600', marginBottom: spacing.xs },
  required: {},
  formInput: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, fontSize: typography.body },
  formInputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', gap: spacing.xs },
  datePartInput: { flex: 0.8 },
  yearPartInput: { flex: 1 },
  monthSelect: { flex: 1.4, borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, justifyContent: 'center' },
  monthOnlySelect: { justifyContent: 'center' },
  monthSelectText: { fontSize: typography.body },
  extensoPreview: { fontSize: typography.label, fontStyle: 'italic', marginTop: spacing.xs, paddingHorizontal: 2 },
  autoBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm,
  },
  autoValue: { fontSize: typography.body, fontWeight: '700', flex: 1, marginRight: spacing.sm },
  autoTag: {
    fontSize: 11, paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.full,
  },
  previewWrapper: { alignItems: 'center', paddingHorizontal: spacing.md, marginTop: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.md, paddingBottom: spacing.md },
  modalTitle: { fontSize: typography.body, fontWeight: '700', marginBottom: spacing.md },
  nameInput: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.md },
  spreadsheetCheckRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2 },
  spreadsheetCheckText: { flex: 1, fontSize: typography.label, fontWeight: '600' },
  monthOption: { paddingVertical: spacing.sm, borderBottomWidth: 1 },
  monthOptionText: { fontSize: typography.body, textTransform: 'capitalize' },
  confirmButton: { paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontWeight: '700' },
  modalCancel: { textAlign: 'center', marginTop: spacing.sm, paddingVertical: spacing.sm },
  overlayLoading: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  overlayLoadingText: { color: '#fff', marginTop: spacing.sm, fontWeight: '600' },
});