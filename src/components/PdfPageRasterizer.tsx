// Converte a 1ª página de um PDF numa imagem PNG, usando PDF.js dentro
// de uma WebView invisível. É um componente "headless": não renderiza
// nada visível na tela (opacity: 0, tamanho 1x1), só existe pra rodar
// o JS de conversão e devolver o resultado via callback.
//
// Por que não usar uma lib nativa (ex: react-native-pdf)? Porque exige
// build customizado (dev client), e o app roda em Expo Go.

import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

interface Props {
  base64Pdf: string; // conteúdo do PDF em base64, sem o prefixo data:
  onRendered: (params: {
    imageDataUri: string; // pronto pra usar direto num <Image source={{uri}}>
    pageWidth: number; // em pontos de PDF (igual ao pdf-lib usa)
    pageHeight: number;
  }) => void;
  onError: (message: string) => void;
}

// HTML carregado dentro da WebView. Usamos a build UMD do pdf.js via
// CDN (permitido pela config de rede) — evita ter que empacotar o pdf.js
// como asset local.
const buildHtml = (base64Pdf: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  </head>
  <body style="margin:0">
    <canvas id="canvas"></canvas>
    <script>
      // Escala usada só para a QUALIDADE da imagem renderizada — não
      // confundir com o tamanho em pontos, que é sempre pego na escala 1.
      const RENDER_SCALE = 2;

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      function base64ToUint8Array(base64) {
        const raw = atob(base64);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        return arr;
      }

      async function render() {
        try {
          const data = base64ToUint8Array("${base64Pdf}");
          const pdf = await pdfjsLib.getDocument({ data }).promise;
          const page = await pdf.getPage(1);

          // viewport na escala 1 = dimensões em pontos de PDF (72dpi).
          // É esse número que vai pro app como pageWidth/pageHeight,
          // porque é o mesmo sistema de coordenadas que o pdf-lib usa
          // pra desenhar texto na hora de gerar o PDF final.
          const unscaledViewport = page.getViewport({ scale: 1 });

          const viewport = page.getViewport({ scale: RENDER_SCALE });
          const canvas = document.getElementById('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          await page.render({ canvasContext: ctx, viewport }).promise;

          const imageDataUri = canvas.toDataURL('image/png');

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'success',
            imageDataUri,
            pageWidth: unscaledViewport.width,
            pageHeight: unscaledViewport.height,
          }));
        } catch (err) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: String(err),
          }));
        }
      }

      render();
    </script>
  </body>
</html>
`;

export default function PdfPageRasterizer({ base64Pdf, onRendered, onError }: Props) {
  // useRef evita recriar o HTML (e re-disparar a renderização) em
  // re-renders do componente pai que não mudam o base64Pdf.
  const htmlRef = useRef(buildHtml(base64Pdf));

  function handleMessage(event: WebViewMessageEvent) {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'success') {
      onRendered({
        imageDataUri: data.imageDataUri,
        pageWidth: data.pageWidth,
        pageHeight: data.pageHeight,
      });
    } else {
      onError(data.message);
    }
  }

  return (
    <View style={styles.hidden} pointerEvents="none">
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlRef.current }}
        onMessage={handleMessage}
        javaScriptEnabled
        // Precisa ficar com tamanho > 0 em alguns Androids, senão o
        // WebView não executa o JS interno.
        style={{ width: 1, height: 1 }}
      />
    </View>
  );
}

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