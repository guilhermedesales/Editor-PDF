// Tela genérica "em construção", usada pelas abas que ainda não têm
// funcionalidade própria (Arquivos, Ferramentas, Configurações).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Construction } from 'lucide-react-native';
import { colors, spacing, typography } from '../constants/theme';

export default function PlaceholderScreen({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Construction size={40} color={colors.secondary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Essa área está em construção.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, gap: spacing.sm },
  title: { fontSize: typography.body, fontWeight: '700', color: colors.neutral },
  subtitle: { fontSize: typography.label, color: colors.secondary },
});