// Tela do Modo 2 (Preenchimento do Template).
//
// Gera o formulário automaticamente a partir dos campos do template,
// mostra uma prévia ao vivo com os valores digitados posicionados sobre
// o PDF, e ao concluir tira um "print" dessa prévia (react-native-view-shot),
// embute a imagem num PDF de 1 página (pdf-lib, no tamanho exato da
// página original) e compartilha via menu nativo (inclui WhatsApp).
//
// Campos do tipo 'valorPorExtenso'/'numeroPorExtenso' mostram, embaixo
// do input, uma prévia do texto por extenso gerado automaticamente.
// Campos 'autoIncremento' são somente-leitura e usam o próximo número
// da sequência do template (persistido em autoIncrementCounter).

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
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
import type { Template, TemplateField } from '../types/template';

const SCREEN_WIDTH = Dimensions.get('window').width;

function keyboardTypeFor(type: TemplateField['type']) {
  switch (type) {
    case 'numero':
    case 'valor':
    case 'numeroPorExtenso':
    case 'cpf':
    case 'cnpj':
      return 'numeric' as const;
    case 'telefone':
      return 'phone-pad' as const;
    default:
      return 'default' as const;
  }
}

function placeholderFor(type: TemplateField['type']) {
  switch (type) {
    case 'cpf':
      return '000.000.000-00';
    case 'cnpj':
      return '00.000.000/0000-00';
    case 'data':
      return 'DD/MM/AAAA';
    case 'hora':
      return 'HH:MM';
    case 'valor':
      return 'R$ 0,00';
    case 'valorPorExtenso':
      return 'Ex: 150,00';
    case 'numeroPorExtenso':
      return 'Ex: 10';
    case 'telefone':
      return '(00) 00000-0000';
    default:
      return '';
  }
}

function sanitizeFileName(name: string) {
  return name.trim().replace(/[\\/:*?"<>|]/g, '').slice(0, 80) || 'documento';
}

// Converte o valor "cru" digitado pelo usuário no texto final que
// aparece no PDF — é aqui que 'valorPorExtenso'/'numeroPorExtenso'
// viram texto por extenso, e 'autoIncremento' já vem pronto.
function displayValueFor(field: TemplateField, rawValue: string | undefined): string {
  const raw = rawValue ?? '';
  if (field.type === 'valorPorExtenso') return currencyToWords(raw);
  if (field.type === 'numeroPorExtenso') return plainNumberToWords(raw);
  return raw;
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

  // Pré-preenche campos de numeração automática com o próximo número
  // da sequência assim que o template carrega.
  useEffect(() => {
    if (!template) return;
    const nextNumber = (template.autoIncrementCounter ?? 0) + 1;
    const autoValues: Record<string, string> = {};
    template.fields.forEach((f) => {
      if (f.type === 'autoIncremento') {
        autoValues[f.id] = String(nextNumber);
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

  async function handleConcluir() {
    setShowNameModal(true);
  }

  async function handleConfirmGenerate() {
    setShowNameModal(false);
    setGenerating(true);
    try {
      // 1. Captura a prévia (PDF + valores digitados) como PNG
      const shotUri = await viewShotRef.current!.capture!();
      const shotFile = new File(shotUri);
      const pngBytes = await shotFile.bytes();

      // 2. Monta um PDF de 1 página no tamanho exato da página original,
      // com a imagem capturada ocupando a página inteira
      const pdfDoc = await PDFDocument.create();
      const pngImage = await pdfDoc.embedPng(pngBytes);
      const page = pdfDoc.addPage([template!.pageWidth, template!.pageHeight]);
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: template!.pageWidth,
        height: template!.pageHeight,
      });
      const pdfBytes = await pdfDoc.save();

      // 3. Salva no cache com o nome escolhido pelo usuário
      const finalName = `${sanitizeFileName(fileName)}.pdf`;
      const outFile = new File(Paths.cache, finalName);
      if (outFile.exists) outFile.delete();
      outFile.create();
      outFile.write(pdfBytes);

      // 4. Se houver campo de numeração automática, avança o contador
      // do template pra próxima vez que alguém preencher
      const hasAutoIncrement = template!.fields.some((f) => f.type === 'autoIncremento');
      if (hasAutoIncrement) {
        await saveTemplate({
          ...template!,
          autoIncrementCounter: (template!.autoIncrementCounter ?? 0) + 1,
          updatedAt: Date.now(),
        });
      }

      // 5. Abre o menu nativo de compartilhamento (WhatsApp aparece aqui)
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(outFile.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar PDF',
          UTI: 'com.adobe.pdf',
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
        <Text style={styles.toolbarTitle} numberOfLines={1}>
          Preencher Template
        </Text>
        <Pressable onPress={handleConcluir} disabled={generating}>
          <Text style={[styles.toolbarAction, generating && { opacity: 0.4 }]}>
            Concluir
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Dados do Documento</Text>
          {template.fields.map((field) => (
            <View key={field.id} style={styles.formField}>
              <Text style={styles.formLabel}>
                {field.internalName || 'Campo'}
                {field.required && <Text style={styles.required}> *</Text>}
              </Text>

              {field.type === 'autoIncremento' ? (
                <View style={styles.autoIncrementBox}>
                  <Text style={styles.autoIncrementValue}>{values[field.id]}</Text>
                  <Text style={styles.autoIncrementTag}>Automático</Text>
                </View>
              ) : (
                <>
                  <TextInput
                    style={[
                      styles.formInput,
                      field.type === 'textoMultilinha' && styles.formInputMultiline,
                    ]}
                    value={values[field.id] ?? ''}
                    onChangeText={(t) => setValue(field.id, t)}
                    placeholder={placeholderFor(field.type)}
                    keyboardType={keyboardTypeFor(field.type)}
                    multiline={field.type === 'textoMultilinha'}
                    numberOfLines={field.type === 'textoMultilinha' ? 4 : 1}
                  />
                  {(field.type === 'valorPorExtenso' || field.type === 'numeroPorExtenso') &&
                    !!values[field.id] && (
                      <Text style={styles.extensoPreview} numberOfLines={2}>
                        {displayValueFor(field, values[field.id])}
                      </Text>
                    )}
                </>
              )}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Prévia</Text>
        <View style={styles.previewWrapper}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1 }}
            style={{ width: displayWidth, height: displayHeight }}
          >
            <Image
              source={{ uri: template.pdfUri }}
              style={{ width: displayWidth, height: displayHeight }}
              resizeMode="contain"
            />
            {template.fields.map((field) => {
              const finalValue = displayValueFor(field, values[field.id]);
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
            <TextInput
              autoFocus
              style={styles.nameInput}
              value={fileName}
              onChangeText={setFileName}
              placeholder="Ex: Contrato João da Silva"
            />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toolbarTitle: { fontSize: typography.body, fontWeight: '600', flex: 1, textAlign: 'center' },
  toolbarAction: { fontSize: typography.body, color: colors.primary, fontWeight: '700' },
  formSection: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  sectionTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.neutral,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  formField: { marginBottom: spacing.md },
  formLabel: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: spacing.xs,
  },
  required: { color: colors.danger },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: typography.body,
  },
  formInputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  extensoPreview: {
    fontSize: typography.label,
    color: colors.primary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    paddingHorizontal: 2,
  },
  autoIncrementBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    backgroundColor: colors.tertiary,
  },
  autoIncrementValue: { fontSize: typography.body, fontWeight: '700', color: colors.neutral },
  autoIncrementTag: {
    fontSize: 11,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  previewWrapper: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
  },
  modalTitle: { fontSize: typography.body, fontWeight: '700', marginBottom: spacing.md },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  confirmButtonText: { color: colors.white, fontWeight: '700' },
  modalCancel: {
    textAlign: 'center',
    color: colors.secondary,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  overlayLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayLoadingText: { color: colors.white, marginTop: spacing.sm, fontWeight: '600' },
});