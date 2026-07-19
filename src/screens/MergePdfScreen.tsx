// Ferramenta "Juntar PDFs": lista reordenável com miniaturas + faixa de
// prévia da ordem, e agora com botão "Pré-visualizar tudo" que mescla
// em memória e abre o resultado final em tela cheia (MergePreviewModal),
// onde o nome do arquivo é definido antes de compartilhar de verdade.

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, ArrowUp, ArrowDown, X, Combine, FileText, Eye } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { PDFDocument } from 'pdf-lib';
import { File } from 'expo-file-system';
import { useThemeStore } from '../store/useThemeStore';
import { spacing, radius, typography } from '../constants/theme';
import { pickMultiplePdfs, saveGeneratedPdf } from '../services/pdfFileIO';
import PdfThumbnail from '../components/PdfThumbnail';
import MergePreviewModal from '../components/MergePreviewModal';

interface PickedPdf { uri: string; name: string; }

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export default function MergePdfScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [items, setItems] = useState<PickedPdf[]>([]);
  const [working, setWorking] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  const [showPreview, setShowPreview] = useState(false);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [mergedBytesCache, setMergedBytesCache] = useState<Uint8Array | null>(null);
  const [buildingPreview, setBuildingPreview] = useState(false);
  const [sharing, setSharing] = useState(false);

  async function handleAdd() {
    const picked = await pickMultiplePdfs();
    if (picked.length > 0) setItems((prev) => [...prev, ...picked]);
  }

  function handleThumbnailReady(uri: string, dataUri: string) {
    setThumbnails((prev) => (prev[uri] ? prev : { ...prev, [uri]: dataUri }));
  }

  function moveItem(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function buildMergedBytes(): Promise<Uint8Array> {
    const merged = await PDFDocument.create();
    for (const item of items) {
      const bytes = await new File(item.uri).bytes();
      const src = await PDFDocument.load(bytes);
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }
    return merged.save();
  }

  async function handleOpenPreview() {
    if (items.length < 2) {
      Alert.alert('Adicione ao menos 2 PDFs', 'Selecione pelo menos dois arquivos para juntar.');
      return;
    }
    setShowPreview(true);
    setBuildingPreview(true);
    setPreviewBase64(null);
    try {
      const mergedBytes = await buildMergedBytes();
      setMergedBytesCache(mergedBytes);
      setPreviewBase64(bytesToBase64(mergedBytes));
    } catch (err: any) {
      Alert.alert('Erro ao montar prévia', String(err?.message ?? err));
      setShowPreview(false);
    } finally {
      setBuildingPreview(false);
    }
  }

  async function handleConfirmShare(fileName: string) {
    if (!mergedBytesCache) return;
    setSharing(true);
    try {
      const { uri } = await saveGeneratedPdf(mergedBytesCache, fileName);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar PDF' });
      else Alert.alert('PDF gerado', `Salvo em: ${uri}`);
      setShowPreview(false);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erro ao juntar PDFs', String(err?.message ?? err));
    } finally {
      setSharing(false);
    }
  }

  const pendingThumbnails = items.filter((item) => !thumbnails[item.uri]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {pendingThumbnails.map((item) => (
        <PdfThumbnail key={item.uri} uri={item.uri} onReady={handleThumbnailReady} />
      ))}

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.neutral} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.neutral }]}>Juntar PDFs</Text>
        <View style={{ width: 22 }} />
      </View>

      {items.length >= 2 && (
        <View style={styles.previewSection}>
          <View style={styles.previewHeaderRow}>
            <Text style={[styles.previewLabel, { color: colors.secondary }]}>PRÉVIA DA ORDEM FINAL</Text>
            <Pressable style={styles.fullPreviewLink} onPress={handleOpenPreview}>
              <Eye size={14} color={colors.primary} />
              <Text style={[styles.fullPreviewLinkText, { color: colors.primary }]}>Ver tudo junto</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingHorizontal: spacing.md }}>
            {items.map((item, index) => (
              <React.Fragment key={`${item.uri}-preview-${index}`}>
                <View style={[styles.previewThumb, { borderColor: colors.border, backgroundColor: colors.tertiary }]}>
                  {thumbnails[item.uri] ? (
                    <Image source={{ uri: thumbnails[item.uri] }} style={styles.previewThumbImage} resizeMode="cover" />
                  ) : (
                    <ActivityIndicator size="small" color={colors.secondary} />
                  )}
                  <View style={[styles.previewBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.previewBadgeText}>{index + 1}</Text>
                  </View>
                </View>
                {index < items.length - 1 && (
                  <View style={styles.previewConnector}>
                    <Text style={{ color: colors.secondary, fontSize: 16 }}>›</Text>
                  </View>
                )}
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item, i) => `${item.uri}-${i}`}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Combine size={32} color={colors.secondary} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>
              Adicione os PDFs na ordem em que devem ficar no arquivo final.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={[styles.itemRow, { backgroundColor: colors.tertiary }]}>
            <View style={[styles.itemThumbWrap, { backgroundColor: colors.white, borderColor: colors.border }]}>
              {thumbnails[item.uri] ? (
                <Image source={{ uri: thumbnails[item.uri] }} style={styles.itemThumbImage} resizeMode="cover" />
              ) : (
                <FileText size={18} color={colors.secondary} />
              )}
            </View>
            <Text style={[styles.itemIndex, { color: colors.primary, backgroundColor: colors.primaryLight }]}>{index + 1}</Text>
            <Text style={[styles.itemName, { color: colors.neutral }]} numberOfLines={1}>{item.name}</Text>
            <Pressable hitSlop={6} onPress={() => moveItem(index, -1)} disabled={index === 0}>
              <ArrowUp size={18} color={index === 0 ? colors.border : colors.secondary} />
            </Pressable>
            <Pressable hitSlop={6} onPress={() => moveItem(index, 1)} disabled={index === items.length - 1}>
              <ArrowDown size={18} color={index === items.length - 1 ? colors.border : colors.secondary} />
            </Pressable>
            <Pressable hitSlop={6} onPress={() => removeItem(index)}>
              <X size={18} color={colors.danger} />
            </Pressable>
          </View>
        )}
      />

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Pressable style={[styles.addButton, { borderColor: colors.primary }]} onPress={handleAdd}>
          <Plus size={18} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>Adicionar PDF</Text>
        </Pressable>
        <Pressable
          style={[styles.mergeButton, { backgroundColor: colors.primary, opacity: working ? 0.6 : 1 }]}
          onPress={handleOpenPreview}
          disabled={working}
        >
          {working ? <ActivityIndicator color={colors.white} /> : <Text style={styles.mergeButtonText}>Pré-visualizar e Juntar</Text>}
        </Pressable>
      </View>

      <MergePreviewModal
        visible={showPreview}
        base64Pdf={buildingPreview ? null : previewBase64}
        defaultName={`Documento_Unido_${Date.now()}`}
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
  previewSection: { paddingVertical: spacing.sm },
  previewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, marginBottom: spacing.xs },
  previewLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  fullPreviewLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fullPreviewLinkText: { fontSize: 12, fontWeight: '700' },
  previewThumb: { width: 56, height: 72, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  previewThumbImage: { width: '100%', height: '100%' },
  previewBadge: { position: 'absolute', top: 3, left: 3, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  previewBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  previewConnector: { alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm, paddingHorizontal: spacing.lg },
  emptyText: { textAlign: 'center', fontSize: typography.label },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md },
  itemThumbWrap: { width: 36, height: 46, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  itemThumbImage: { width: '100%', height: '100%' },
  itemIndex: { fontWeight: '800', fontSize: 12, width: 20, height: 20, borderRadius: 10, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden' },
  itemName: { flex: 1, fontWeight: '600' },
  footer: { padding: spacing.md, borderTopWidth: 1, gap: spacing.sm },
  addButton: { flexDirection: 'row', gap: spacing.xs, borderWidth: 1.5, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { fontWeight: '700' },
  mergeButton: { borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  mergeButtonText: { color: '#fff', fontWeight: '700' },
});