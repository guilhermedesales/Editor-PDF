// Tela principal do Modo 1 (Configuração do Template).

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, Dimensions, Modal, TextInput, Alert, ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, radius, typography } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import { useEditorStore } from '../store/useEditorstorage';
import PdfPageRasterizer from '../components/PdfPageRasterizer';
import FieldOverlay from '../components/FieldOverlay';
import FieldEditorSheet from '../components/FieldEditorSheet';
import ZoomablePdfView from '../components/ZoomablePdfView';
import FieldTypePicker from '../components/FieldTypePicker';
import ToolSidebar, { EditorTool } from '../components/ToolSidebar';
import TemplatePreviewModal from '../components/TemplatePreviewModal';
import SpreadsheetLinkModal from '../components/SpreadsheetLinkModal';
import ContextualTutorial from '../components/ContextualTutorial';
import { saveTemplate, getTemplateById } from '../services/templateStorage';
import { getSpreadsheetByTemplateId, type SpreadsheetEntry } from '../services/spreadsheetsStorage';
import type { FieldType, TemplateField } from '../types/template';
import { Plus, ChevronLeft, FileText, Eye, Pencil, Table, Undo2, Redo2, CheckSquare, AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical, MoreHorizontal, MoreVertical, Grid3X3, Layers, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function TemplateEditorScreen({ route, navigation }: any) {
  const templateId: string | undefined = route.params?.templateId;
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();

  // ID estável do template, gerado desde já mesmo se ainda não foi
  // salvo — assim dá pra vincular uma planilha (que referencia esse
  // ID) mesmo antes do primeiro "Salvar".
  const [effectiveTemplateId] = useState(() => templateId ?? generateId());

  const {
    pdfUri, pageWidth, pageHeight, fields, selectedFieldId, selectedFieldIds, templateName, pastFields, futureFields,
    setPdfSource, setTemplateName, addField, updateField, updateFields, deleteField,
    selectField, toggleFieldSelection, loadFromTemplate, reset, undo, redo,
  } = useEditorStore();

  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSpreadsheetModal, setShowSpreadsheetModal] = useState(false);
  const [linkedSpreadsheet, setLinkedSpreadsheet] = useState<SpreadsheetEntry | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [tool, setTool] = useState<EditorTool>('move');
  const [pendingAddPosition, setPendingAddPosition] = useState<{ x: number; y: number } | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [showAlignModal, setShowAlignModal] = useState(false);
  const [showGridModal, setShowGridModal] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(10);
  const [showLayersModal, setShowLayersModal] = useState(false);
  const [manualTutorial, setManualTutorial] = useState(false);

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

  useEffect(() => {
    getSpreadsheetByTemplateId(effectiveTemplateId).then((s) => setLinkedSpreadsheet(s ?? null));
  }, [effectiveTemplateId]);


  const selectedFields = fields.filter((f) => selectedFieldIds.includes(f.id));

  function applyAlignment(action: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom' | 'distributeH' | 'distributeV') {
    if (selectedFields.length < 2) return;
    updateFields((currentFields) => {
      const selected = currentFields.filter((f) => selectedFieldIds.includes(f.id));
      if (selected.length < 2) return currentFields;
      const minX = Math.min(...selected.map((f) => f.position.x));
      const maxRight = Math.max(...selected.map((f) => f.position.x + f.position.width));
      const minY = Math.min(...selected.map((f) => f.position.y));
      const maxBottom = Math.max(...selected.map((f) => f.position.y + f.position.height));
      const centerX = (minX + maxRight) / 2;
      const centerY = (minY + maxBottom) / 2;

      let distributedPositions: Record<string, number> = {};
      if (action === 'distributeH' && selected.length >= 3) {
        const sorted = [...selected].sort((a, b) => a.position.x - b.position.x);
        const totalWidth = sorted.reduce((sum, f) => sum + f.position.width, 0);
        const gap = (maxRight - minX - totalWidth) / (sorted.length - 1);
        let cursor = minX;
        sorted.forEach((f) => { distributedPositions[f.id] = cursor; cursor += f.position.width + gap; });
      }
      if (action === 'distributeV' && selected.length >= 3) {
        const sorted = [...selected].sort((a, b) => a.position.y - b.position.y);
        const totalHeight = sorted.reduce((sum, f) => sum + f.position.height, 0);
        const gap = (maxBottom - minY - totalHeight) / (sorted.length - 1);
        let cursor = minY;
        sorted.forEach((f) => { distributedPositions[f.id] = cursor; cursor += f.position.height + gap; });
      }

      return currentFields.map((field) => {
        if (!selectedFieldIds.includes(field.id)) return field;
        const position = { ...field.position };
        if (action === 'left') position.x = minX;
        if (action === 'centerH') position.x = centerX - position.width / 2;
        if (action === 'right') position.x = maxRight - position.width;
        if (action === 'top') position.y = minY;
        if (action === 'centerV') position.y = centerY - position.height / 2;
        if (action === 'bottom') position.y = maxBottom - position.height;
        if (action === 'distributeH' && distributedPositions[field.id] !== undefined) position.x = distributedPositions[field.id];
        if (action === 'distributeV' && distributedPositions[field.id] !== undefined) position.y = distributedPositions[field.id];
        return { ...field, position };
      });
    });
    setShowAlignModal(false);
  }

  function snapValue(value: number) {
    return snapToGrid ? Math.round(value / gridSize) * gridSize : value;
  }

  function snapPosition(position: TemplateField['position']) {
    if (!snapToGrid) return position;
    return {
      x: snapValue(position.x),
      y: snapValue(position.y),
      width: Math.max(gridSize, snapValue(position.width)),
      height: Math.max(gridSize, snapValue(position.height)),
    };
  }

  function renderGrid() {
    if (!showGrid || !pageWidth || !pageHeight) return null;
    const verticalLines = Array.from({ length: Math.floor(pageWidth / gridSize) + 1 }, (_, i) => i * gridSize);
    const horizontalLines = Array.from({ length: Math.floor(pageHeight / gridSize) + 1 }, (_, i) => i * gridSize);
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {verticalLines.map((x) => (
          <View key={`v-${x}`} style={[styles.gridLine, { left: x * scale, top: 0, height: pageHeight * scale, borderLeftWidth: 1 }]} />
        ))}
        {horizontalLines.map((y) => (
          <View key={`h-${y}`} style={[styles.gridLine, { top: y * scale, left: 0, width: displayWidth, borderTopWidth: 1 }]} />
        ))}
      </View>
    );
  }

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
      dateConfig: type === 'data' ? { parts: ['dia', 'mes', 'ano'], monthFormat: 'numero', yearFormat: 'completo', auto: false } : undefined,
      defaultText: type === 'textoFixo' ? 'Texto fixo' : undefined,
      valorConfig: type === 'valor' ? { showSymbol: true } : undefined,
      linkedValorFieldId: type === 'valorPorExtenso' ? null : undefined,
      autoIncrementConfig: type === 'autoIncremento' ? { digits: 1, startAt: 1 } : undefined,
      calculationConfig: type === 'calculado' ? { operation: 'soma', leftFieldId: null, rightFieldId: null, format: 'numero' } : undefined,
      position: { x: x - 60, y: y - 12, width: 120, height: 24 },
      style: { fontFamily: 'Inter', fontSize: 12, color: '#1C1B1B', bold: false, italic: false, align: 'left' },
      required: false,
      hidden: false,
      locked: false,
      zIndex: fields.length,
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
    if (field.locked) return;
    updateField(field.id, { position: snapPosition({ ...field.position, x: field.position.x + dx, y: field.position.y + dy }) });
  }

  function handleResizeField(field: TemplateField, dw: number, dh: number, dx: number, dy: number) {
    if (field.locked) return;
    updateField(field.id, {
      position: snapPosition({
        ...field.position,
        x: field.position.x + dx, y: field.position.y + dy,
        width: field.position.width + dw, height: field.position.height + dh,
      }),
    });
  }

  function handleSelectField(id: string) {
    if (multiSelectMode) toggleFieldSelection(id);
    else selectField(id);
  }
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
      id: effectiveTemplateId, name: templateName.trim(), pdfUri: renderedImage,
      pageWidth, pageHeight, fields, createdAt: now, updatedAt: now,
    });
    navigation.goBack();
  }

  const displayWidth = SCREEN_WIDTH - spacing.md * 2;
  const scale = pageWidth ? displayWidth / pageWidth : 1;
  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {pdfBase64 && !renderedImage && (
        <PdfPageRasterizer base64Pdf={pdfBase64} onRendered={handleRendered} onError={(msg) => Alert.alert('Erro ao processar PDF', msg)} />
      )}

      {!renderedImage ? (
        <>
          <View style={styles.toolbarMinimal}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
              <ChevronLeft size={22} color={colors.primary} />
            </Pressable>
            <Text style={[styles.toolbarMinimalTitle, { color: colors.primary }]}>PDF Architect</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={styles.emptyState}>
            <View style={[styles.emptyCard, { backgroundColor: colors.primaryLight }]}>
              <FileText size={36} color={colors.primary} />
              <View style={[styles.emptyCardBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                <Plus size={14} color="#fff" />
              </View>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.neutral }]}>Criação de Template</Text>
            <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>Escolha um PDF para criar um template.</Text>
            <Pressable style={[styles.pickButton, { backgroundColor: colors.primary }]} onPress={handlePickFile}>
              <Text style={styles.pickButtonText}>Selecionar Arquivo</Text>
            </Pressable>
            <Text style={[styles.emptyHint, { color: colors.secondary }]}>Formatos suportados: .pdf (Máx. 10MB)</Text>
          </View>
        </>
      ) : (
        <>
          <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => navigation.goBack()}>
              <Text style={[styles.toolbarAction, { color: colors.secondary }]}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.titlePressable} onPress={() => setShowNameModal(true)}>
              <Text style={[styles.toolbarTitle, { color: colors.neutral }]} numberOfLines={1}>{templateName || 'Novo Template'}</Text>
              <Pencil size={13} color={colors.secondary} />
            </Pressable>
            <Pressable onPress={handleSave}>
              <Text style={[styles.toolbarAction, styles.toolbarSave, { color: colors.primary }]}>Salvar</Text>
            </Pressable>
          </View>

          <View style={styles.previewButtonRow}>
            <Pressable style={[styles.previewButton, { backgroundColor: colors.primaryLight }]} onPress={() => setShowPreview(true)}>
              <Eye size={16} color={colors.primary} />
              <Text style={[styles.previewButtonText, { color: colors.primary }]}>Ver Prévia</Text>
            </Pressable>

            <View style={styles.historyButtons}>
              <Pressable
                style={[styles.historyButton, { backgroundColor: colors.tertiary }, pastFields.length === 0 && styles.historyButtonDisabled]}
                onPress={undo}
                disabled={pastFields.length === 0}
              >
                <Undo2 size={16} color={pastFields.length === 0 ? colors.secondary : colors.primary} />
              </Pressable>
              <Pressable
                style={[styles.historyButton, { backgroundColor: colors.tertiary }, futureFields.length === 0 && styles.historyButtonDisabled]}
                onPress={redo}
                disabled={futureFields.length === 0}
              >
                <Redo2 size={16} color={futureFields.length === 0 ? colors.secondary : colors.primary} />
              </Pressable>
            </View>

            <Pressable style={[styles.historyButton, { backgroundColor: colors.tertiary }]} onPress={() => setManualTutorial(true)}>
              <HelpCircle size={16} color={colors.primary} />
            </Pressable>

            <Pressable
              style={[styles.previewButton, { backgroundColor: multiSelectMode ? colors.primaryLight : colors.tertiary }]}
              onPress={() => setMultiSelectMode((v) => !v)}
            >
              <CheckSquare size={16} color={multiSelectMode ? colors.primary : colors.secondary} />
              <Text style={[styles.previewButtonText, { color: multiSelectMode ? colors.primary : colors.secondary }]}>
                {selectedFieldIds.length > 1 ? `${selectedFieldIds.length} selecionados` : 'Multi'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.previewButton, { backgroundColor: selectedFieldIds.length >= 2 ? colors.primaryLight : colors.tertiary, opacity: selectedFieldIds.length >= 2 ? 1 : 0.5 }]}
              onPress={() => setShowAlignModal(true)}
              disabled={selectedFieldIds.length < 2}
            >
              <AlignCenter size={16} color={selectedFieldIds.length >= 2 ? colors.primary : colors.secondary} />
              <Text style={[styles.previewButtonText, { color: selectedFieldIds.length >= 2 ? colors.primary : colors.secondary }]}>Alinhar</Text>
            </Pressable>

            <Pressable
              style={[styles.previewButton, { backgroundColor: showGrid || snapToGrid ? colors.primaryLight : colors.tertiary }]}
              onPress={() => setShowGridModal(true)}
            >
              <Grid3X3 size={16} color={showGrid || snapToGrid ? colors.primary : colors.secondary} />
              <Text style={[styles.previewButtonText, { color: showGrid || snapToGrid ? colors.primary : colors.secondary }]}>Grade</Text>
            </Pressable>

            <Pressable
              style={[styles.previewButton, { backgroundColor: colors.tertiary }]}
              onPress={() => setShowLayersModal(true)}
            >
              <Layers size={16} color={colors.secondary} />
              <Text style={[styles.previewButtonText, { color: colors.secondary }]}>Camadas</Text>
            </Pressable>
            <Pressable
              style={[styles.previewButton, { backgroundColor: linkedSpreadsheet ? colors.primaryLight : colors.tertiary }]}
              onPress={() => setShowSpreadsheetModal(true)}
            >
              <Table size={16} color={linkedSpreadsheet ? colors.primary : colors.secondary} />
              <Text
                style={[styles.previewButtonText, { color: linkedSpreadsheet ? colors.primary : colors.secondary }]}
                numberOfLines={1}
              >
                {linkedSpreadsheet ? linkedSpreadsheet.name : 'Vincular Planilha'}
              </Text>
            </Pressable>
          </View>

          <ZoomablePdfView onScaleChange={setZoomScale}>
            <Pressable style={styles.pageWrapper} onPress={handleCanvasTap}>
              <Image
                source={{ uri: renderedImage }}
                style={{ width: displayWidth, height: pageHeight * scale }}
                resizeMode="contain"
              />
              {renderGrid()}
              {fields.filter((field) => !field.hidden).map((field) => (
                <FieldOverlay
                  key={field.id}
                  field={field}
                  scale={scale}
                  zoomScale={zoomScale}
                  selected={selectedFieldIds.includes(field.id)}
                  locked={!!field.locked}
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

          <View style={{ paddingBottom: insets.bottom }}>
            <ToolSidebar active={tool} onChange={setTool} />
          </View>
        </>
      )}




      <Modal visible={showLayersModal} transparent animationType="slide" onRequestClose={() => setShowLayersModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.white, paddingBottom: spacing.md + insets.bottom }]}> 
            <Text style={[styles.modalTitle, { color: colors.neutral }]}>Camadas</Text>
            <Text style={[styles.alignHint, { color: colors.secondary }]}>Toque em uma camada para selecionar. Use os controles para ocultar, bloquear ou mudar a ordem.</Text>
            <ScrollView contentContainerStyle={styles.layersList}>
              {fields.map((field, index) => {
                const selected = selectedFieldIds.includes(field.id);
                return (
                  <Pressable key={field.id} style={[styles.layerRow, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primaryLight : colors.white }]} onPress={() => selectField(field.id)}>
                    <Text style={[styles.layerName, { color: colors.neutral }]} numberOfLines={1}>{field.internalName || field.defaultText || field.type || 'Campo'}</Text>
                    <Pressable hitSlop={8} onPress={() => updateField(field.id, { hidden: !field.hidden })}>
                      {field.hidden ? <EyeOff size={18} color={colors.secondary} /> : <Eye size={18} color={colors.primary} />}
                    </Pressable>
                    <Pressable hitSlop={8} onPress={() => updateField(field.id, { locked: !field.locked })}>
                      {field.locked ? <Lock size={18} color={colors.danger} /> : <Unlock size={18} color={colors.secondary} />}
                    </Pressable>
                    <Pressable hitSlop={8} disabled={index === 0} onPress={() => updateFields((current) => { const copy = [...current]; const [item] = copy.splice(index, 1); copy.splice(index - 1, 0, item); return copy.map((f, i) => ({ ...f, zIndex: i })); })}>
                      <ArrowUp size={18} color={index === 0 ? colors.border : colors.secondary} />
                    </Pressable>
                    <Pressable hitSlop={8} disabled={index === fields.length - 1} onPress={() => updateFields((current) => { const copy = [...current]; const [item] = copy.splice(index, 1); copy.splice(index + 1, 0, item); return copy.map((f, i) => ({ ...f, zIndex: i })); })}>
                      <ArrowDown size={18} color={index === fields.length - 1 ? colors.border : colors.secondary} />
                    </Pressable>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showGridModal} transparent animationType="fade" onRequestClose={() => setShowGridModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.white, paddingBottom: spacing.md + insets.bottom }]}> 
            <Text style={[styles.modalTitle, { color: colors.neutral }]}>Grade e encaixe</Text>
            <Pressable style={styles.checkboxConfigRow} onPress={() => setShowGrid((v) => !v)}>
              <View style={[styles.configCheckbox, { borderColor: colors.border }, showGrid && { backgroundColor: colors.primary, borderColor: colors.primary }]} />
              <Text style={[styles.configLabelText, { color: colors.neutral }]}>Mostrar grade</Text>
            </Pressable>
            <Pressable style={styles.checkboxConfigRow} onPress={() => setSnapToGrid((v) => !v)}>
              <View style={[styles.configCheckbox, { borderColor: colors.border }, snapToGrid && { backgroundColor: colors.primary, borderColor: colors.primary }]} />
              <Text style={[styles.configLabelText, { color: colors.neutral }]}>Encaixar na grade</Text>
            </Pressable>
            <Text style={[styles.alignHint, { color: colors.secondary }]}>Tamanho da grade</Text>
            <View style={styles.gridSizeRow}>
              {[5, 10, 20].map((size) => (
                <Pressable key={size} style={[styles.gridSizeButton, { borderColor: colors.border }, gridSize === size && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setGridSize(size)}>
                  <Text style={[styles.gridSizeText, { color: gridSize === size ? colors.white : colors.neutral }]}>{size}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAlignModal} transparent animationType="fade" onRequestClose={() => setShowAlignModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.white, paddingBottom: spacing.md + insets.bottom }]}> 
            <Text style={[styles.modalTitle, { color: colors.neutral }]}>Organizar seleção</Text>
            <Text style={[styles.alignHint, { color: colors.secondary }]}>{selectedFieldIds.length} campos selecionados</Text>
            <ScrollView contentContainerStyle={styles.alignActions}>
              {[
                { key: 'left', label: 'Alinhar à esquerda', Icon: AlignLeft },
                { key: 'centerH', label: 'Centralizar horizontalmente', Icon: AlignCenter },
                { key: 'right', label: 'Alinhar à direita', Icon: AlignRight },
                { key: 'top', label: 'Alinhar no topo', Icon: AlignStartVertical },
                { key: 'centerV', label: 'Centralizar verticalmente', Icon: AlignCenterVertical },
                { key: 'bottom', label: 'Alinhar na base', Icon: AlignEndVertical },
                { key: 'distributeH', label: 'Distribuir horizontalmente', Icon: MoreHorizontal, disabled: selectedFieldIds.length < 3 },
                { key: 'distributeV', label: 'Distribuir verticalmente', Icon: MoreVertical, disabled: selectedFieldIds.length < 3 },
              ].map(({ key, label, Icon, disabled }: any) => (
                <Pressable
                  key={key}
                  style={[styles.alignAction, { borderColor: colors.border }, disabled && { opacity: 0.45 }]}
                  disabled={disabled}
                  onPress={() => applyAlignment(key)}
                >
                  <Icon size={18} color={colors.primary} />
                  <Text style={[styles.alignActionText, { color: colors.neutral }]}>{label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>


      <ContextualTutorial
        id="editor.introduction"
        autoStart
        steps={[
          { title: 'Vamos criar seu template', description: 'Escolha um PDF e use a barra inferior para adicionar, mover, redimensionar e editar campos.', targetLabel: 'Editor' },
          { title: 'Organize com precisão', description: 'Use seleção múltipla, alinhamento, grade com snap e camadas para trabalhar melhor em telas pequenas.', targetLabel: 'Ferramentas visuais' },
          { title: 'Ajuda contextual', description: 'Toque no ícone de ajuda quando quiser rever este tutorial.', targetLabel: 'Ajuda' },
        ]}
      />
      <ContextualTutorial
        id="editor.manualHelp"
        visible={manualTutorial}
        onClose={() => setManualTutorial(false)}
        steps={[
          { title: 'Seleção múltipla', description: 'Ative Multi e toque nos campos para adicionar ou remover da seleção. Depois use Alinhar.', targetLabel: 'Multi' },
          { title: 'Grade e Snap', description: 'A grade não aparece no PDF final. Com Snap ativo, movimentos e redimensionamentos encaixam nas coordenadas do documento.', targetLabel: 'Grade' },
          { title: 'Camadas', description: 'Abra Camadas para selecionar, ocultar, bloquear ou reordenar campos sem ocupar o canvas o tempo todo.', targetLabel: 'Camadas' },
        ]}
      />

      <FieldTypePicker
        visible={showTypeModal}
        onClose={() => { setShowTypeModal(false); setPendingAddPosition(null); }}
        onSelect={handleAddFieldType}
      />

      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.white, paddingBottom: spacing.md + insets.bottom }]}>
            <Text style={[styles.modalTitle, { color: colors.neutral }]}>Nome do Template</Text>
            <TextInput
              autoFocus
              placeholder="Ex: Recibo Consulta"
              placeholderTextColor={colors.secondary}
              style={[styles.nameInput, { borderColor: colors.border, color: colors.neutral }]}
              onChangeText={setTemplateName}
              value={templateName}
            />
            <Pressable
              style={[styles.pickButton, { backgroundColor: colors.primary }]}
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

      <SpreadsheetLinkModal
        visible={showSpreadsheetModal}
        templateId={effectiveTemplateId}
        templateName={templateName}
        fields={fields}
        existingSpreadsheet={linkedSpreadsheet}
        onClose={() => setShowSpreadsheetModal(false)}
        onSaved={() => {
          setShowSpreadsheetModal(false);
          getSpreadsheetByTemplateId(effectiveTemplateId).then((s) => setLinkedSpreadsheet(s ?? null));
        }}
        onUnlink={() => {
          setShowSpreadsheetModal(false);
          setLinkedSpreadsheet(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbarMinimal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  toolbarMinimalTitle: { fontSize: typography.body, fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  emptyCard: { width: 96, height: 96, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyCardBadge: { position: 'absolute', bottom: -4, right: -4, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  emptyTitle: { fontSize: typography.headline * 0.6, fontWeight: '700', marginBottom: spacing.xs },
  emptySubtitle: { fontSize: typography.body, marginBottom: spacing.lg, textAlign: 'center' },
  emptyHint: { fontSize: typography.label, marginTop: spacing.sm },
  pickButton: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md },
  pickButtonText: { color: '#fff', fontWeight: '600' },
  toolbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1,
  },
  toolbarAction: { fontSize: typography.body },
  toolbarSave: { fontWeight: '700' },
  titlePressable: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' },
  toolbarTitle: { fontSize: typography.body, fontWeight: '600', maxWidth: 180 },
  previewButtonRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, alignItems: 'flex-start', flexWrap: 'wrap' },
  previewButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.full, maxWidth: '60%',
  },
  previewButtonText: { fontWeight: '700', fontSize: typography.label },
  historyButtons: { flexDirection: 'row', gap: spacing.xs, marginLeft: 'auto' },
  historyButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  historyButtonDisabled: { opacity: 0.45 },
  pageWrapper: { alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.md, maxHeight: '70%' },
  modalTitle: { fontSize: typography.body, fontWeight: '700', marginBottom: spacing.md },
  nameInput: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.md },
  alignHint: { fontSize: typography.label, marginBottom: spacing.sm },
  alignActions: { gap: spacing.sm },
  alignAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, padding: spacing.sm },
  alignActionText: { fontSize: typography.label, fontWeight: '700' },
  gridLine: { position: 'absolute', borderColor: 'rgba(37,99,235,0.18)' },
  checkboxConfigRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  configCheckbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2 },
  configLabelText: { fontSize: typography.body, fontWeight: '600' },
  gridSizeRow: { flexDirection: 'row', gap: spacing.sm },
  gridSizeButton: { minWidth: 56, alignItems: 'center', borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing.sm },
  gridSizeText: { fontWeight: '700' },
  layersList: { gap: spacing.sm },
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.md, padding: spacing.sm },
  layerName: { flex: 1, fontWeight: '700', fontSize: typography.label },
});