// Aba "Configurações": preferências do app + informações. Tema, Idioma
// e Backup ainda não têm implementação real — os itens ficam visíveis
// (pra já comunicar o roadmap) mas desabilitados com a tag "Indisponível".

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Settings, MoreVertical, Palette, Globe, CloudUpload, Info, Star, Tag, ChevronRight, Compass,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../constants/theme';

const APP_VERSION = '1.0.0';

interface SettingsRow {
  icon: any;
  label: string;
  sublabel: string;
  available: boolean;
  external?: boolean;
  onPress?: () => void;
}

function comingSoon(feature: string) {
  Alert.alert(feature, 'Indisponível em breve.');
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  const preferenceRows: SettingsRow[] = [
    { icon: Palette, label: 'Tema', sublabel: 'Indisponível em breve', available: false, onPress: () => comingSoon('Tema') },
    { icon: Globe, label: 'Idioma', sublabel: 'Português (Brasil)', available: true, onPress: () => comingSoon('Idioma') },
    { icon: CloudUpload, label: 'Backup', sublabel: 'Indisponível em breve', available: false, onPress: () => comingSoon('Backup') },
  ];

  const infoRows: SettingsRow[] = [
    {
      icon: Info, label: 'Sobre o PDF Studio', sublabel: '', available: true, external: true,
      onPress: () => Linking.openURL('https://example.com/sobre'),
    },
    {
      icon: Star, label: 'Avaliar aplicativo', sublabel: '', available: true, external: true,
      onPress: () => Linking.openURL('https://example.com/avaliar'),
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Configurações</Text>
        <Pressable hitSlop={8}>
          <MoreVertical size={20} color={colors.secondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}>
        <Text style={styles.sectionLabel}>PREFERÊNCIAS</Text>
        <View style={styles.card}>
          {preferenceRows.map((row, i) => (
            <SettingsRowItem key={row.label} row={row} isLast={i === preferenceRows.length - 1} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>INFORMAÇÕES</Text>
        <View style={styles.card}>
          {infoRows.map((row, i) => (
            <SettingsRowItem key={row.label} row={row} isLast={false} />
          ))}
          <View style={[styles.row, styles.rowLast]}>
            <View style={styles.iconWrap}>
              <Tag size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Versão</Text>
            </View>
            <Text style={styles.versionValue}>{APP_VERSION}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Compass size={22} color={colors.secondary} />
          <Text style={styles.footerTitle}>PDF STUDIO</Text>
          <Text style={styles.footerSubtitle}>Transformando dados em documentos impecáveis.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsRowItem({ row, isLast }: { row: SettingsRow; isLast: boolean }) {
  const Icon = row.icon;
  return (
    <Pressable style={[styles.row, isLast && styles.rowLast]} onPress={row.onPress}>
      <View style={styles.iconWrap}>
        <Icon size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{row.label}</Text>
        {!!row.sublabel && (
          <Text style={[styles.rowSublabel, !row.available && styles.rowSublabelDisabled]}>{row.sublabel}</Text>
        )}
      </View>
      <ChevronRight size={18} color={colors.secondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.primary },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.secondary, letterSpacing: 0.5,
    marginTop: spacing.md, marginBottom: spacing.sm,
  },
  card: { backgroundColor: colors.tertiary, borderRadius: radius.md, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontSize: typography.body, fontWeight: '600', color: colors.neutral },
  rowSublabel: { fontSize: 12, color: colors.secondary, marginTop: 1 },
  rowSublabelDisabled: { color: colors.secondary },
  versionValue: { fontSize: typography.label, fontWeight: '700', color: colors.primary },
  footer: { alignItems: 'center', marginTop: spacing.xl, gap: 4 },
  footerTitle: { fontSize: 12, fontWeight: '700', color: colors.secondary, letterSpacing: 1, marginTop: spacing.xs },
  footerSubtitle: { fontSize: 11, color: colors.secondary },
});