import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, Plus, Pencil, Search } from 'lucide-react-native';
import { spacing, radius, typography } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
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
  const { colors } = useThemeStore();

  useFocusEffect(
    useCallback(() => {
      getAllTemplates().then((list) => setTemplates([...list].sort((a, b) => b.updatedAt - a.updatedAt)));
    }, [])
  );

  const filtered = query.trim()
    ? templates.filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()))
    : templates;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.headerIconWrap, { backgroundColor: colors.primary }]}><FileText size={18} color={colors.white} /></View>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Templates</Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.tertiary }]}>
        <Search size={18} color={colors.secondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.neutral }]}
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
            <Pressable style={[styles.newButton, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('TemplateEditor', {})}>
              <Plus size={20} color={colors.white} />
              <Text style={[styles.newButtonText, { color: colors.white }]}>Novo Template</Text>
            </Pressable>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.neutral }]}>Meus Templates</Text>
              {filtered.length > 0 && <Text style={[styles.sectionCount, { color: colors.secondary, backgroundColor: colors.tertiary }]}>{filtered.length}</Text>}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.tertiary }]}><FileText size={28} color={colors.secondary} /></View>
            <Text style={[styles.emptyTitle, { color: colors.neutral }]}>{query ? 'Nenhum resultado' : 'Nenhum template ainda'}</Text>
            <Text style={[styles.emptyText, { color: colors.secondary }]}>{query ? 'Tente buscar por outro nome.' : 'Toque em "Novo Template" para criar o primeiro.'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TemplateCard
            template={item}
            colors={colors}
            onEdit={() => navigation.navigate('TemplateEditor', { templateId: item.id })}
            onFill={() => navigation.navigate('TemplateFill', { templateId: item.id })}
          />
        )}
      />
    </View>
  );
}

function TemplateCard({ template, colors, onEdit, onFill }: { template: Template; colors: any; onEdit: () => void; onFill: () => void }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.tertiary }]}>
      <Pressable style={styles.cardMain} onPress={onFill}>
        <View style={[styles.thumbWrap, { backgroundColor: colors.primaryLight }]}>
          {template.pdfUri ? (
            <Image source={{ uri: template.pdfUri }} style={styles.thumbImage} resizeMode="cover" />
          ) : (
            <FileText size={24} color={colors.primary} />
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.neutral }]} numberOfLines={1}>{template.name}</Text>
          <View style={styles.cardMetaRow}>
            <Text style={[styles.cardMetaField, { color: colors.primary }]}>{template.fields.length} campos</Text>
            <Text style={[styles.cardMetaDot, { color: colors.secondary }]}>·</Text>
            <Text style={[styles.cardMetaTime, { color: colors.secondary }]}>{formatRelativeTime(template.updatedAt)}</Text>
          </View>
        </View>
      </Pressable>

      <Pressable style={[styles.editZone, { backgroundColor: colors.primaryLight, borderLeftColor: colors.border }]} onPress={onEdit}>
        <Pencil size={16} color={colors.primary} />
        <Text style={[styles.editZoneText, { color: colors.primary }]}>Editar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  headerIconWrap: { width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginHorizontal: spacing.md, marginBottom: spacing.md, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: typography.body },
  newButton: { flexDirection: 'row', gap: spacing.xs, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  newButtonText: { fontSize: typography.body, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { fontSize: typography.headline * 0.6, fontWeight: '700' },
  sectionCount: { fontSize: typography.label, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, overflow: 'hidden' },
  emptyState: { paddingVertical: spacing.xl * 1.5, alignItems: 'center' },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.body, fontWeight: '700', marginBottom: spacing.xs },
  emptyText: { textAlign: 'center', fontSize: typography.label },
  card: { flexDirection: 'row', borderRadius: radius.md, marginBottom: spacing.sm, overflow: 'hidden' },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: spacing.sm },
  thumbWrap: { width: 52, height: 52, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: spacing.sm },
  thumbImage: { width: '100%', height: '100%' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: typography.body, fontWeight: '700' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  cardMetaField: { fontSize: typography.label, fontWeight: '600' },
  cardMetaDot: { fontSize: typography.label },
  cardMetaTime: { fontSize: typography.label },
  editZone: { width: 64, alignItems: 'center', justifyContent: 'center', gap: 4, borderLeftWidth: 1 },
  editZoneText: { fontSize: 11, fontWeight: '700' },
});