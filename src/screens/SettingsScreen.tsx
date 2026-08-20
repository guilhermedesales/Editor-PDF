import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sun, Moon, Tag, GraduationCap, ChevronRight, Compass } from 'lucide-react-native';
import { useThemeStore } from '../store/useThemeStore';
import { spacing, radius, typography } from '../constants/theme';
import { TOOL_TUTORIALS, type ToolTutorial } from '../constants/tutorials';
import TutorialModal from '../components/TutorialModal';

const APP_VERSION = '1.1.0';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { mode, colors, setMode } = useThemeStore();
  const [activeTutorial, setActiveTutorial] = useState<ToolTutorial | null>(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}>
        <Text style={[styles.sectionLabel, { color: colors.secondary }]}>APARÊNCIA</Text>
        <View style={[styles.card, { backgroundColor: colors.tertiary }]}>
          <View style={styles.themeRow}>
            <Pressable
              style={[styles.themeOption, { borderColor: colors.border }, mode === 'light' && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
              onPress={() => setMode('light')}
            >
              <Sun size={20} color={mode === 'light' ? colors.primary : colors.secondary} />
              <Text style={[styles.themeOptionText, { color: mode === 'light' ? colors.primary : colors.secondary }]}>Claro</Text>
            </Pressable>
            <Pressable
              style={[styles.themeOption, { borderColor: colors.border }, mode === 'dark' && { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
              onPress={() => setMode('dark')}
            >
              <Moon size={20} color={mode === 'dark' ? colors.primary : colors.secondary} />
              <Text style={[styles.themeOptionText, { color: mode === 'dark' ? colors.primary : colors.secondary }]}>Escuro</Text>
            </Pressable>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.secondary, marginTop: spacing.lg }]}>TUTORIAIS</Text>
        <View style={[styles.card, { backgroundColor: colors.tertiary }]}>
          {TOOL_TUTORIALS.map((tutorial, i) => (
            <TutorialRow key={tutorial.id} tutorial={tutorial} colors={colors} isLast={i === TOOL_TUTORIALS.length - 1} onPress={() => setActiveTutorial(tutorial)} />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.secondary, marginTop: spacing.lg }]}>SOBRE</Text>
        <View style={[styles.card, { backgroundColor: colors.tertiary }]}>
          <View style={[styles.row, styles.rowLast]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
              <Tag size={18} color={colors.primary} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.neutral, flex: 1 }]}>Versão</Text>
            <Text style={[styles.versionValue, { color: colors.primary }]}>{APP_VERSION}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Compass size={22} color={colors.secondary} />
          <Text style={[styles.footerTitle, { color: colors.secondary }]}>PDF STUDIO</Text>
          <Text style={[styles.footerSubtitle, { color: colors.secondary }]}>Transformando dados em documentos impecáveis.</Text>
        </View>
      </ScrollView>

      <TutorialModal visible={!!activeTutorial} tutorial={activeTutorial} onClose={() => setActiveTutorial(null)} />
    </View>
  );
}

function TutorialRow({ tutorial, colors, isLast, onPress }: { tutorial: ToolTutorial; colors: any; isLast: boolean; onPress: () => void }) {
  const Icon = tutorial.icon;
  return (
    <Pressable style={[styles.row, isLast && styles.rowLast]} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
        <Icon size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.neutral }]}>{tutorial.label}</Text>
        <Text style={[styles.rowSublabel, { color: colors.secondary }]}>{tutorial.steps.length} passos</Text>
      </View>
      <GraduationCap size={16} color={colors.secondary} style={{ marginRight: spacing.xs }} />
      <ChevronRight size={18} color={colors.secondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: spacing.sm },
  card: { borderRadius: radius.md, overflow: 'hidden' },
  themeRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.sm },
  themeOption: { flex: 1, alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: radius.md, paddingVertical: spacing.md },
  themeOptionText: { fontWeight: '700', fontSize: typography.label },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: typography.body, fontWeight: '600' },
  rowSublabel: { fontSize: 12, marginTop: 1 },
  versionValue: { fontSize: typography.label, fontWeight: '700' },
  footer: { alignItems: 'center', marginTop: spacing.xl, gap: 4 },
  footerTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: spacing.xs },
  footerSubtitle: { fontSize: 11 },
});