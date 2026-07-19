// Carrossel de passos por botões "Voltar/Próximo" + bolinhas de
// progresso — sem lib de swipe externa, pra não adicionar dependência
// só por causa disso.

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { spacing, radius, typography } from '../constants/theme';
import type { ToolTutorial } from '../constants/tutorials';
import { useThemeStore } from '../store/useThemeStore';

interface Props {
  visible: boolean;
  tutorial: ToolTutorial | null;
  onClose: () => void;
}

export default function TutorialModal({ visible, tutorial, onClose }: Props) {
  const { colors } = useThemeStore();
  const [step, setStep] = useState(0);

  if (!tutorial) return null;
  const isLast = step === tutorial.steps.length - 1;
  const current = tutorial.steps[step];
  const Icon = tutorial.icon;

  function handleClose() {
    setStep(0);
    onClose();
  }

  function handleNext() {
    if (isLast) handleClose();
    else setStep((s) => s + 1);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.white }]}>
          <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={8}>
            <X size={18} color={colors.secondary} />
          </Pressable>

          <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
            <Icon size={30} color={colors.primary} />
          </View>

          <Text style={[styles.toolLabel, { color: colors.secondary }]}>{tutorial.label}</Text>
          <Text style={[styles.stepTitle, { color: colors.neutral }]}>{current.title}</Text>
          <Text style={[styles.stepDescription, { color: colors.secondary }]}>{current.description}</Text>

          <View style={styles.dotsRow}>
            {tutorial.steps.map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i === step ? colors.primary : colors.border }, i === step && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.actionsRow}>
            {step > 0 && (
              <Pressable style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={() => setStep((s) => s - 1)}>
                <Text style={{ color: colors.secondary, fontWeight: '700' }}>Voltar</Text>
              </Pressable>
            )}
            <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>{isLast ? 'Entendi' : 'Próximo'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: 360, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  closeButton: { position: 'absolute', top: spacing.sm, right: spacing.sm, padding: 4 },
  iconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  toolLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.xs },
  stepTitle: { fontSize: typography.body + 2, fontWeight: '700', marginBottom: spacing.sm, textAlign: 'center' },
  stepDescription: { fontSize: typography.label, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 18 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  secondaryButton: { flex: 1, borderWidth: 1.5, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  primaryButton: { flex: 2, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
});