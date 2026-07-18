// Visualizador de PDF completo (todas as páginas), usando pdf.js numa
// WebView — mesma abordagem do PdfPageRasterizer, mas aqui o HTML
// desenha TODAS as páginas em canvases empilhados. Zoom é feito via
// CSS transform, controlado pelos botões +/- da barra flutuante
// (mockup "Visualizador de PDF").

import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Sharing from 'expo-sharing';
import { ArrowLeft, Share2, MoreVertical, Minus, Plus } from 'lucide-react-native';
import { useThemeStore } from '../store/useThemeStore';
import { spacing, typography } from '../constants/theme';

interface Props {
  route: { params: { uri: string; name: string } };
  navigation: any;
}

const buildHtml = (fileUri: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <style>
      html, body { margin: 0; background: #737373; }
      #pages { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 10px 0 60px; }
      canvas { box-shadow: 0 1px 6px rgba(0,0,0,0.3); background: #fff; }
    </style>
  </head>
  <body>
    <div id="pages"></div>
    <script>
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      function post(msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }

      async function render() {
        try {
          const pdf = await pdfjsLib.getDocument("${fileUri}").promise;
          post({ type: 'meta', pageCount: pdf.numPages });
          const container = document.getElementById('pages');
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            container.appendChild(canvas);
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          }
        } catch (err) {
          post({ type: 'error', message: String(err) });
        }
      }

      window.setZoom = function(scale) {
        const el = document.getElementById('pages');
        el.style.transform = 'scale(' + scale + ')';
        el.style.transformOrigin = 'top center';
      };

      render();
    </script>
  </body>
</html>
`;

export default function PdfViewerScreen({ route, navigation }: Props) {
  const { uri, name } = route.params;
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const webviewRef = useRef<WebView>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);

  const html = useMemo(() => buildHtml(uri), [uri]);
  const baseDir = uri.substring(0, uri.lastIndexOf('/'));

  function handleMessage(event: WebViewMessageEvent) {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'meta') setPageCount(data.pageCount);
    if (data.type === 'error') setLoadError(data.message);
  }

  function applyZoom(next: number) {
    const clamped = Math.min(Math.max(next, 0.5), 3);
    setZoom(clamped);
    webviewRef.current?.injectJavaScript(`window.setZoom(${clamped}); true;`);
  }

  async function handleShare() {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar PDF' });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.neutral} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.primary }]} numberOfLines={1}>{name}</Text>
        <Pressable hitSlop={8} onPress={handleShare} style={{ marginRight: spacing.sm }}>
          <Share2 size={20} color={colors.secondary} />
        </Pressable>
        <Pressable hitSlop={8}>
          <MoreVertical size={20} color={colors.secondary} />
        </Pressable>
      </View>

      {loadError ? (
        <View style={styles.errorBox}>
          <Text style={{ color: colors.danger, textAlign: 'center' }}>
            Não foi possível abrir este PDF.{'\n'}{loadError}
          </Text>
        </View>
      ) : (
        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html, baseUrl: baseDir }}
          onMessage={handleMessage}
          javaScriptEnabled
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          allowingReadAccessToURL={baseDir}
          style={{ flex: 1, backgroundColor: '#737373' }}
        />
      )}

      <View style={[styles.footer, { backgroundColor: colors.neutral }]}>
        <Text style={styles.footerPageText}>{pageCount ? `${pageCount} página${pageCount > 1 ? 's' : ''}` : '...'}</Text>
        <View style={styles.zoomControls}>
          <Pressable style={styles.zoomButton} onPress={() => applyZoom(zoom - 0.25)}>
            <Minus size={16} color="#fff" />
          </Pressable>
          <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
          <Pressable style={styles.zoomButton} onPress={() => applyZoom(zoom + 0.25)}>
            <Plus size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  headerTitle: { flex: 1, fontSize: typography.label, fontWeight: '700' },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  footer: {
    position: 'absolute', bottom: spacing.md, left: spacing.lg, right: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, opacity: 0.92,
  },
  footerPageText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  zoomControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  zoomButton: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  zoomText: { color: '#fff', fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'center' },
});