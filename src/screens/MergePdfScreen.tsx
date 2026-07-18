// Ferramenta "Juntar PDFs": seleciona vários arquivos, deixa reordenar
// (setas cima/baixo) e mescla tudo com pdf-lib num único documento.

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, ArrowUp, ArrowDown, X, Combine } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { PDFDocument } from 'pdf-lib';
import { File } from 'expo-file-system';
import { useThemeStore } from '../store/useThemeStore';
import { spacing, radius, typography } from '../constants/theme';
import { pickMultiplePdfs, saveGeneratedPdf } from '../services/pdfFileIO';

interface PickedPdf { uri: string; name: string; }

export default function MergePdfScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [items, setItems] = useState<PickedPdf[]>([]);
  const [working, setWorking] = useState(false);

  async function handleAdd() {
    const picked = await pickMultiplePdfs();
    if (picked.length > 0) setItems((prev) => [...prev, ...picked]);
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

  async function handleMerge() {
    if (items.length < 2) {
      Alert.alert('Adicione ao menos 2 PDFs', 'Selecione pelo menos dois arquivos para juntar.');
      return;
    }
    setWorking(true);
    try {
      const merged = await PDFDocument.create();
      for (const item of items) {
        const bytes = await new File(item.uri).bytes();
        const src = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const mergedBytes = await merged.save();
      const { uri } = await saveGeneratedPdf(mergedBytes, `Documento_Unido_${Date.now()}`);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar PDF' });
      else Alert.alert('PDF gerado', `Salvo em: ${uri}`);

      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erro ao juntar PDFs', String(err?.message ?? err));
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
        <Text style={[styles.headerTitle, { color: colors.neutral }]}>Juntar PDFs</Text>
        <View style={{ width: 22 }} />
      </View>

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
            <Text style={[styles.itemIndex, { color: colors.primary }]}>{index + 1}</Text>
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
          onPress={handleMerge}
          disabled={working}
        >
          {working ? <ActivityIndicator color={colors.white} /> : <Text style={styles.mergeButtonText}>Juntar e Compartilhar</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: typography.body, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm, paddingHorizontal: spacing.lg },
  emptyText: { textAlign: 'center', fontSize: typography.label },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md },
  itemIndex: { fontWeight: '800', width: 20, textAlign: 'center' },
  itemName: { flex: 1, fontWeight: '600' },
  footer: { padding: spacing.md, borderTopWidth: 1, gap: spacing.sm },
  addButton: { flexDirection: 'row', gap: spacing.xs, borderWidth: 1.5, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { fontWeight: '700' },
  mergeButton: { borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  mergeButtonText: { color: '#fff', fontWeight: '700' },
});