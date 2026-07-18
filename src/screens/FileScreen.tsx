// Aba "Arquivos": gerenciador dos PDFs conhecidos pelo app (gerados
// pelas ferramentas ou importados manualmente via "+"). Tocar num
// arquivo abre o visualizador; o ⋮ dá acesso a compartilhar, renomear,
// excluir e "usar em" outra ferramenta (Juntar/Dividir).

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import {
  Folder, Search, Plus, MoreVertical, FileText, List, Grid2x2, Star, X,
  Share2, Pencil, Trash2, Combine, Scissors,
} from 'lucide-react-native';
import { useThemeStore } from '../store/useThemeStore';
import { spacing, radius, typography } from '../constants/theme';
import {
  getAllPdfFiles, toggleFavoritePdf, renamePdfFile, deletePdfFile, type PdfFileEntry,
} from '../services/pdfFilesStorage';
import { pickAndImportPdf } from '../services/pdfFileIO';

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

export default function FileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [files, setFiles] = useState<PdfFileEntry[]>([]);
  const [tab, setTab] = useState<FilterTab>('todos');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [menuFor, setMenuFor] = useState<PdfFileEntry | null>(null);
  const [renaming, setRenaming] = useState<PdfFileEntry | null>(null);
  const [renameText, setRenameText] = useState('');

  useFocusEffect(
    useCallback(() => {
      getAllPdfFiles().then(setFiles);
    }, [])
  );

  async function refresh() {
    setFiles(await getAllPdfFiles());
  }

  async function handleAddFile() {
    const imported = await pickAndImportPdf();
    if (imported) refresh();
  }

  async function handleToggleFavorite(id: string) {
    setFiles(await toggleFavoritePdf(id));
  }

  function openViewer(item: PdfFileEntry) {
    navigation.navigate('PdfViewer', { uri: item.uri, name: item.name });
  }

  async function handleShare(item: PdfFileEntry) {
    setMenuFor(null);
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) await Sharing.shareAsync(item.uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar PDF' });
  }

  function handleStartRename(item: PdfFileEntry) {
    setRenaming(item);
    setRenameText(item.name);
    setMenuFor(null);
  }

  async function handleConfirmRename() {
    if (renaming && renameText.trim()) {
      await renamePdfFile(renaming.id, renameText.trim());
      await refresh();
    }
    setRenaming(null);
  }

  function handleDelete(item: PdfFileEntry) {
    setMenuFor(null);
    Alert.alert('Excluir arquivo', `Tem certeza que deseja excluir "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await deletePdfFile(item.id); refresh(); } },
    ]);
  }

  function handleUseIn(destination: 'MergePdf' | 'SplitPdf') {
    setMenuFor(null);
    navigation.navigate(destination);
  }

  const filtered = files
    .filter((f) => {
      if (tab === 'favoritos' && !f.favorite) return false;
      if (tab === 'recentes' && Date.now() - f.updatedAt >= 7 * 86400000) return false;
      if (query.trim() && !f.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.headerIconWrap, { backgroundColor: colors.primary }]}>
          <Folder size={18} color={colors.white} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Arquivos</Text>
        <Pressable hitSlop={8} onPress={() => setShowSearch((v) => !v)}>
          <Search size={20} color={colors.secondary} />
        </Pressable>
      </View>

      {showSearch && (
        <View style={[styles.searchBox, { backgroundColor: colors.tertiary }]}>
          <Search size={16} color={colors.secondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.neutral }]}
            placeholder="Buscar arquivos..."
            placeholderTextColor={colors.secondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <X size={16} color={colors.secondary} />
            </Pressable>
          )}
        </View>
      )}

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
              style={[
                styles.tabPill,
                { backgroundColor: colors.tertiary },
                tab === key && { backgroundColor: colors.primaryLight },
              ]}
              onPress={() => setTab(key)}
            >
              <Text style={[styles.tabPillText, { color: tab === key ? colors.primary : colors.secondary }]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.viewToggle, { backgroundColor: colors.tertiary }]}>
          <Pressable
            style={[styles.viewToggleButton, viewMode === 'list' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('list')}
          >
            <List size={16} color={viewMode === 'list' ? colors.white : colors.secondary} />
          </Pressable>
          <Pressable
            style={[styles.viewToggleButton, viewMode === 'grid' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('grid')}
          >
            <Grid2x2 size={16} color={viewMode === 'grid' ? colors.white : colors.secondary} />
          </Pressable>
        </View>
      </View>

      <FlatList
        key={viewMode}
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? { gap: spacing.sm } : undefined}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100, gap: spacing.sm }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.tertiary }]}>
              <FileText size={28} color={colors.secondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.neutral }]}>
              {tab === 'favoritos' ? 'Nenhum favorito ainda' : 'Nenhum arquivo por aqui'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.secondary }]}>
              {tab === 'favoritos'
                ? 'Toque na estrela de um arquivo pra fixá-lo aqui.'
                : 'Toque em "+" pra importar um PDF, ou gere um pelas Ferramentas.'}
            </Text>
          </View>
        }
        renderItem={({ item }) =>
          viewMode === 'list' ? (
            <FileRowCard
              item={item}
              colors={colors}
              onOpen={() => openViewer(item)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
              onMenu={() => setMenuFor(item)}
            />
          ) : (
            <FileGridCard
              item={item}
              colors={colors}
              onOpen={() => openViewer(item)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
            />
          )
        }
      />

      <Pressable style={[styles.fab, { backgroundColor: colors.primary }]} onPress={handleAddFile}>
        <Plus size={24} color={colors.white} />
      </Pressable>

      <Modal visible={!!menuFor} transparent animationType="fade" onRequestClose={() => setMenuFor(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMenuFor(null)}>
          <View style={[styles.actionSheet, { backgroundColor: colors.white }]}>
            <Text style={[styles.actionSheetTitle, { color: colors.neutral }]} numberOfLines={1}>{menuFor?.name}</Text>
            <ActionRow icon={Share2} label="Compartilhar" onPress={() => menuFor && handleShare(menuFor)} colors={colors} />
            <ActionRow icon={Pencil} label="Renomear" onPress={() => menuFor && handleStartRename(menuFor)} colors={colors} />
            <ActionRow icon={Combine} label="Usar em Juntar PDFs" onPress={() => handleUseIn('MergePdf')} colors={colors} />
            <ActionRow icon={Scissors} label="Usar em Dividir PDF" onPress={() => handleUseIn('SplitPdf')} colors={colors} />
            <ActionRow icon={Trash2} label="Excluir" danger onPress={() => menuFor && handleDelete(menuFor)} colors={colors} />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={!!renaming} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.renameCard, { backgroundColor: colors.white }]}>
            <Text style={[styles.actionSheetTitle, { color: colors.neutral }]}>Renomear arquivo</Text>
            <TextInput
              autoFocus
              style={[styles.renameInput, { borderColor: colors.border, color: colors.neutral }]}
              value={renameText}
              onChangeText={setRenameText}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <Pressable style={[styles.renameButton, { backgroundColor: colors.tertiary }]} onPress={() => setRenaming(null)}>
                <Text style={{ color: colors.secondary, fontWeight: '700' }}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.renameButton, { backgroundColor: colors.primary }]} onPress={handleConfirmRename}>
                <Text style={{ color: colors.white, fontWeight: '700' }}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ActionRow({ icon: Icon, label, onPress, danger, colors }: any) {
  return (
    <Pressable style={styles.actionRow} onPress={onPress}>
      <Icon size={18} color={danger ? colors.danger : colors.neutral} />
      <Text style={[styles.actionRowText, { color: danger ? colors.danger : colors.neutral }]}>{label}</Text>
    </Pressable>
  );
}

function FileRowCard({ item, colors, onOpen, onToggleFavorite, onMenu }: any) {
  return (
    <Pressable style={[styles.rowCard, { backgroundColor: colors.tertiary }]} onPress={onOpen}>
      <View style={[styles.rowThumb, { backgroundColor: colors.primaryLight }]}>
        <FileText size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: colors.neutral }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.rowMeta, { color: colors.secondary }]}>
          {item.pages ? `${item.pages} páginas • ` : ''}{formatSize(item.size)} • {formatDate(item.updatedAt)}
        </Text>
      </View>
      <Pressable hitSlop={8} onPress={onToggleFavorite} style={{ marginRight: spacing.xs }}>
        <Star size={18} color={item.favorite ? '#D97706' : colors.secondary} fill={item.favorite ? '#D97706' : 'none'} />
      </Pressable>
      <Pressable hitSlop={8} onPress={onMenu}>
        <MoreVertical size={18} color={colors.secondary} />
      </Pressable>
    </Pressable>
  );
}

function FileGridCard({ item, colors, onOpen, onToggleFavorite }: any) {
  return (
    <Pressable style={[styles.gridCard, { backgroundColor: colors.tertiary }]} onPress={onOpen}>
      <View style={[styles.gridThumb, { backgroundColor: colors.primaryLight }]}>
        {item.thumbnailUri ? (
          <Image source={{ uri: item.thumbnailUri }} style={styles.gridThumbImage} resizeMode="cover" />
        ) : (
          <FileText size={28} color={colors.primary} />
        )}
        <Pressable hitSlop={8} onPress={onToggleFavorite} style={styles.gridFavButton}>
          <Star size={14} color={item.favorite ? '#D97706' : '#fff'} fill={item.favorite ? '#D97706' : 'none'} />
        </Pressable>
      </View>
      <Text style={[styles.gridTitle, { color: colors.neutral }]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.gridMeta, { color: colors.secondary }]}>{formatSize(item.size)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  headerIconWrap: { width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: typography.body },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, marginBottom: spacing.md },
  tabsWrap: { flexDirection: 'row', gap: spacing.xs },
  tabPill: { paddingVertical: 6, paddingHorizontal: spacing.sm, borderRadius: radius.full },
  tabPillText: { fontSize: typography.label, fontWeight: '600' },
  viewToggle: { flexDirection: 'row', borderRadius: radius.sm, padding: 2, gap: 2 },
  viewToggleButton: { width: 28, height: 28, borderRadius: radius.sm - 2, alignItems: 'center', justifyContent: 'center' },
  emptyState: { paddingVertical: spacing.xl * 1.5, alignItems: 'center', paddingHorizontal: spacing.lg },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.body, fontWeight: '700', marginBottom: spacing.xs },
  emptyText: { textAlign: 'center', fontSize: typography.label },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, padding: spacing.sm },
  rowThumb: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: typography.label, fontWeight: '700' },
  rowMeta: { fontSize: 11, marginTop: 2 },
  gridCard: { flex: 1, borderRadius: radius.md, padding: spacing.xs, marginBottom: spacing.sm },
  gridThumb: { width: '100%', aspectRatio: 0.8, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: spacing.xs },
  gridThumbImage: { width: '100%', height: '100%' },
  gridFavButton: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  gridTitle: { fontSize: 12, fontWeight: '700', paddingHorizontal: 2 },
  gridMeta: { fontSize: 11, paddingHorizontal: 2 },
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  actionSheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.md, paddingBottom: spacing.lg },
  actionSheetTitle: { fontSize: typography.body, fontWeight: '700', marginBottom: spacing.md },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  actionRowText: { fontSize: typography.body, fontWeight: '600' },
  renameCard: { margin: spacing.lg, borderRadius: radius.lg, padding: spacing.md },
  renameInput: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.xs },
  renameButton: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' },
});