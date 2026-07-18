// Aba "Templates": busca + lista de templates salvos, com thumbnail
// real do PDF, badge de contagem de campos e menu de ações por card.

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, Plus, MoreVertical, Search, ChevronRight } from 'lucide-react-native';
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

export default function TemplatesScreen({ navigation }: any) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      getAllTemplates().then((list) => setTemplates([...list].sort((a, b) => b.updatedAt - a.updatedAt)));
    }, [])
  );

  const filtered = query.trim()
    ? templates.filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()))
    : templates;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <FileText size={18} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>Templates</Text>
      </View>

      <View style={styles.searchBox}>
        <Search size={18} color={colors.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar templates..."
          placeholderTextColor={colors.secondary}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
        ListHeaderComponent={
          <>
            <Pressable style={styles.newButton} onPress={() => navigation.navigate('TemplateEditor', {})}>
              <Plus size={20} color={colors.white} />
              <Text style={styles.newButtonText}>Novo Template</Text>
            </Pressable>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Meus Templates</Text>
              {filtered.length > 0 && <Text style={styles.sectionCount}>{filtered.length}</Text>}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <FileText size={28} color={colors.secondary} />
            </View>
            <Text style={styles.emptyTitle}>
              {query ? 'Nenhum resultado' : 'Nenhum template ainda'}
            </Text>
            <Text style={styles.emptyText}>
              {query ? 'Tente buscar por outro nome.' : 'Toque em "Novo Template" para criar o primeiro.'}
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

function TemplateCard({ template, onEdit, onFill }: { template: Template; onEdit: () => void; onFill: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onFill}>
      <View style={styles.thumbWrap}>
        {template.pdfUri ? (
          <Image source={{ uri: template.pdfUri }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <FileText size={24} color={colors.primary} />
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{template.name}</Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardMetaField}>{template.fields.length} campos</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <Text style={styles.cardMetaTime}>{formatRelativeTime(template.updatedAt)}</Text>
        </View>
      </View>

      <Pressable hitSlop={10} style={styles.cardMenu} onPress={onEdit}>
        <MoreVertical size={18} color={colors.secondary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  headerIconWrap: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.primary },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    backgroundColor: colors.tertiary, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: typography.body, color: colors.neutral },
  newButton: {
    flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.primary, paddingVertical: spacing.md,
    borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  newButtonText: { color: colors.white, fontSize: typography.body, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { fontSize: typography.headline * 0.6, fontWeight: '700', color: colors.neutral },
  sectionCount: {
    fontSize: typography.label, color: colors.secondary, backgroundColor: colors.tertiary,
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, overflow: 'hidden',
  },
  emptyState: { paddingVertical: spacing.xl * 1.5, alignItems: 'center' },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.tertiary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.body, fontWeight: '700', color: colors.neutral, marginBottom: spacing.xs },
  emptyText: { color: colors.secondary, textAlign: 'center', fontSize: typography.label },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.tertiary,
    borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm,
  },
  thumbWrap: {
    width: 52, height: 52, borderRadius: radius.sm, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: spacing.sm,
  },
  thumbImage: { width: '100%', height: '100%' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: typography.body, fontWeight: '700', color: colors.neutral },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  cardMetaField: { fontSize: typography.label, color: colors.primary, fontWeight: '600' },
  cardMetaDot: { fontSize: typography.label, color: colors.secondary },
  cardMetaTime: { fontSize: typography.label, color: colors.secondary },
  cardMenu: { padding: 6 },
});