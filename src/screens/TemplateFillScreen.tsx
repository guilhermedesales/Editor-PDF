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
import { ArrowLeft } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../constants/theme';
import { getTemplateById, saveTemplate } from '../services/templateStorage';
import { currencyToWords, plainNumberToWords } from '../utils/numberToWords';
import { applyMaskFor, maskFullDate, maskDayOrMonth, maskYear } from '../utils/masks';
import { DEFAULT_DATE_CONFIG, formatDateValue, placeholderForDateConfig } from '../utils/dateFormat';
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
    case 'data': return placeholderForDateConfig(field.dateConfig ?? DEFAULT_DATE_CONFIG);
    default: return '';
  }
}

// Resolve o texto FINAL que aparece no PDF pra cada campo, já
// aplicando: extenso, vínculo de valor, formato de data, símbolo R$.
function resolveFinalValue(
  field: TemplateField,
  values: Record<string, string>,
  allFields: TemplateField[]
): string {
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
  const viewShotRef = useRef<ViewShot>(null);

  const [template, setTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    getTemplateById(templateId).then((t) => {
      if (t) {
        setTemplate(t);
        setFileName(t.name);
      } else {
        Alert.alert('Template não encontrado');
        navigation.goBack();
      }
    });
  }, [templateId]);

  useEffect(() => {
    if (!template) return;
    const autoValues: Record<string, string> = {};
    template.fields.forEach((f) => {
      if (f.type === 'autoIncremento') {
        const config = f.autoIncrementConfig ?? DEFAULT_AUTO_INCREMENT_CONFIG;
        const nextRaw = nextAutoIncrementNumber(template, config);
        autoValues[f.id] = formatAutoIncrement(nextRaw, config);
      }
    });
    if (Object.keys(autoValues).length > 0) {
      setValues((prev) => ({ ...autoValues, ...prev }));
    }
  }, [template]);

  if (!template) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const displayWidth = SCREEN_WIDTH - spacing.md * 2;
  const scale = template.pageWidth ? displayWidth / template.pageWidth : 1;
  const displayHeight = template.pageHeight * scale;

  function setValue(fieldId: string, text: string) {
    setValues((prev) => ({ ...prev, [fieldId]: text }));
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.neutral} />
        </Pressable>
        <Text style={styles.toolbarTitle} numberOfLines={1}>Preencher Template</Text>
        <Pressable onPress={() => setShowNameModal(true)} disabled={generating}>
          <Text style={[styles.toolbarAction, generating && { opacity: 0.4 }]}>Concluir</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Dados do Documento</Text>
          {template.fields.map((field) => {
            const isReadOnly = field.type === 'autoIncremento' || (field.type === 'data' && field.dateConfig?.auto);
            const isDerivedExtenso = field.type === 'valorPorExtenso' && !!field.linkedValorFieldId;

            return (
              <View key={field.id} style={styles.formField}>
                <Text style={styles.formLabel}>
                  {field.internalName || 'Campo'}
                  {field.required && <Text style={styles.required}> *</Text>}
                </Text>

                {isReadOnly ? (
                  <View style={styles.autoBox}>
                    <Text style={styles.autoValue}>
                      {resolveFinalValue(field, values, template.fields) || (field.type === 'autoIncremento' ? values[field.id] : '')}
                    </Text>
                    <Text style={styles.autoTag}>Automático</Text>
                  </View>
                ) : isDerivedExtenso ? (
                  <View style={styles.autoBox}>
                    <Text style={styles.autoValue} numberOfLines={2}>
                      {resolveFinalValue(field, values, template.fields) || 'Preencha o campo de valor vinculado'}
                    </Text>
                    <Text style={styles.autoTag}>Vinculado</Text>
                  </View>
                ) : (
                  <>
                    <TextInput
                      style={[styles.formInput, field.type === 'textoMultilinha' && styles.formInputMultiline]}
                      value={values[field.id] ?? ''}
                      onChangeText={(t) => setValue(field.id, maskForField(field, t))}
                      placeholder={placeholderForField(field)}
                      keyboardType={keyboardTypeFor(field.type)}
                      multiline={field.type === 'textoMultilinha'}
                      numberOfLines={field.type === 'textoMultilinha' ? 4 : 1}
                    />
                    {(field.type === 'valorPorExtenso' || field.type === 'numeroPorExtenso') &&
                      !!values[field.id] && (
                        <Text style={styles.extensoPreview} numberOfLines={2}>
                          {resolveFinalValue(field, values, template.fields)}
                        </Text>
                      )}
                  </>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Prévia</Text>
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
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Nome do Arquivo</Text>
            <TextInput autoFocus style={styles.nameInput} value={fileName} onChangeText={setFileName} placeholder="Ex: Contrato João da Silva" />
            <Pressable style={styles.confirmButton} onPress={handleConfirmGenerate}>
              <Text style={styles.confirmButtonText}>Gerar e Compartilhar</Text>
            </Pressable>
            <Pressable onPress={() => setShowNameModal(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {generating && (
        <View style={styles.overlayLoading}>
          <ActivityIndicator color={colors.white} size="large" />
          <Text style={styles.overlayLoadingText}>Gerando PDF...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toolbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  toolbarTitle: { fontSize: typography.body, fontWeight: '600', flex: 1, textAlign: 'center' },
  toolbarAction: { fontSize: typography.body, color: colors.primary, fontWeight: '700' },
  formSection: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  sectionTitle: {
    fontSize: typography.body, fontWeight: '700', color: colors.neutral,
    marginBottom: spacing.sm, paddingHorizontal: spacing.md,
  },
  formField: { marginBottom: spacing.md },
  formLabel: { fontSize: typography.label, fontWeight: '600', color: colors.secondary, marginBottom: spacing.xs },
  required: { color: colors.danger },
  formInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, fontSize: typography.body },
  formInputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  extensoPreview: { fontSize: typography.label, color: colors.primary, fontStyle: 'italic', marginTop: spacing.xs, paddingHorizontal: 2 },
  autoBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm,
    backgroundColor: colors.tertiary,
  },
  autoValue: { fontSize: typography.body, fontWeight: '700', color: colors.neutral, flex: 1, marginRight: spacing.sm },
  autoTag: {
    fontSize: 11, color: colors.primary, backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.full,
  },
  previewWrapper: { alignItems: 'center', paddingHorizontal: spacing.md, marginTop: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.md },
  modalTitle: { fontSize: typography.body, fontWeight: '700', marginBottom: spacing.md },
  nameInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.md },
  confirmButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  confirmButtonText: { color: colors.white, fontWeight: '700' },
  modalCancel: { textAlign: 'center', color: colors.secondary, marginTop: spacing.sm, paddingVertical: spacing.sm },
  overlayLoading: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  overlayLoadingText: { color: colors.white, marginTop: spacing.sm, fontWeight: '600' },
});