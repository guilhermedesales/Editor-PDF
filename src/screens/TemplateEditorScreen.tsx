// Tela principal do Modo 1 (Configuração do Template).

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../constants/theme';
import { useEditorStore } from '../store/useEditorstorage';
import PdfPageRasterizer from '../components/PdfPageRasterizer';
import FieldOverlay from '../components/FieldOverlay';
import FieldEditorSheet from '../components/FieldEditorSheet';
import ZoomablePdfView from '../components/ZoomablePdfView';
import { FIELD_TYPE_OPTIONS } from '../constants/fieldTypes';
import { saveTemplate, getTemplateById } from '../services/templateStorage';
import type { FieldType, TemplateField } from '../types/template';

const SCREEN_WIDTH = Dimensions.get('window').width;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function TemplateEditorScreen({ route, navigation }: any) {
  const templateId: string | undefined = route.params?.templateId;
  const insets = useSafeAreaInsets();

  const {
    pdfUri,
    pageWidth,
    pageHeight,
    fields,
    selectedFieldId,
    templateName,
    setPdfSource,
    setTemplateName,
    addField,
    updateField,
    deleteField, // precisa existir no store — ver instruções abaixo
    selectField,
    loadFromTemplate,
    reset,
  } = useEditorStore();

  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

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
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const file = new File(asset.uri);
    const base64 = await file.base64();
    setPdfBase64(base64);
  }

  function handleRendered({
    imageDataUri,
    pageWidth: w,
    pageHeight: h,
  }: {
    imageDataUri: string;
    pageWidth: number;
    pageHeight: number;
  }) {
    setRenderedImage(imageDataUri);
    setPdfSource(imageDataUri, w, h);
  }

  function handleAddFieldType(type: FieldType) {
    setShowTypeModal(false);

    const defaultField: TemplateField = {
      id: generateId(),
      internalName: '',
      type,
      position: {
        x: pageWidth / 2 - 60,
        y: pageHeight / 2 - 12,
        width: 120,
        height: 24,
      },
      style: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#1C1B1B',
        bold: false,
        italic: false,
        align: 'left',
      },
      required: false,
    };
    addField(defaultField);
    selectField(defaultField.id);
  }

  function handleMoveField(field: TemplateField, dx: number, dy: number) {
    updateField(field.id, {
      position: {
        ...field.position,
        x: field.position.x + dx,
        y: field.position.y + dy,
      },
    });
  }

  function handleResizeField(field: TemplateField, dw: number, dh: number) {
    updateField(field.id, {
      position: {
        ...field.position,
        width: field.position.width + dw,
        height: field.position.height + dh,
      },
    });
  }

  function handleSelectField(id: string) {
    selectField(id);
  }

  function handleEditField(id: string) {
    selectField(id);
    setShowFieldEditor(true);
  }

  function handleDeleteField(id: string) {
    Alert.alert('Excluir campo', 'Tem certeza que deseja excluir este campo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteField(id);
          setShowFieldEditor(false);
        },
      },
    ]);
  }

  async function handleSave() {
    if (!templateName.trim()) {
      setShowNameModal(true);
      return;
    }
    if (!renderedImage) {
      Alert.alert('Selecione um PDF antes de salvar.');
      return;
    }

    const now = Date.now();
    await saveTemplate({
      id: templateId ?? generateId(),
      name: templateName.trim(),
      pdfUri: renderedImage,
      pageWidth,
      pageHeight,
      fields,
      createdAt: now,
      updatedAt: now,
    });

    navigation.goBack();
  }

  const displayWidth = SCREEN_WIDTH - spacing.md * 2;
  const scale = pageWidth ? displayWidth / pageWidth : 1;
  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {pdfBase64 && !renderedImage && (
        <PdfPageRasterizer
          base64Pdf={pdfBase64}
          onRendered={handleRendered}
          onError={(msg) => Alert.alert('Erro ao processar PDF', msg)}
        />
      )}

      {!renderedImage ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Criação de Template</Text>
          <Text style={styles.emptySubtitle}>
            Escolha um PDF para criar um template.
          </Text>
          <Pressable style={styles.pickButton} onPress={handlePickFile}>
            <Text style={styles.pickButtonText}>Selecionar Arquivo</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.toolbar}>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={styles.toolbarAction}>Cancelar</Text>
            </Pressable>
            <Text style={styles.toolbarTitle} numberOfLines={1}>
              {templateName || 'Novo Template'}
            </Text>
            <Pressable onPress={handleSave}>
              <Text style={[styles.toolbarAction, styles.toolbarSave]}>Salvar</Text>
            </Pressable>
          </View>

          <ZoomablePdfView onScaleChange={setZoomScale}>
            <View style={styles.pageWrapper}>
              <Image
                source={{ uri: renderedImage }}
                style={{
                  width: displayWidth,
                  height: pageHeight * scale,
                }}
                resizeMode="contain"
              />
              {fields.map((field) => (
                <FieldOverlay
                  key={field.id}
                  field={field}
                  scale={scale}
                  zoomScale={zoomScale}
                  selected={selectedFieldId === field.id}
                  onSelect={() => handleSelectField(field.id)}
                  onEdit={() => handleEditField(field.id)}
                  onDelete={() => handleDeleteField(field.id)}
                  onMove={(dx, dy) => handleMoveField(field, dx, dy)}
                  onResize={(dw, dh) => handleResizeField(field, dw, dh)}
                />
              ))}
            </View>
          </ZoomablePdfView>

          <Pressable style={styles.fab} onPress={() => setShowTypeModal(true)}>
            <Text style={styles.fabText}>+</Text>
          </Pressable>
        </>
      )}

      <Modal visible={showTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Adicionar Campo</Text>
            <FlatList
              data={FIELD_TYPE_OPTIONS}
              numColumns={2}
              keyExtractor={(item) => item.type}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.typeOption}
                  onPress={() => handleAddFieldType(item.type)}
                >
                  <Text style={styles.typeOptionText}>{item.label}</Text>
                </Pressable>
              )}
            />
            <Pressable onPress={() => setShowTypeModal(false)}>
              <Text style={styles.modalCancel}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Nome do Template</Text>
            <TextInput
              autoFocus
              placeholder="Ex: Recibo Consulta"
              style={styles.nameInput}
              onChangeText={setTemplateName}
              value={templateName}
            />
            <Pressable
              style={styles.pickButton}
              onPress={() => {
                setShowNameModal(false);
                if (templateName.trim()) handleSave();
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
        onClose={() => setShowFieldEditor(false)}
        onUpdate={(partial) => selectedField && updateField(selectedField.id, partial)}
        onUpdateStyle={(partial) =>
          selectedField &&
          updateField(selectedField.id, {
            style: { ...selectedField.style, ...partial },
          })
        }
        onDelete={() => selectedField && handleDeleteField(selectedField.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.headline * 0.6,
    fontWeight: '700',
    color: colors.neutral,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.body,
    color: colors.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  pickButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  pickButtonText: { color: colors.white, fontWeight: '600' },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toolbarAction: { fontSize: typography.body, color: colors.secondary },
  toolbarSave: { color: colors.primary, fontWeight: '700' },
  toolbarTitle: { fontSize: typography.body, fontWeight: '600', flex: 1, textAlign: 'center' },
  pageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: { color: colors.white, fontSize: 28, fontWeight: '400', lineHeight: 30 },
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
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  typeOption: {
    flex: 1,
    margin: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.tertiary,
    alignItems: 'center',
  },
  typeOptionText: { fontWeight: '600', color: colors.neutral },
  modalCancel: {
    textAlign: 'center',
    color: colors.secondary,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
});