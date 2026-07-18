// Visualizador de PDF: rolagem vertical contínua, com pinça de 2 dedos
// pra zoom (ZoomablePdfView envolvendo a lista inteira — o zoom não
// conflita com o scroll normal de 1 dedo, já que só ativa com 2
// toques simultâneos). Overlay de brilho ajustável e tema de leitura
// escolhido explicitamente (persistidos). Navegação por toque no
// indicador de página, abrindo um slider pra pular direto.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Dimensions, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { File } from 'expo-file-system';
import { ArrowLeft, Share2, Printer, SlidersHorizontal } from 'lucide-react-native';
import { useThemeStore } from '../store/useThemeStore';
import { spacing, typography } from '../constants/theme';
import PdfEngine, { type PdfEngineHandle, type RenderedPage } from '../components/PdfEngine';
import PdfZoomModal from '../components/PdfZoomModal';
import ZoomablePdfView from '../components/ZoomablePdfView';
import ReadingSettingsModal from '../components/ReadingSettingsModal';
import PageJumpModal from '../components/PageJumpModal';
import {
  getLastPage, saveLastPage, getReadingTheme, saveReadingTheme,
  getBrightness, saveBrightness, type ReadingTheme,
} from '../services/pdfReadingProgress';

interface Props {
  route: { params: { uri: string; name: string } };
  navigation: any;
}

const HEADER_HEIGHT = 52;
const FOOTER_HEIGHT = 44;
const CACHE_RADIUS = 6; // mantém em memória páginas a até 6 de distância da atual
const PREFETCH_AHEAD = 3;
const PAGE_GAP = 10;
const DOUBLE_TAP_MS = 280;

const READING_THEMES: { key: ReadingTheme; overlay: string | null; bg: string }[] = [
  { key: 'claro', overlay: null, bg: '#737373' },
  { key: 'sepia', overlay: 'rgba(244, 232, 193, 0.38)', bg: '#8A7F68' },
  { key: 'escuro', overlay: 'rgba(0, 0, 0, 0.55)', bg: '#1A1A1A' },
];

export default function PdfViewerScreen({ route, navigation }: Props) {
  const { uri, name } = route.params;
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const engineRef = useRef<PdfEngineHandle>(null);
  const listRef = useRef<FlatList<number>>(null);
  const currentPageRef = useRef(1);
  const lastTapRef = useRef<{ page: number; time: number }>({ page: 0, time: 0 });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<Map<number, RenderedPage>>(new Map());
  const [pageAspect, setPageAspect] = useState<number | null>(null); // height/width em pontos
  const [restoredPage, setRestoredPage] = useState<number | null>(null);
  const [readyToShow, setReadyToShow] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('claro');
  const [brightness, setBrightness] = useState(1);
  const [zoomPage, setZoomPage] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPageJump, setShowPageJump] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const screenWidth = Dimensions.get('window').width;
  const availWidth = screenWidth;
  const itemHeight = pageAspect ? availWidth * pageAspect : 0;
  const themeConfig = READING_THEMES.find((t) => t.key === readingTheme)!;

  // Carrega preferências salvas (última página, tema, brilho).
  useEffect(() => {
    getLastPage(uri).then(setRestoredPage);
    getReadingTheme().then(setReadingTheme);
    getBrightness().then(setBrightness);
  }, [uri]);

  // Lê o PDF do disco e converte pra base64 uma única vez.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const file = new File(uri);
        const base64 = await file.base64();
        if (!cancelled) setPdfBase64(base64);
      } catch (err: any) {
        if (!cancelled) setLoadError(String(err?.message ?? err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uri]);

  function requestPage(pageNumber: number) {
    engineRef.current?.renderPage(pageNumber, Math.round(availWidth));
  }

  function handleLoaded(count: number) {
    setPageCount(count);
    requestPage(1);
    // pré-carrega as próximas páginas logo de cara, pra reduzir a
    // sensação de "sempre carregando" ao rolar
    for (let p = 2; p <= Math.min(count, 1 + PREFETCH_AHEAD); p++) requestPage(p);
  }

  function handlePageRendered(page: RenderedPage) {
    setPages((prev) => {
      const next = new Map(prev);
      next.set(page.pageNumber, page);
      for (const key of Array.from(next.keys())) {
        if (Math.abs(key - currentPageRef.current) > CACHE_RADIUS) next.delete(key);
      }
      return next;
    });

    if (pageAspect === null) {
      setPageAspect(page.pageHeight / page.pageWidth);
    }
  }

  function handleEngineError(message: string) {
    setLoadError(message);
  }

  useEffect(() => {
    if (pageAspect !== null && restoredPage !== null && pageCount !== null && !readyToShow) {
      setReadyToShow(true);
    }
  }, [pageAspect, restoredPage, pageCount, readyToShow]);

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveLastPage(uri, currentPage), 600);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [currentPage, uri]);

  useEffect(() => {
    return () => {
      saveLastPage(uri, currentPageRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChangeTheme(theme: ReadingTheme) {
    setReadingTheme(theme);
    saveReadingTheme(theme);
  }

  function handleChangeBrightness(value: number) {
    setBrightness(value);
  }

  function handleSlidingBrightnessDone(value: number) {
    saveBrightness(value);
  }

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 55 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const page = viewableItems[0].item as number;
      setCurrentPage(page);
      requestPage(page);
      for (let p = page + 1; p <= Math.min(page + PREFETCH_AHEAD, pageCount ?? 0); p++) requestPage(p);
      if (page - 1 >= 1) requestPage(page - 1);
    }
  }).current;

  function handlePagePress(pageNumber: number) {
    const now = Date.now();
    if (lastTapRef.current.page === pageNumber && now - lastTapRef.current.time < DOUBLE_TAP_MS) {
      setZoomPage(pageNumber);
      lastTapRef.current = { page: 0, time: 0 };
    } else {
      lastTapRef.current = { page: pageNumber, time: now };
    }
  }

  function handleJumpToPage(page: number) {
    if (!pageCount) return;
    const index = Math.min(Math.max(page - 1, 0), pageCount - 1);
    requestPage(page);
    setCurrentPage(page);
    listRef.current?.scrollToIndex({ index, animated: true });
  }

  async function handleShare() {
    setSharing(true);
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar PDF' });
    } finally {
      setSharing(false);
    }
  }

  async function handlePrint() {
    setPrinting(true);
    try {
      await Print.printAsync({ uri });
    } catch {
      // usuário cancelou o diálogo, ou não há impressora disponível
    } finally {
      setPrinting(false);
    }
  }

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: itemHeight + PAGE_GAP,
      offset: (itemHeight + PAGE_GAP) * index,
      index,
    }),
    [itemHeight]
  );

  const listData = useMemo(() => (pageCount ? Array.from({ length: pageCount }, (_, i) => i + 1) : []), [pageCount]);

  function renderItem({ item: pageNumber }: { item: number }) {
    const rendered = pages.get(pageNumber);
    return (
      <Pressable
        style={{ width: availWidth, height: itemHeight, marginBottom: PAGE_GAP, backgroundColor: themeConfig.bg }}
        onPress={() => handlePagePress(pageNumber)}
      >
        {rendered ? (
          <>
            <Image source={{ uri: rendered.imageDataUri }} style={StyleSheet.absoluteFillObject} resizeMode="contain" />
            {themeConfig.overlay && (
              <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: themeConfig.overlay }]} />
            )}
          </>
        ) : (
          <View style={styles.placeholder}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
        <View pointerEvents="none" style={styles.pageBadge}>
          <Text style={styles.pageBadgeText}>{pageNumber}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {pdfBase64 && (
        <PdfEngine
          ref={engineRef}
          base64Pdf={pdfBase64}
          onLoaded={handleLoaded}
          onPageRendered={handlePageRendered}
          onError={handleEngineError}
        />
      )}

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.neutral} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.neutral }]} numberOfLines={1}>{name}</Text>

        <Pressable hitSlop={8} onPress={() => setShowSettings(true)} style={{ marginRight: spacing.md }}>
          <SlidersHorizontal size={20} color={colors.secondary} />
        </Pressable>
        <Pressable hitSlop={8} onPress={handlePrint} disabled={printing} style={{ marginRight: spacing.md, opacity: printing ? 0.4 : 1 }}>
          {printing ? <ActivityIndicator size="small" color={colors.secondary} /> : <Printer size={20} color={colors.secondary} />}
        </Pressable>
        <Pressable hitSlop={8} onPress={handleShare} disabled={sharing} style={{ opacity: sharing ? 0.4 : 1 }}>
          {sharing ? <ActivityIndicator size="small" color={colors.secondary} /> : <Share2 size={20} color={colors.secondary} />}
        </Pressable>
      </View>

      {loadError ? (
        <View style={styles.errorBox}>
          <Text style={{ color: colors.danger, textAlign: 'center' }}>
            Não foi possível abrir este PDF.{'\n'}{loadError}
          </Text>
        </View>
      ) : !readyToShow ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.secondary }]}>
            {pageCount ? `Preparando ${pageCount} páginas...` : 'Abrindo documento...'}
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ZoomablePdfView onScaleChange={setZoomScale}>
            <FlatList
              ref={listRef}
              data={listData}
              keyExtractor={(n) => String(n)}
              renderItem={renderItem}
              getItemLayout={getItemLayout}
              initialScrollIndex={Math.min(Math.max((restoredPage ?? 1) - 1, 0), listData.length - 1)}
              onScrollToIndexFailed={({ index }) => {
                setTimeout(() => listRef.current?.scrollToIndex({ index, animated: false }), 50);
              }}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              style={{ backgroundColor: themeConfig.bg, width: availWidth }}
              contentContainerStyle={{ paddingVertical: PAGE_GAP }}
              windowSize={9}
              maxToRenderPerBatch={4}
              initialNumToRender={3}
              removeClippedSubviews
              showsVerticalScrollIndicator
              scrollEnabled={zoomScale <= 1.02}
            />
          </ZoomablePdfView>

          {brightness < 1 && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(0,0,0,${(1 - brightness) * 0.85})` }]} />
          )}
        </View>
      )}

      <Pressable style={styles.footer} onPress={() => setShowPageJump(true)}>
        <Text style={styles.footerPageText}>
          {pageCount ? `${currentPage} de ${pageCount}` : '...'}
        </Text>
      </Pressable>

      <PdfZoomModal
        visible={zoomPage !== null}
        imageUri={zoomPage ? pages.get(zoomPage)?.imageDataUri ?? null : null}
        pageNumber={zoomPage ?? 1}
        pageCount={pageCount ?? 1}
        onClose={() => setZoomPage(null)}
      />

      <ReadingSettingsModal
        visible={showSettings}
        theme={readingTheme}
        brightness={brightness}
        onChangeTheme={handleChangeTheme}
        onChangeBrightness={handleChangeBrightness}
        onClose={() => { setShowSettings(false); saveBrightness(brightness); }}
      />

      <PageJumpModal
        visible={showPageJump}
        currentPage={currentPage}
        pageCount={pageCount ?? 1}
        onJump={handleJumpToPage}
        onClose={() => setShowPageJump(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, height: HEADER_HEIGHT, borderBottomWidth: 1,
  },
  headerTitle: { flex: 1, fontSize: typography.label, fontWeight: '700' },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  loadingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { fontSize: typography.label },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageBadge: {
    position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  pageBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  footer: {
    position: 'absolute', bottom: spacing.md, alignSelf: 'center',
    height: FOOTER_HEIGHT, paddingHorizontal: spacing.lg, borderRadius: 999,
    backgroundColor: 'rgba(17, 17, 17, 0.85)', alignItems: 'center', justifyContent: 'center',
  },
  footerPageText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});