// Tela inicial: lista os templates salvos, cada um com ações de
// Editar/Preencher, e um botão pra criar um novo template do zero.
// Layout inspirado no mockup: header com ícone, botão de destaque,
// seção "Meus Templates" com cards de ícone + metadados relativos.

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, Plus, MoreVertical, Settings } from 'lucide-react-native';
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
  const months = Math.floor(days / 30);
  return `há ${months}m`;
}

export default function HomeScreen({ navigation }: any) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      getAllTemplates().then((list) =>
        setTemplates([...list].sort((a, b) => b.updatedAt - a.updatedAt))
      );
    }, [])
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <FileText size={20} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>PDF Architect</Text>
        <Pressable hitSlop={8}>
          <Settings size={20} color={colors.secondary} />
        </Pressable>
      </View>

      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
        ListHeaderComponent={
          <>
            <Pressable
              style={styles.newButton}
              onPress={() => navigation.navigate('TemplateEditor', {})}
            >
              <Plus size={20} color={colors.white} />
              <Text style={styles.newButtonText}>Novo Template</Text>
            </Pressable>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Meus Templates</Text>
              {templates.length > 0 && (
                <Text style={styles.sectionCount}>{templates.length}</Text>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <FileText size={28} color={colors.secondary} />
            </View>
            <Text style={styles.emptyTitle}>Nenhum template ainda</Text>
            <Text style={styles.emptyText}>
              Toque em "Novo Template" para criar o primeiro.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TemplateCard
            template={item}
            onEdit={() => navigation.navigate('TemplateEditor', { templateId: item.id })}
            onFill={() => navigation.navigate('TemplateFill', { templateId: item.id })}
          />
        )}
      />
    </View>
  );
}

function TemplateCard({
  template,
  onEdit,
  onFill,
}: {
  template: Template;
  onEdit: () => void;
  onFill: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onFill}>
      <View style={styles.cardThumb}>
        <FileText size={22} color={colors.primary} />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {template.name}
        </Text>
        <Text style={styles.cardMeta}>
          {template.fields.length} campos · Editado {formatRelativeTime(template.updatedAt)}
        </Text>

        <View style={styles.cardActions}>
          <Pressable style={styles.actionButton} onPress={onEdit}>
            <Text style={styles.actionText}>Editar</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.actionButtonPrimary]} onPress={onFill}>
            <Text style={[styles.actionText, styles.actionTextPrimary]}>Preencher</Text>
          </Pressable>
        </View>
      </View>

      <Pressable hitSlop={8} style={styles.cardMenu}>
        <MoreVertical size={18} color={colors.secondary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  newButton: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  newButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.headline * 0.6,
    fontWeight: '700',
    color: colors.neutral,
  },
  sectionCount: {
    fontSize: typography.label,
    color: colors.secondary,
    backgroundColor: colors.tertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  emptyState: {
    paddingVertical: spacing.xl * 1.5,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.neutral,
    marginBottom: spacing.xs,
  },
  emptyText: {
    color: colors.secondary,
    textAlign: 'center',
    fontSize: typography.label,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.tertiary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  cardThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  cardBody: { flex: 1 },
  cardTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.neutral,
  },
  cardMeta: {
    fontSize: typography.label,
    color: colors.secondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionText: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.neutral,
  },
  actionTextPrimary: { color: colors.white },
  cardMenu: { padding: 4 },
});