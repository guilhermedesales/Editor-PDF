import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, X, FileImage } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { PDFDocument } from 'pdf-lib';
import { File } from 'expo-file-system';
import { useThemeStore } from '../store/useThemeStore';
import { spacing, radius, typography } from '../constants/theme';
import { saveGeneratedPdf } from '../services/pdfFileIO';

interface PickedImage { uri: string; type: 'jpeg' | 'png'; }

export default function ConvertToPdfScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [images, setImages] = useState<PickedImage[]>([]);
  const [working, setWorking] = useState(false);

  async function handleAdd() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 1,
    });
    if (result.canceled) return;
    const picked: PickedImage[] = result.assets.map((a) => ({
      uri: a.uri, type: a.uri.toLowerCase().endsWith('.png') ? 'png' : 'jpeg',
    }));
    setImages((prev) => [...prev, ...picked]);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleConvert() {
    if (images.length === 0) {
      Alert.alert('Adicione ao menos uma imagem');
      return;
    }
    setWorking(true);
    try {
      const pdfDoc = await PDFDocument.create();
      for (const img of images) {
        const bytes = await new File(img.uri).bytes();
        const embedded = img.type === 'png' ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
        const page = pdfDoc.addPage([embedded.width, embedded.height]);
        page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
      }
      const pdfBytes = await pdfDoc.save();
      const { uri } = await saveGeneratedPdf(pdfBytes, `Imagens_para_PDF_${Date.now()}`);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar PDF' });
      else Alert.alert('PDF gerado', `Salvo em: ${uri}`);

      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erro ao converter', String(err?.message ?? err));
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
        <Text style={[styles.headerTitle, { color: colors.neutral }]}>Converter para PDF</Text>
        <View style={{ width: 22 }} />
      </View>

      <Text style={[styles.hint, { color: colors.secondary }]}>
        Por enquanto, esta ferramenta converte fotos e imagens em PDF (cada imagem vira uma página). Conversão de arquivos do Office chega em uma próxima versão.
      </Text>

      <FlatList
        data={images}
        keyExtractor={(item, i) => `${item.uri}-${i}`}
        numColumns={3}
        columnWrapperStyle={{ gap: spacing.sm }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FileImage size={32} color={colors.secondary} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>Nenhuma imagem selecionada ainda.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.thumbWrap}>
            <Image source={{ uri: item.uri }} style={styles.thumb} />
            <Pressable style={styles.removeBadge} onPress={() => removeImage(index)}>
              <X size={12} color="#fff" />
            </Pressable>
          </View>
        )}
      />

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Pressable style={[styles.addButton, { borderColor: colors.primary }]} onPress={handleAdd}>
          <Plus size={18} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>Adicionar Imagens</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.primary, opacity: working ? 0.6 : 1 }]}
          onPress={handleConvert}
          disabled={working}
        >
          {working ? <ActivityIndicator color={colors.white} /> : <Text style={styles.actionButtonText}>Converter e Compartilhar</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: typography.body, fontWeight: '700' },
  hint: { fontSize: 12, paddingHorizontal: spacing.md, marginBottom: spacing.xs },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm, width: '100%' },
  emptyText: { textAlign: 'center', fontSize: typography.label },
  thumbWrap: { width: 100, height: 100, borderRadius: radius.sm, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  removeBadge: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  footer: { padding: spacing.md, borderTopWidth: 1, gap: spacing.sm },
  addButton: { flexDirection: 'row', gap: spacing.xs, borderWidth: 1.5, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { fontWeight: '700' },
  actionButton: { borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#fff', fontWeight: '700' },
});