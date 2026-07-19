import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, X, FileImage, Pencil, RotateCw, Eye } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import { PDFDocument } from 'pdf-lib';
import { File } from 'expo-file-system';
import { useThemeStore } from '../store/useThemeStore';
import { spacing, radius, typography } from '../constants/theme';
import { saveGeneratedPdf } from '../services/pdfFileIO';
import ImageEditModal from '../components/ImageEditModal';
import MergePreviewModal from '../components/MergePreviewModal';

interface PickedImage { uri: string; type: 'jpeg' | 'png'; }

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export default function ConvertToPdfScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [images, setImages] = useState<PickedImage[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [rotatingIndex, setRotatingIndex] = useState<number | null>(null);

  const [showPreview, setShowPreview] = useState(false);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [generatedBytesCache, setGeneratedBytesCache] = useState<Uint8Array | null>(null);
  const [buildingPreview, setBuildingPreview] = useState(false);
  const [sharing, setSharing] = useState(false);

  async function handleAdd() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 1,
    });
    if (result.canceled) return;
    const picked: PickedImage[] = result.assets.map((a) => ({
      uri: a.uri, type: a.uri.toLowerCase().endsWith('.png') ? 'png' : 'jpeg',
    }));
    setImages((prev) => [...prev, ...picked]);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleQuickRotate(index: number) {
    setRotatingIndex(index);
    try {
      const target = images[index];
      const result = await ImageManipulator.manipulateAsync(target.uri, [{ rotate: 90 }], {
        compress: 0.92, format: ImageManipulator.SaveFormat.JPEG,
      });
      setImages((prev) => prev.map((img, i) => (i === index ? { uri: result.uri, type: 'jpeg' } : img)));
    } catch (err: any) {
      Alert.alert('Erro ao girar imagem', String(err?.message ?? err));
    } finally {
      setRotatingIndex(null);
    }
  }

  function handleEditSaved(newUri: string) {
    if (editingIndex === null) return;
    setImages((prev) => prev.map((img, i) => (i === editingIndex ? { uri: newUri, type: 'jpeg' } : img)));
    setEditingIndex(null);
  }

  async function buildPdfBytes(): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    for (const img of images) {
      const bytes = await new File(img.uri).bytes();
      const embedded = img.type === 'png' ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
      const page = pdfDoc.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
    }
    return pdfDoc.save();
  }

  async function handleOpenPreview() {
    if (images.length === 0) {
      Alert.alert('Adicione ao menos uma imagem');
      return;
    }
    setShowPreview(true);
    setBuildingPreview(true);
    setPreviewBase64(null);
    try {
      const pdfBytes = await buildPdfBytes();
      setGeneratedBytesCache(pdfBytes);
      setPreviewBase64(bytesToBase64(pdfBytes));
    } catch (err: any) {
      Alert.alert('Erro ao montar prévia', String(err?.message ?? err));
      setShowPreview(false);
    } finally {
      setBuildingPreview(false);
    }
  }

  async function handleConfirmShare(fileName: string) {
    if (!generatedBytesCache) return;
    setSharing(true);
    try {
      const { uri } = await saveGeneratedPdf(generatedBytesCache, fileName);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar PDF' });
      else Alert.alert('PDF gerado', `Salvo em: ${uri}`);
      setShowPreview(false);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erro ao converter', String(err?.message ?? err));
    } finally {
      setSharing(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.neutral} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.neutral }]}>Converter para PDF</Text>
        {images.length > 0 ? (
          <Pressable style={styles.previewLink} onPress={handleOpenPreview}>
            <Eye size={14} color={colors.primary} />
            <Text style={[styles.previewLinkText, { color: colors.primary }]}>Prévia</Text>
          </Pressable>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <Text style={[styles.hint, { color: colors.secondary }]}>
        Toque numa imagem pra recortar ou girar antes de gerar o PDF. Cada imagem vira uma página.
      </Text>

      <FlatList
        data={images}
        keyExtractor={(item, i) => `${item.uri}-${i}`}
        numColumns={3}
        columnWrapperStyle={{ gap: spacing.sm }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FileImage size={32} color={colors.secondary} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>Nenhuma imagem selecionada ainda.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable style={styles.thumbWrap} onPress={() => setEditingIndex(index)}>
            <Image source={{ uri: item.uri }} style={styles.thumb} />

            {rotatingIndex === index && (
              <View style={styles.thumbLoadingOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            )}

            <Pressable style={styles.removeBadge} onPress={(e) => { e.stopPropagation(); removeImage(index); }}>
              <X size={12} color="#fff" />
            </Pressable>
            <Pressable style={styles.rotateBadge} onPress={(e) => { e.stopPropagation(); handleQuickRotate(index); }}>
              <RotateCw size={12} color="#fff" />
            </Pressable>
            <View style={styles.editBadge}>
              <Pencil size={11} color="#fff" />
            </View>
            <View style={styles.pageBadge}>
              <Text style={styles.pageBadgeText}>{index + 1}</Text>
            </View>
          </Pressable>
        )}
      />

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Pressable style={[styles.addButton, { borderColor: colors.primary }]} onPress={handleAdd}>
          <Plus size={18} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>Adicionar Imagens</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleOpenPreview}>
          <Text style={styles.actionButtonText}>Pré-visualizar e Converter</Text>
        </Pressable>
      </View>

      <ImageEditModal
        visible={editingIndex !== null}
        uri={editingIndex !== null ? images[editingIndex]?.uri ?? null : null}
        onClose={() => setEditingIndex(null)}
        onSave={handleEditSaved}
      />

      <MergePreviewModal
        visible={showPreview}
        base64Pdf={buildingPreview ? null : previewBase64}
        defaultName={`Imagens_para_PDF_${Date.now()}`}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirmShare}
        sharing={sharing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: typography.body, fontWeight: '700' },
  previewLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewLinkText: { fontSize: 13, fontWeight: '700' },
  hint: { fontSize: 12, paddingHorizontal: spacing.md, marginBottom: spacing.xs },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm, width: '100%' },
  emptyText: { textAlign: 'center', fontSize: typography.label },
  thumbWrap: { width: 100, height: 100, borderRadius: radius.sm, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  thumbLoadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  removeBadge: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  rotateBadge: { position: 'absolute', top: 4, left: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  editBadge: { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  pageBadge: { position: 'absolute', bottom: 4, left: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  pageBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  footer: { padding: spacing.md, borderTopWidth: 1, gap: spacing.sm },
  addButton: { flexDirection: 'row', gap: spacing.xs, borderWidth: 1.5, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { fontWeight: '700' },
  actionButton: { borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#fff', fontWeight: '700' },
});