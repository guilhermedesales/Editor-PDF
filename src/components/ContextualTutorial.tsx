import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { HelpCircle, X } from 'lucide-react-native';
import { spacing, radius, typography } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import { markTutorial, shouldShowTutorial } from '../services/tutorialProgressStorage';

export interface ContextualTutorialStep {
  title: string;
  description: string;
  targetLabel?: string;
}

interface Props {
  id: string;
  steps: ContextualTutorialStep[];
  autoStart?: boolean;
  visible?: boolean;
  onClose?: () => void;
}

export default function ContextualTutorial({ id, steps, autoStart, visible, onClose }: Props) {
  const { colors } = useThemeStore();
  const [internalVisible, setInternalVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!autoStart) return;
    shouldShowTutorial(id).then((show) => {
      if (show) setInternalVisible(true);
    });
  }, [autoStart, id]);

  const isVisible = visible ?? internalVisible;
  const current = steps[stepIndex] ?? steps[0];
  const isLast = stepIndex >= steps.length - 1;

  async function close(status: 'completed' | 'skipped') {
    await markTutorial(id, status);
    setStepIndex(0);
    setInternalVisible(false);
    onClose?.();
  }

  if (!current) return null;

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={() => close('skipped')}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.white }]}> 
          <Pressable style={styles.closeButton} onPress={() => close('skipped')} hitSlop={8}>
            <X size={18} color={colors.secondary} />
          </Pressable>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}> 
            <HelpCircle size={26} color={colors.primary} />
          </View>
          {current.targetLabel && <Text style={[styles.target, { color: colors.primary }]}>{current.targetLabel}</Text>}
          <Text style={[styles.title, { color: colors.neutral }]}>{current.title}</Text>
          <Text style={[styles.description, { color: colors.secondary }]}>{current.description}</Text>
          <View style={styles.dotsRow}>{steps.map((_, i) => <View key={i} style={[styles.dot, { backgroundColor: i === stepIndex ? colors.primary : colors.border }]} />)}</View>
          <View style={styles.actionsRow}>
            <Pressable style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={() => close('skipped')}>
              <Text style={[styles.secondaryText, { color: colors.secondary }]}>Pular</Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => isLast ? close('completed') : setStepIndex((s) => s + 1)}>
              <Text style={styles.primaryText}>{isLast ? 'Concluir' : 'Próximo'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'center', padding: spacing.lg },
  card: { borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  closeButton: { position: 'absolute', right: spacing.sm, top: spacing.sm, padding: 4 },
  iconWrap: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  target: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: spacing.xs },
  title: { fontSize: typography.body + 2, fontWeight: '800', textAlign: 'center', marginBottom: spacing.sm },
  description: { fontSize: typography.label, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.md },
  dot: { width: 7, height: 7, borderRadius: 4 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  secondaryButton: { flex: 1, borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  primaryButton: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
  secondaryText: { fontWeight: '700' },
  primaryText: { color: '#fff', fontWeight: '800' },
});
