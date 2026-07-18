// Tela principal do Modo 1 (Configuração do Template).

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, Dimensions, Modal, TextInput, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radius, typography, colors } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import { useEditorStore } from '../store/useEditorstorage';
import PdfPageRasterizer from '../components/PdfPageRasterizer';
import FieldOverlay from '../components/FieldOverlay';
import FieldEditorSheet from '../components/FieldEditorSheet';
import ZoomablePdfView from '../components/ZoomablePdfView';
import FieldTypePicker from '../components/FieldTypePicker';
import ToolSidebar, { EditorTool } from '../components/ToolSidebar';
import TemplatePreviewModal from '../components/TemplatePreviewModal';
import { saveTemplate, getTemplateById } from '../services/templateStorage';
import type { FieldType, TemplateField } from '../types/template';
import { Plus, ChevronLeft, FileText, Eye, Pencil } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function TemplateEditorScreen({ route, navigation }: any) {
  const templateId: string | undefined = route.params?.templateId;
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();

  const {
    pdfUri, pageWidth, pageHeight, fields, selectedFieldId, templateName,
    setPdfSource, setTemplateName, addField, updateField, deleteField,
    selectField, loadFromTemplate, reset,
  } = useEditorStore();

  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [tool, setTool] = useState<EditorTool>('move');
  const [pendingAddPosition, setPendingAddPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (templateId) {
      getTemplateById(templateId).then((t) => {
        if (t) {
          loadFromTemplate(t.id, t.name, t.pdfUri, t.pageWidth, t.pageHeight, t.fields);
          setRenderedImage(t.pdfUri);
        }
      });
    } else {
      reset();
    }
  }, [templateId]);

  async function handlePickFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    const file = new File(asset.uri);
    const base64 = await file.base64();
    setPdfBase64(base64);
  }

  function handleRendered({ imageDataUri, pageWidth: w, pageHeight: h }: { imageDataUri: string; pageWidth: number; pageHeight: number }) {
    setRenderedImage(imageDataUri);
    setPdfSource(imageDataUri, w, h);
  }

  function buildDefaultField(type: FieldType, x: number, y: number): TemplateField {
    return {
      id: generateId(),
      internalName: '',
      type,
      dateConfig: type === 'data' ? { parts: ['dia', 'mes', 'ano'], monthFormat: 'numero', auto: false } : undefined,
      valorConfig: type === 'valor' ? { showSymbol: true } : undefined,
      linkedValorFieldId: type === 'valorPorExtenso' ? null : undefined,
      autoIncrementConfig: type === 'autoIncremento' ? { digits: 1, startAt: 1 } : undefined,
      position: { x: x - 60, y: y - 12, width: 120, height: 24 },
      style: { fontFamily: 'Inter', fontSize: 12, color: '#1C1B1B', bold: false, italic: false, align: 'left' },
      required: false,
    };
  }

  function handleAddFieldType(type: FieldType) {
    setShowTypeModal(false);
    const pos = pendingAddPosition ?? { x: pageWidth / 2, y: pageHeight / 2 };
    const defaultField = buildDefaultField(type, pos.x, pos.y);
    addField(defaultField);
    selectField(defaultField.id);
    setPendingAddPosition(null);
    setTool('edit');
  }

  // Toque na página (fora de qualquer campo) enquanto a ferramenta
  // "Adicionar" está ativa: abre o seletor de tipo, e o campo nasce
  // exatamente no ponto tocado.
  function handleCanvasTap(evt: any) {
    if (tool !== 'add') return;
    const { locationX, locationY } = evt.nativeEvent;
    setPendingAddPosition({ x: locationX / scale, y: locationY / scale });
    setShowTypeModal(true);
  }

  function handleMoveField(field: TemplateField, dx: number, dy: number) {
    updateField(field.id, { position: { ...field.position, x: field.position.x + dx, y: field.position.y + dy } });
  }

  function handleResizeField(field: TemplateField, dw: number, dh: number, dx: number, dy: number) {
    updateField(field.id, {
      position: {
        ...field.position,
        x: field.position.x + dx, y: field.position.y + dy,
        width: field.position.width + dw, height: field.position.height + dh,
      },
    });
  }

  function handleSelectField(id: string) { selectField(id); }
  function handleEditField(id: string) { selectField(id); setShowFieldEditor(true); }

  function handleDeleteFieldDirect(id: string) {
    Alert.alert('Excluir campo', 'Tem certeza que deseja excluir este campo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteField(id) },
    ]);
  }

  function handleDeleteFieldFromSheet(id: string) {
    Alert.alert('Excluir campo', 'Tem certeza que deseja excluir este campo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => { deleteField(id); setShowFieldEditor(false); } },
    ]);
  }

  function handleDuplicateField(field: TemplateField) {
    const copy: TemplateField = { ...field, id: generateId(), position: { ...field.position, x: field.position.x + 12, y: field.position.y + 12 } };
    addField(copy);
    selectField(copy.id);
  }

  async function handleSave() {
    if (!templateName.trim()) { setShowNameModal(true); return; }
    if (!renderedImage) { Alert.alert('Selecione um PDF antes de salvar.'); return; }

    const now = Date.now();
    await saveTemplate({
      id: templateId ?? generateId(), name: templateName.trim(), pdfUri: renderedImage,
      pageWidth, pageHeight, fields, createdAt: now, updatedAt: now,
    });
    navigation.goBack();
  }

  const displayWidth = SCREEN_WIDTH - spacing.md * 2;
  const scale = pageWidth ? displayWidth / pageWidth : 1;
  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {pdfBase64 && !renderedImage && (
        <PdfPageRasterizer base64Pdf={pdfBase64} onRendered={handleRendered} onError={(msg) => Alert.alert('Erro ao processar PDF', msg)} />
      )}

      {!renderedImage ? (
        <>
          <View style={styles.toolbarMinimal}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
              <ChevronLeft size={22} color={colors.primary} />
            </Pressable>
            <Text style={styles.toolbarMinimalTitle}>PDF Architect</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={styles.emptyState}>
            <View style={styles.emptyCard}>
              <FileText size={36} color={colors.primary} />
              <View style={styles.emptyCardBadge}><Plus size={14} color={colors.white} /></View>
            </View>
            <Text style={styles.emptyTitle}>Criação de Template</Text>
            <Text style={styles.emptySubtitle}>Escolha um PDF para criar um template.</Text>
            <Pressable style={styles.pickButton} onPress={handlePickFile}>
              <Text style={styles.pickButtonText}>Selecionar Arquivo</Text>
            </Pressable>
            <Text style={styles.emptyHint}>Formatos suportados: .pdf (Máx. 10MB)</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.toolbar}>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.toolbarAction}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.titlePressable} onPress={() => setShowNameModal(true)}>
              <Text style={styles.toolbarTitle} numberOfLines={1}>{templateName || 'Novo Template'}</Text>
              <Pencil size={13} color={colors.secondary} />
            </Pressable>
            <Pressable onPress={handleSave}>
              <Text style={[styles.toolbarAction, styles.toolbarSave]}>Salvar</Text>
            </Pressable>
          </View>

          <View style={styles.previewButtonRow}>
            <Pressable style={styles.previewButton} onPress={() => setShowPreview(true)}>
              <Eye size={16} color={colors.primary} />
              <Text style={styles.previewButtonText}>Ver Prévia</Text>
            </Pressable>
          </View>

          <ZoomablePdfView onScaleChange={setZoomScale}>
            <Pressable style={styles.pageWrapper} onPress={handleCanvasTap}>
              <Image
                source={{ uri: renderedImage }}
                style={{ width: displayWidth, height: pageHeight * scale }}
                resizeMode="contain"
              />
              {fields.map((field) => (
                <FieldOverlay
                  key={field.id}
                  field={field}
                  scale={scale}
                  zoomScale={zoomScale}
                  selected={selectedFieldId === field.id}
                  tool={tool === 'add' ? 'move' : tool}
                  onSelect={() => handleSelectField(field.id)}
                  onEdit={() => handleEditField(field.id)}
                  onDelete={() => handleDeleteFieldDirect(field.id)}
                  onMove={(dx, dy) => handleMoveField(field, dx, dy)}
                  onResize={(dw, dh, dx, dy) => handleResizeField(field, dw, dh, dx, dy)}
                />
              ))}
            </Pressable>
          </ZoomablePdfView>

          <ToolSidebar active={tool} onChange={setTool} />
        </>
      )}

      <FieldTypePicker
        visible={showTypeModal}
        onClose={() => { setShowTypeModal(false); setPendingAddPosition(null); }}
        onSelect={handleAddFieldType}
      />

      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Nome do Template</Text>
            <TextInput autoFocus placeholder="Ex: Recibo Consulta" style={styles.nameInput} onChangeText={setTemplateName} value={templateName} />
            <Pressable
              style={styles.pickButton}
              onPress={() => {
                setShowNameModal(false);
                if (templateName.trim() && renderedImage) handleSave();
              }}
            >
              <Text style={styles.pickButtonText}>Confirmar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <FieldEditorSheet
        visible={showFieldEditor}
        field={selectedField}
        allFields={fields}
        onClose={() => setShowFieldEditor(false)}
        onUpdate={(partial) => selectedField && updateField(selectedField.id, partial)}
        onUpdateStyle={(partial) => selectedField && updateField(selectedField.id, { style: { ...selectedField.style, ...partial } })}
        onDelete={() => selectedField && handleDeleteFieldFromSheet(selectedField.id)}
        onDuplicate={() => selectedField && handleDuplicateField(selectedField)}
      />

      {renderedImage && (
        <TemplatePreviewModal
          visible={showPreview}
          onClose={() => setShowPreview(false)}
          pdfUri={renderedImage}
          pageWidth={pageWidth}
          pageHeight={pageHeight}
          fields={fields}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  toolbarMinimal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  toolbarMinimalTitle: { fontSize: typography.body, fontWeight: '700', color: colors.primary },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  emptyCard: { width: 96, height: 96, borderRadius: radius.lg, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyCardBadge: { position: 'absolute', bottom: -4, right: -4, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  emptyTitle: { fontSize: typography.headline * 0.6, fontWeight: '700', color: colors.neutral, marginBottom: spacing.xs },
  emptySubtitle: { fontSize: typography.body, color: colors.secondary, marginBottom: spacing.lg, textAlign: 'center' },
  emptyHint: { fontSize: typography.label, color: colors.secondary, marginTop: spacing.sm },
  pickButton: { backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md },
  pickButtonText: { color: colors.white, fontWeight: '600' },
  toolbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  toolbarAction: { fontSize: typography.body, color: colors.secondary },
  toolbarSave: { color: colors.primary, fontWeight: '700' },
  titlePressable: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' },
  toolbarTitle: { fontSize: typography.body, fontWeight: '600', maxWidth: 180 },
  previewButtonRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, alignItems: 'flex-start' },
  previewButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full,
  },
  previewButtonText: { color: colors.primary, fontWeight: '700', fontSize: typography.label },
  pageWrapper: { alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.md, maxHeight: '70%' },
  modalTitle: { fontSize: typography.body, fontWeight: '700', marginBottom: spacing.md },
  nameInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.md },
});