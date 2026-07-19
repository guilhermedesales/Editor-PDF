// Modal de navegação: input pra digitar direto o número da página, e
// um slider pra arrastar e ver a página atual em tempo real (arraste
// solto — só confirma ao soltar, pra não disparar render de página a
// cada pixel).

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput } from 'react-native';
import { X } from 'lucide-react-native';
import { spacing, radius, typography } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import SliderBar from './SliderBar';

interface Props {
  visible: boolean;
  currentPage: number;
  pageCount: number;
  onJump: (page: number) => void;
  onClose: () => void;
}

export default function PageJumpModal({ visible, currentPage, pageCount, onJump, onClose }: Props) {
  const { colors } = useThemeStore();
  const [sliderPage, setSliderPage] = useState(currentPage);
  const [inputText, setInputText] = useState(String(currentPage));

  useEffect(() => {
    if (visible) {
      setSliderPage(currentPage);
      setInputText(String(currentPage));
    }
  }, [visible, currentPage]);

  function pageFromRatio(ratio: number) {
    return Math.min(Math.max(Math.round(ratio * (pageCount - 1)) + 1, 1), pageCount);
  }

  function handleConfirmInput() {
    const n = parseInt(inputText, 10);
    if (!isNaN(n) && n >= 1 && n <= pageCount) {
      onJump(n);
      onClose();
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.white }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.neutral }]}>Ir para a página</Text>
            <Pressable onPress={onClose} hitSlop={8} style={[styles.closeButton, { backgroundColor: colors.tertiary }]}>
              <X size={18} color={colors.secondary} />
            </Pressable>
          </View>

          <Text style={[styles.bigPage, { color: colors.primary }]}>{sliderPage} <Text style={[styles.bigPageOf, { color: colors.secondary }]}>de {pageCount}</Text></Text>

          <SliderBar
            value={pageCount > 1 ? (sliderPage - 1) / (pageCount - 1) : 0}
            onChange={(ratio) => setSliderPage(pageFromRatio(ratio))}
            onSlidingComplete={(ratio) => setSliderPage(pageFromRatio(ratio))}
            trackColor={colors.border}
            fillColor={colors.primary}
            thumbColor={colors.primary}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.neutral }]}
              keyboardType="numeric"
              value={inputText}
              onChangeText={setInputText}
              placeholder="Nº da página"
              placeholderTextColor={colors.secondary}
            />
            <Pressable style={[styles.goButton, { backgroundColor: colors.primary }]} onPress={handleConfirmInput}>
              <Text style={styles.goButtonText}>Ir</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.confirmButton, { backgroundColor: colors.primaryLight }]}
            onPress={() => { onJump(sliderPage); onClose(); }}
          >
            <Text style={[styles.confirmButtonText, { color: colors.primary }]}>Ir para página {sliderPage}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: 380, borderRadius: radius.lg, padding: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { fontSize: 17, fontWeight: '700' },
  closeButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bigPage: { fontSize: 34, fontWeight: '800', textAlign: 'center', marginBottom: spacing.sm },
  bigPageOf: { fontSize: 16, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  input: { flex: 1, borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, fontSize: typography.body },
  goButton: { paddingHorizontal: spacing.lg, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  goButtonText: { color: '#fff', fontWeight: '700' },
  confirmButton: { marginTop: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center' },
  confirmButtonText: { fontWeight: '700' },
});