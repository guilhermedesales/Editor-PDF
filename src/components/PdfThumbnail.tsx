// Gera um thumbnail (PNG da 1ª página) de um PDF local, usando o mesmo
// motor do PdfPageRasterizer. Fica invisível na árvore — só dispara o
// callback quando terminar. Cachear por uri é responsabilidade de quem
// usa este componente (ver MergePdfScreen).

import React from 'react';
import { File } from 'expo-file-system';
import PdfPageRasterizer from './PdfPageRasterizer';

interface Props {
  uri: string;
  onReady: (uri: string, thumbnailDataUri: string) => void;
}

export default function PdfThumbnail({ uri, onReady }: Props) {
  const [base64, setBase64] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const file = new File(uri);
        const b64 = await file.base64();
        if (!cancelled) setBase64(b64);
      } catch {
        // se falhar, simplesmente não gera thumbnail pra esse item
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uri]);

  if (!base64) return null;

  return (
    <PdfPageRasterizer
      base64Pdf={base64}
      onRendered={({ imageDataUri }) => onReady(uri, imageDataUri)}
      onError={() => {}}
    />
  );
}