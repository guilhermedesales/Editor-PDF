// Motor de renderização de PDF: fica numa WebView invisível rodando
// pdf.js, e renderiza qualquer página sob demanda (via renderPage),
// devolvendo um PNG pronto pra usar num <Image>. Diferente do
// PdfPageRasterizer (que só renderiza a primeira página, usado no
// editor de template), este mantém o documento carregado e responde a
// pedidos de páginas específicas — usado pelo PdfViewerScreen pra
// navegação com cache de páginas vizinhas.

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface RenderedPage {
  pageNumber: number;
  imageDataUri: string;
  pageWidth: number; // em pontos de PDF, escala 1 (mesmo sistema do pdf-lib)
  pageHeight: number;
}

export interface PdfEngineHandle {
  renderPage: (pageNumber: number, targetWidth: number) => void;
}

interface Props {
  base64Pdf: string;
  onLoaded: (pageCount: number) => void;
  onPageRendered: (page: RenderedPage) => void;
  onError: (message: string) => void;
}

const buildHtml = (base64Pdf: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  </head>
  <body style="margin:0">
    <script>
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      let pdfDoc = null;

      function post(msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }

      function base64ToUint8Array(base64) {
        const raw = atob(base64);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        return arr;
      }

      async function loadDoc() {
        try {
          const data = base64ToUint8Array("${base64Pdf}");
          pdfDoc = await pdfjsLib.getDocument({ data }).promise;
          post({ type: 'loaded', pageCount: pdfDoc.numPages });
        } catch (err) {
          post({ type: 'error', message: String(err) });
        }
      }

      // Exposto pro lado nativo chamar via injectJavaScript.
      window.__renderPage = async function (pageNumber, targetWidth) {
        try {
          if (!pdfDoc) { post({ type: 'error', message: 'PDF não carregado' }); return; }
          const page = await pdfDoc.getPage(pageNumber);

          // dimensões em pontos (escala 1) — usadas pro app calcular o
          // tamanho de exibição, sem relação com a qualidade da imagem
          const unscaled = page.getViewport({ scale: 1 });

          // escala de renderização: mira numa imagem ~2x a largura da
          // tela, pra ficar nítida mesmo com zoom, sem exagerar no peso
          const renderScale = Math.max(1.5, (targetWidth * 2) / unscaled.width);
          const viewport = page.getViewport({ scale: renderScale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          await page.render({ canvasContext: ctx, viewport }).promise;

          const imageDataUri = canvas.toDataURL('image/png');
          post({
            type: 'page', pageNumber, imageDataUri,
            pageWidth: unscaled.width, pageHeight: unscaled.height,
          });
        } catch (err) {
          post({ type: 'error', message: String(err), pageNumber });
        }
      };

      loadDoc();
    </script>
  </body>
</html>
`;

const PdfEngine = forwardRef<PdfEngineHandle, Props>(function PdfEngine(
  { base64Pdf, onLoaded, onPageRendered, onError },
  ref
) {
  const webviewRef = useRef<WebView>(null);
  // useRef evita reconstruir o HTML (e recarregar o PDF do zero) em
  // re-renders do componente pai que não mudam o base64Pdf.
  const htmlRef = useRef(buildHtml(base64Pdf));

  useImperativeHandle(ref, () => ({
    renderPage: (pageNumber: number, targetWidth: number) => {
      webviewRef.current?.injectJavaScript(
        `window.__renderPage(${pageNumber}, ${targetWidth}); true;`
      );
    },
  }));

  function handleMessage(event: WebViewMessageEvent) {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'loaded') {
      onLoaded(data.pageCount);
    } else if (data.type === 'page') {
      onPageRendered({
        pageNumber: data.pageNumber,
        imageDataUri: data.imageDataUri,
        pageWidth: data.pageWidth,
        pageHeight: data.pageHeight,
      });
    } else if (data.type === 'error') {
      onError(data.message);
    }
  }

  return (
    <View style={styles.hidden} pointerEvents="none">
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: htmlRef.current }}
        onMessage={handleMessage}
        javaScriptEnabled
        style={{ width: 1, height: 1 }}
      />
    </View>
  );
});

export default PdfEngine;

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    width: 1,
    height: 1,
    opacity: 0,
  },
});