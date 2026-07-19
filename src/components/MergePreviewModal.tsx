// Prévia em tela cheia do resultado FINAL da mesclagem — a mesclagem é
// feita em memória (pdf-lib) e o resultado alimenta o mesmo motor de
// renderização do PdfViewerScreen, mostrando as páginas reais já
// juntas, na ordem escolhida. Só quando o usuário confirma o nome e
// toca em Compartilhar é que o arquivo é de fato salvo em disco.

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, Image, ActivityIndicator,
  Dimensions, FlatList, TextInput,
} from 'react-native';
import { X, Share2, ChevronLeft } from 'lucide-react-native';
import { spacing, radius, typography } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import PdfEngine, { type PdfEngineHandle, type RenderedPage } from './PdfEngine';

interface Props {
  visible: boolean;
  base64Pdf: string | null;
  defaultName: string;
  onClose: () => void;
  onConfirm: (fileName: string) => void;
  sharing: boolean;
}

const PAGE_GAP = 10;

export default function MergePreviewModal({ visible, base64Pdf, defaultName, onClose, onConfirm, sharing }: Props) {
  const { colors } = useThemeStore();
  const engineRef = useRef<PdfEngineHandle>(null);
  const currentPageRef = useRef(1);

  const [pageCount, setPageCount] = useState<number | null>(null);
  const [pages, setPages] = useState<Map<number, RenderedPage>>(new Map());
  const [pageAspect, setPageAspect] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fileName, setFileName] = useState(defaultName);
  const [editingName, setEditingName] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const itemHeight = pageAspect ? screenWidth * pageAspect : 0;

  useEffect(() => {
    if (visible) {
      setFileName(defaultName);
      setPageCount(null);
      setPages(new Map());
      setPageAspect(null);
      setCurrentPage(1);
    }
  }, [visible, defaultName]);

  function requestPage(pageNumber: number) {
    engineRef.current?.renderPage(pageNumber, Math.round(screenWidth));
  }

  function handleLoaded(count: number) {
    setPageCount(count);
    requestPage(1);
    for (let p = 2; p <= Math.min(count, 4); p++) requestPage(p);
  }

  function handlePageRendered(page: RenderedPage) {
    setPages((prev) => {
      const next = new Map(prev);
      next.set(page.pageNumber, page);
      for (const key of Array.from(next.keys())) {
        if (Math.abs(key - currentPageRef.current) > 6) next.delete(key);
      }
      return next;
    });
    if (pageAspect === null) setPageAspect(page.pageHeight / page.pageWidth);
  }

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const page = viewableItems[0].item as number;
      currentPageRef.current = page;
      setCurrentPage(page);
      requestPage(page);
      if (page + 1 <= (pageCount ?? 0)) requestPage(page + 1);
      if (page - 1 >= 1) requestPage(page - 1);
    }
  }).current;

  function renderItem({ item: pageNumber }: { item: number }) {
    const rendered = pages.get(pageNumber);
    return (
      <View style={{ width: screenWidth, height: itemHeight, marginBottom: PAGE_GAP, backgroundColor: '#525252' }}>
        {rendered ? (
          <Image source={{ uri: rendered.imageDataUri }} style={StyleSheet.absoluteFillObject} resizeMode="contain" />
        ) : (
          <View style={styles.placeholder}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
        <View pointerEvents="none" style={styles.pageBadge}>
          <Text style={styles.pageBadgeText}>{pageNumber}</Text>
        </View>
      </View>
    );
  }

  const listData = pageCount ? Array.from({ length: pageCount }, (_, i) => i + 1) : [];
  const ready = base64Pdf !== null && pageAspect !== null && pageCount !== null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {base64Pdf && (
          <PdfEngine
            ref={engineRef}
            base64Pdf={base64Pdf}
            onLoaded={handleLoaded}
            onPageRendered={handlePageRendered}
            onError={() => {}}
          />
        )}

        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={8}>
            <ChevronLeft size={22} color={colors.neutral} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.neutral }]}>Prévia do Documento Final</Text>
          <Text style={[styles.headerCount, { color: colors.secondary }]}>{pageCount ? `${currentPage}/${pageCount}` : ''}</Text>
        </View>

        {!ready ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.secondary }]}>Montando prévia...</Text>
          </View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={(n) => String(n)}
            renderItem={renderItem}
            getItemLayout={(_d, index) => ({ length: itemHeight + PAGE_GAP, offset: (itemHeight + PAGE_GAP) * index, index })}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            contentContainerStyle={{ paddingVertical: PAGE_GAP }}
            windowSize={7}
            maxToRenderPerBatch={4}
            initialNumToRender={2}
            removeClippedSubviews
          />
        )}

        <View style={[styles.footer, { backgroundColor: colors.white, borderTopColor: colors.border }]}>
          {editingName ? (
            <TextInput
              autoFocus
              style={[styles.nameInput, { borderColor: colors.primary, color: colors.neutral }]}
              value={fileName}
              onChangeText={setFileName}
              onBlur={() => setEditingName(false)}
              onSubmitEditing={() => setEditingName(false)}
            />
          ) : (
            <Pressable style={styles.namePressable} onPress={() => setEditingName(true)}>
              <Text style={[styles.nameLabel, { color: colors.secondary }]}>Nome do arquivo</Text>
              <Text style={[styles.nameValue, { color: colors.neutral }]} numberOfLines={1}>{fileName || 'Documento_Unido'}</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.shareButton, { backgroundColor: colors.primary, opacity: sharing || !ready ? 0.6 : 1 }]}
            onPress={() => onConfirm(fileName.trim() || 'Documento_Unido')}
            disabled={sharing || !ready}
          >
            {sharing ? <ActivityIndicator color="#fff" /> : (
              <>
                <Share2 size={18} color="#fff" />
                <Text style={styles.shareButtonText}>Compartilhar</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingTop: 50, paddingBottom: spacing.sm, borderBottomWidth: 1,
  },
  headerTitle: { flex: 1, fontSize: typography.label, fontWeight: '700' },
  headerCount: { fontSize: 12, fontWeight: '600' },
  loadingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { fontSize: typography.label },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  pageBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1 },
  namePressable: { flex: 1 },
  nameLabel: { fontSize: 11, fontWeight: '600' },
  nameValue: { fontSize: typography.body, fontWeight: '700', marginTop: 1 },
  nameInput: { flex: 1, borderWidth: 1.5, borderRadius: radius.sm, padding: spacing.sm, fontSize: typography.body, fontWeight: '700' },
  shareButton: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md },
  shareButtonText: { color: '#fff', fontWeight: '700' },
});