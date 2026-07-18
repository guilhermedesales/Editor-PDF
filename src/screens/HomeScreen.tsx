// Tela inicial (dashboard): ações rápidas apontando pras ferramentas
// do app + lista de templates recentes. Baseado no mockup enviado.

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FilePlus2, FileEdit, RefreshCw, Combine, FileText, MoreVertical, Search,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../constants/theme';
import { getAllTemplates } from '../services/templateStorage';
import type { Template } from '../types/template';

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days}d`;
  return `há ${Math.floor(days / 30)}m`;
}

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [templates, setTemplates] = useState<Template[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAllTemplates().then((list) =>
        setTemplates([...list].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4))
      );
    }, [])
  );

  function pickTemplateToFill() {
    if (templates.length === 0) {
      Alert.alert('Nenhum template', 'Crie um template antes de preencher.');
      return;
    }
    navigation.navigate('Templates');
  }

  function comingSoon(feature: string) {
    Alert.alert(feature, 'Em breve nesta versão.');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <FileText size={20} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>PDF Studio</Text>
        <Pressable hitSlop={8}>
          <Search size={20} color={colors.secondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}>
        <Text style={styles.greeting}>Olá 👋</Text>
        <Text style={styles.subGreeting}>O que vamos criar hoje?</Text>

        <Text style={styles.sectionLabel}>AÇÕES RÁPIDAS</Text>
        <View style={styles.grid}>
          <QuickAction
            icon={FilePlus2}
            label="Criar Template"
            onPress={() => navigation.navigate('TemplateEditor', {})}
          />
          <QuickAction icon={FileEdit} label="Preencher Template" onPress={pickTemplateToFill} />
          <QuickAction icon={RefreshCw} label="Converter Arquivo" onPress={() => comingSoon('Converter Arquivo')} />
          <QuickAction icon={Combine} label="Juntar PDFs" onPress={() => comingSoon('Juntar PDFs')} />
        </View>

        <Pressable style={styles.wideAction} onPress={() => comingSoon('Abrir PDF')}>
          <FileText size={22} color={colors.primary} />
          <Text style={styles.wideActionText}>Abrir PDF</Text>
        </Pressable>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>RECENTES</Text>
          <Pressable onPress={() => navigation.navigate('Templates')}>
            <Text style={styles.seeAll}>Ver tudo</Text>
          </Pressable>
        </View>

        {templates.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum template criado ainda.</Text>
        ) : (
          templates.map((t) => (
            <Pressable
              key={t.id}
              style={styles.recentCard}
              onPress={() => navigation.navigate('TemplateFill', { templateId: t.id })}
            >
              <View style={styles.recentThumb}>
                <FileText size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentTitle} numberOfLines={1}>{t.name}</Text>
                <Text style={styles.recentMeta}>Modificado {formatRelativeTime(t.updatedAt)}</Text>
              </View>
              <MoreVertical size={18} color={colors.secondary} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function QuickAction({ icon: Icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickActionIconWrap}>
        <Icon size={22} color={colors.primary} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, gap: spacing.sm,
  },
  headerIconWrap: {
    width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: typography.body, fontWeight: '700', color: colors.primary },
  greeting: { fontSize: typography.headline * 0.7, fontWeight: '700', color: colors.neutral, marginTop: spacing.sm },
  subGreeting: { fontSize: typography.label, color: colors.secondary, marginBottom: spacing.lg },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.secondary, letterSpacing: 0.5,
    marginBottom: spacing.sm, marginTop: spacing.sm,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { fontSize: typography.label, color: colors.primary, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  quickAction: {
    width: '47%', backgroundColor: colors.tertiary, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'flex-start',
  },
  quickActionIconWrap: {
    width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  quickActionLabel: { fontSize: typography.label, fontWeight: '700', color: colors.neutral },
  wideAction: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.tertiary, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.lg,
  },
  wideActionText: { fontSize: typography.body, fontWeight: '700', color: colors.neutral },
  emptyText: { color: colors.secondary, fontSize: typography.label, paddingVertical: spacing.md },
  recentCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.tertiary, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm,
  },
  recentThumb: {
    width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  recentTitle: { fontSize: typography.label, fontWeight: '700', color: colors.neutral },
  recentMeta: { fontSize: 11, color: colors.secondary, marginTop: 2 },
});