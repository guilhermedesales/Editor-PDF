// Aba "Arquivos": lista de PDFs no dispositivo (ou gerados pelo app),
// com filtro por Todos/Recentes/Favoritos e alternância lista/grade.
// Por enquanto lê apenas templates preenchidos e PDFs gerados salvos
// localmente — importação de arquivos externos do sistema fica pra
// uma etapa futura (por isso o botão "+" ainda abre o seletor do
// DocumentPicker direto, sem passar por um "Modo Arquivos" completo).

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import {
  Folder, Search, Plus, MoreVertical, FileText, List, Grid2x2, Star,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../constants/theme';
import { getAllPdfFiles, toggleFavoritePdf, type PdfFileEntry } from '../services/pdfFilesStorage';

type FilterTab = 'todos' | 'recentes' | 'favoritos';
type ViewMode = 'list' | 'grid';

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function FilesScreen() {
  const insets = useSafeAreaInsets();
  const [files, setFiles] = useState<PdfFileEntry[]>([]);
  const [tab, setTab] = useState<FilterTab>('todos');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useFocusEffect(
    useCallback(() => {
      getAllPdfFiles().then((list) => setFiles(list));
    }, [])
  );

  async function handleAddFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (result.canceled) return;
    // TODO: copiar o arquivo escolhido pra pasta gerenciada pelo app e
    // registrar em pdfFilesStorage — a lib de cópia/registro ainda não
    // existe, então por hora só evita crash silencioso.
  }

  async function handleToggleFavorite(id: string) {
    const updated = await toggleFavoritePdf(id);
    setFiles(updated);
  }

  const filtered = files
    .filter((f) => {
      if (tab === 'favoritos') return f.favorite;
      if (tab === 'recentes') return Date.now() - f.updatedAt < 7 * 86400000;
      return true;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Folder size={18} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>Arquivos</Text>
        <Pressable hitSlop={8} style={{ marginRight: spacing.sm }}>
          <Search size={20} color={colors.secondary} />
        </Pressable>
        <Pressable hitSlop={8}>
          <MoreVertical size={20} color={colors.secondary} />
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.tabsWrap}>
          {(
            [
              { key: 'todos' as FilterTab, label: 'Todos' },
              { key: 'recentes' as FilterTab, label: 'Recentes' },
              { key: 'favoritos' as FilterTab, label: 'Favoritos' },
            ]
          ).map(({ key, label }) => (
            <Pressable
              key={key}
              style={[styles.tabPill, tab === key && styles.tabPillActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[styles.tabPillText, tab === key && styles.tabPillTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.viewToggle}>
          <Pressable
            style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <List size={16} color={viewMode === 'list' ? colors.white : colors.secondary} />
          </Pressable>
          <Pressable
            style={[styles.viewToggleButton, viewMode === 'grid' && styles.viewToggleButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <Grid2x2 size={16} color={viewMode === 'grid' ? colors.white : colors.secondary} />
          </Pressable>
        </View>
      </View>

      <FlatList
        key={viewMode} // força remount ao trocar numColumns
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? { gap: spacing.sm } : undefined}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100, gap: spacing.sm }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}><FileText size={28} color={colors.secondary} /></View>
            <Text style={styles.emptyTitle}>
              {tab === 'favoritos' ? 'Nenhum favorito ainda' : 'Nenhum arquivo por aqui'}
            </Text>
            <Text style={styles.emptyText}>
              {tab === 'favoritos'
                ? 'Toque na estrela de um arquivo pra fixá-lo aqui.'
                : 'Os PDFs gerados pelos seus templates aparecem nesta lista.'}
            </Text>
          </View>
        }
        renderItem={({ item }) =>
          viewMode === 'list' ? (
            <FileRowCard item={item} onToggleFavorite={() => handleToggleFavorite(item.id)} />
          ) : (
            <FileGridCard item={item} onToggleFavorite={() => handleToggleFavorite(item.id)} />
          )
        }
      />

      <Pressable style={styles.fab} onPress={handleAddFile}>
        <Plus size={24} color={colors.white} />
      </Pressable>
    </View>
  );
}

function FileRowCard({ item, onToggleFavorite }: { item: PdfFileEntry; onToggleFavorite: () => void }) {
  return (
    <Pressable style={styles.rowCard}>
      <View style={styles.rowThumb}>
        <FileText size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.rowMeta}>
          {item.pages ? `${item.pages} páginas • ` : ''}{formatSize(item.size)} • {formatDate(item.updatedAt)}
        </Text>
      </View>
      <Pressable hitSlop={8} onPress={onToggleFavorite} style={{ marginRight: spacing.xs }}>
        <Star size={18} color={item.favorite ? '#D97706' : colors.secondary} fill={item.favorite ? '#D97706' : 'none'} />
      </Pressable>
      <MoreVertical size={18} color={colors.secondary} />
    </Pressable>
  );
}

function FileGridCard({ item, onToggleFavorite }: { item: PdfFileEntry; onToggleFavorite: () => void }) {
  return (
    <Pressable style={styles.gridCard}>
      <View style={styles.gridThumb}>
        {item.thumbnailUri ? (
          <Image source={{ uri: item.thumbnailUri }} style={styles.gridThumbImage} resizeMode="cover" />
        ) : (
          <FileText size={28} color={colors.primary} />
        )}
        <Pressable hitSlop={8} onPress={onToggleFavorite} style={styles.gridFavButton}>
          <Star size={14} color={item.favorite ? '#D97706' : colors.white} fill={item.favorite ? '#D97706' : 'none'} />
        </Pressable>
      </View>
      <Text style={styles.gridTitle} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.gridMeta}>{formatSize(item.size)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  headerIconWrap: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.primary },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, marginBottom: spacing.md },
  tabsWrap: { flexDirection: 'row', gap: spacing.xs },
  tabPill: { paddingVertical: 6, paddingHorizontal: spacing.sm, borderRadius: radius.full, backgroundColor: colors.tertiary },
  tabPillActive: { backgroundColor: colors.primaryLight },
  tabPillText: { fontSize: typography.label, fontWeight: '600', color: colors.secondary },
  tabPillTextActive: { color: colors.primary },
  viewToggle: { flexDirection: 'row', backgroundColor: colors.tertiary, borderRadius: radius.sm, padding: 2, gap: 2 },
  viewToggleButton: { width: 28, height: 28, borderRadius: radius.sm - 2, alignItems: 'center', justifyContent: 'center' },
  viewToggleButtonActive: { backgroundColor: colors.primary },
  emptyState: { paddingVertical: spacing.xl * 1.5, alignItems: 'center', paddingHorizontal: spacing.lg },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.tertiary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.body, fontWeight: '700', color: colors.neutral, marginBottom: spacing.xs },
  emptyText: { color: colors.secondary, textAlign: 'center', fontSize: typography.label },
  rowCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.tertiary, borderRadius: radius.md, padding: spacing.sm,
  },
  rowThumb: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: typography.label, fontWeight: '700', color: colors.neutral },
  rowMeta: { fontSize: 11, color: colors.secondary, marginTop: 2 },
  gridCard: { flex: 1, backgroundColor: colors.tertiary, borderRadius: radius.md, padding: spacing.xs, marginBottom: spacing.sm },
  gridThumb: {
    width: '100%', aspectRatio: 0.8, borderRadius: radius.sm, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: spacing.xs,
  },
  gridThumbImage: { width: '100%', height: '100%' },
  gridFavButton: {
    position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  gridTitle: { fontSize: 12, fontWeight: '700', color: colors.neutral, paddingHorizontal: 2 },
  gridMeta: { fontSize: 11, color: colors.secondary, paddingHorizontal: 2 },
  fab: {
    position: 'absolute', right: spacing.md, bottom: spacing.md,
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6,
  },
});