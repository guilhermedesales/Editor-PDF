// Modal de configurações de leitura: escolha explícita do tema de cor
// (em vez do antigo botão de "ciclar" aleatoriamente) e controle de
// brilho, ambos persistidos.

import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { X, Sun } from 'lucide-react-native';
import { spacing, radius, typography } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import type { ReadingTheme } from '../services/pdfReadingProgress';

const THEME_OPTIONS: { key: ReadingTheme; label: string; swatch: string; textSwatch: string }[] = [
  { key: 'claro', label: 'Claro', swatch: '#FFFFFF', textSwatch: '#111111' },
  { key: 'sepia', label: 'Sépia', swatch: '#F4E8C1', textSwatch: '#4A3B22' },
  { key: 'escuro', label: 'Escuro', swatch: '#1A1A1A', textSwatch: '#F2F2F2' },
];

interface Props {
  visible: boolean;
  theme: ReadingTheme;
  brightness: number; // 0.3 a 1
  onChangeTheme: (theme: ReadingTheme) => void;
  onChangeBrightness: (value: number) => void;
  onClose: () => void;
}

export default function ReadingSettingsModal({ visible, theme, brightness, onChangeTheme, onChangeBrightness, onClose }: Props) {
  const { colors } = useThemeStore();

  // Import local pra evitar ciclo de dependência no topo do arquivo
  const SliderBar = require('./SliderBar').default;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.white }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.neutral }]}>Configurações de Leitura</Text>
            <Pressable onPress={onClose} hitSlop={8} style={[styles.closeButton, { backgroundColor: colors.tertiary }]}>
              <X size={18} color={colors.secondary} />
            </Pressable>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.secondary }]}>COR DA PÁGINA</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = theme === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  style={[styles.themeOption, { borderColor: active ? colors.primary : colors.border }]}
                  onPress={() => onChangeTheme(opt.key)}
                >
                  <View style={[styles.themeSwatch, { backgroundColor: opt.swatch }]}>
                    <Text style={[styles.themeSwatchText, { color: opt.textSwatch }]}>Aa</Text>
                  </View>
                  <Text style={[styles.themeLabel, { color: active ? colors.primary : colors.neutral }]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.secondary, marginTop: spacing.lg }]}>BRILHO</Text>
          <View style={styles.brightnessRow}>
            <Sun size={16} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <SliderBar
                value={(brightness - 0.3) / 0.7}
                onChange={(v: number) => onChangeBrightness(0.3 + v * 0.7)}
                trackColor={colors.border}
                fillColor={colors.primary}
                thumbColor={colors.primary}
              />
            </View>
            <Sun size={22} color={colors.secondary} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.md, paddingBottom: spacing.lg },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { fontSize: 18, fontWeight: '700' },
  closeButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: spacing.sm },
  themeRow: { flexDirection: 'row', gap: spacing.sm },
  themeOption: { flex: 1, alignItems: 'center', gap: spacing.xs, borderWidth: 1.5, borderRadius: radius.md, padding: spacing.sm },
  themeSwatch: { width: '100%', height: 48, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.1)' },
  themeSwatchText: { fontWeight: '700' },
  themeLabel: { fontSize: typography.label, fontWeight: '700' },
  brightnessRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});