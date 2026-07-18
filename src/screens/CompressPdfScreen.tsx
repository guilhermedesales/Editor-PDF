import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, FileArchive, FileText } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { PDFDocument } from 'pdf-lib';
import { File } from 'expo-file-system';
import { useThemeStore } from '../store/useThemeStore';
import { spacing, radius, typography } from '../constants/theme';
import { saveGeneratedPdf } from '../services/pdfFileIO';

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CompressPdfScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [originalSize, setOriginalSize] = useState(0);
  const [working, setWorking] = useState(false);
  const [resultSize, setResultSize] = useState<number | null>(null);

  async function handlePick() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    const bytes = await new File(asset.uri).bytes();
    setSourceUri(asset.uri);
    setSourceName(asset.name);
    setOriginalSize(bytes.byteLength);
    setResultSize(null);
  }

  async function handleCompress() {
    if (!sourceUri) return;
    setWorking(true);
    try {
      const bytes = await new File(sourceUri).bytes();
      const doc = await PDFDocument.load(bytes);
      doc.setTitle('');
      doc.setAuthor('');
      doc.setSubject('');
      doc.setKeywords([]);
      const outBytes = await doc.save({ useObjectStreams: true });
      const { uri } = await saveGeneratedPdf(outBytes, `${sourceName.replace(/\.pdf$/i, '')}_compactado`);
      setResultSize(outBytes.byteLength);

      Alert.alert(
        'PDF compactado',
        `Tamanho original: ${formatSize(originalSize)}\nNovo tamanho: ${formatSize(outBytes.byteLength)}`,
        [
          { text: 'Fechar' },
          {
            text: 'Compartilhar',
            onPress: async () => {
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Erro ao compactar', String(err?.message ?? err));
    } finally {
      setWorking(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.neutral} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.neutral }]}>Compactar PDF</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text style={[styles.hint, { color: colors.secondary }]}>
          A compactação reduz o peso da estrutura interna do arquivo. É mais eficaz em PDFs com muito texto e menos eficaz em PDFs com imagens muito pesadas.
        </Text>

        {!sourceUri ? (
          <Pressable style={[styles.pickCard, { backgroundColor: colors.tertiary }]} onPress={handlePick}>
            <FileArchive size={28} color={colors.primary} />
            <Text style={[styles.pickText, { color: colors.neutral }]}>Selecionar PDF</Text>
          </Pressable>
        ) : (
          <>
            <View style={[styles.sourceRow, { backgroundColor: colors.tertiary }]}>
              <FileText size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sourceName, { color: colors.neutral }]} numberOfLines={1}>{sourceName}</Text>
                <Text style={[styles.sourceMeta, { color: colors.secondary }]}>{formatSize(originalSize)}</Text>
              </View>
              <Pressable onPress={handlePick}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Trocar</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary, opacity: working ? 0.6 : 1 }]}
              onPress={handleCompress}
              disabled={working}
            >
              {working ? <ActivityIndicator color={colors.white} /> : <Text style={styles.actionButtonText}>Compactar</Text>}
            </Pressable>

            {resultSize !== null && (
              <Text style={[styles.resultText, { color: colors.secondary }]}>
                Última compactação: {formatSize(originalSize)} → {formatSize(resultSize)}
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: typography.body, fontWeight: '700' },
  hint: { fontSize: 12, marginBottom: spacing.md, lineHeight: 17 },
  pickCard: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, paddingVertical: spacing.xl },
  pickText: { fontWeight: '700' },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, marginBottom: spacing.md },
  sourceName: { fontWeight: '700' },
  sourceMeta: { fontSize: 12 },
  actionButton: { borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#fff', fontWeight: '700' },
  resultText: { textAlign: 'center', marginTop: spacing.md, fontSize: 12 },
});