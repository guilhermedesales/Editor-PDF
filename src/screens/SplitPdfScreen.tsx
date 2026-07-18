import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Scissors, FileText } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { PDFDocument } from 'pdf-lib';
import { File } from 'expo-file-system';
import { useThemeStore } from '../store/useThemeStore';
import { spacing, radius, typography } from '../constants/theme';
import { saveGeneratedPdf } from '../services/pdfFileIO';

// Aceita "1-3,5,7-9" -> índices zero-based, já validados contra o
// total de páginas do documento carregado.
function parsePageRanges(input: string, totalPages: number): number[] {
  const indices = new Set<number>();
  const parts = input.split(',').map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let n = start; n <= end; n++) if (n >= 1 && n <= totalPages) indices.add(n - 1);
    } else if (/^\d+$/.test(part)) {
      const n = parseInt(part, 10);
      if (n >= 1 && n <= totalPages) indices.add(n - 1);
    }
  }
  return [...indices].sort((a, b) => a - b);
}

export default function SplitPdfScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [rangeInput, setRangeInput] = useState('');
  const [working, setWorking] = useState(false);

  async function handlePick() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    const bytes = await new File(asset.uri).bytes();
    const doc = await PDFDocument.load(bytes);
    setSourceUri(asset.uri);
    setSourceName(asset.name);
    setTotalPages(doc.getPageCount());
    setRangeInput(`1-${doc.getPageCount()}`);
  }

  async function handleSplit() {
    if (!sourceUri) {
      Alert.alert('Selecione um PDF primeiro');
      return;
    }
    const indices = parsePageRanges(rangeInput, totalPages);
    if (indices.length === 0) {
      Alert.alert('Intervalo inválido', 'Confira os números de página digitados.');
      return;
    }
    setWorking(true);
    try {
      const bytes = await new File(sourceUri).bytes();
      const src = await PDFDocument.load(bytes);
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, indices);
      pages.forEach((p) => out.addPage(p));
      const outBytes = await out.save();
      const { uri } = await saveGeneratedPdf(outBytes, `${sourceName.replace(/\.pdf$/i, '')}_paginas`);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar PDF' });
      else Alert.alert('PDF gerado', `Salvo em: ${uri}`);

      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erro ao dividir PDF', String(err?.message ?? err));
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
        <Text style={[styles.headerTitle, { color: colors.neutral }]}>Dividir PDF</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        {!sourceUri ? (
          <Pressable style={[styles.pickCard, { backgroundColor: colors.tertiary }]} onPress={handlePick}>
            <Scissors size={28} color={colors.primary} />
            <Text style={[styles.pickText, { color: colors.neutral }]}>Selecionar PDF</Text>
          </Pressable>
        ) : (
          <>
            <View style={[styles.sourceRow, { backgroundColor: colors.tertiary }]}>
              <FileText size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sourceName, { color: colors.neutral }]} numberOfLines={1}>{sourceName}</Text>
                <Text style={[styles.sourceMeta, { color: colors.secondary }]}>{totalPages} páginas</Text>
              </View>
              <Pressable onPress={handlePick}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Trocar</Text>
              </Pressable>
            </View>

            <Text style={[styles.label, { color: colors.neutral }]}>Páginas a extrair</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.neutral }]}
              value={rangeInput}
              onChangeText={setRangeInput}
              placeholder={`Ex: 1-3,5 (total: ${totalPages})`}
              placeholderTextColor={colors.secondary}
            />
            <Text style={[styles.hint, { color: colors.secondary }]}>
              Use vírgula para páginas separadas e hífen para intervalos.
            </Text>

            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary, opacity: working ? 0.6 : 1 }]}
              onPress={handleSplit}
              disabled={working}
            >
              {working ? <ActivityIndicator color={colors.white} /> : <Text style={styles.actionButtonText}>Extrair e Compartilhar</Text>}
            </Pressable>
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
  pickCard: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, paddingVertical: spacing.xl },
  pickText: { fontWeight: '700' },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, marginBottom: spacing.md },
  sourceName: { fontWeight: '700' },
  sourceMeta: { fontSize: 12 },
  label: { fontWeight: '700', marginBottom: spacing.xs },
  input: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.xs },
  hint: { fontSize: 12, marginBottom: spacing.md },
  actionButton: { borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#fff', fontWeight: '700' },
});