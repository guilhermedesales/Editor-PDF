// Aba "Ferramentas": Assinar/Escanear/Reorganizar foram removidos por
// pedido — as 4 ferramentas restantes (fora Criar Template) agora
// navegam pra telas funcionais de verdade.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wrench, Search, Combine, FileImage, Star, Scissors, FileArchive, FilePlus2, ChevronRight } from 'lucide-react-native';
import { useThemeStore } from '../store/useThemeStore';
import { spacing, radius, typography } from '../constants/theme';

interface ToolItem {
  id: string;
  label: string;
  description: string;
  icon: any;
  route?: string;
  onPress?: (navigation: any) => void;
}

const TOOLS: ToolItem[] = [
  { id: 'merge', label: 'Juntar PDFs', description: 'Mescle vários arquivos em um único documento em segundos.', icon: Combine, route: 'MergePdf' },
  { id: 'convert', label: 'Converter para PDF', description: 'Transforme imagens em um PDF de alta qualidade.', icon: FileImage, route: 'ConvertToPdf' },
  { id: 'template', label: 'Criar Template', description: 'Monte um formulário inteligente sobre um PDF existente.', icon: FilePlus2, onPress: (navigation) => navigation.navigate('TemplateEditor', {}) },
  { id: 'split', label: 'Dividir PDF', description: 'Separe páginas específicas em um novo arquivo.', icon: Scissors, route: 'SplitPdf' },
  { id: 'compress', label: 'Compactar PDF', description: 'Reduza o tamanho do arquivo.', icon: FileArchive, route: 'CompressPdf' },
];

export default function ToolsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [favoriteIds, setFavoriteIds] = useState<string[]>(['merge', 'convert']);

  function toggleFavorite(id: string) {
    setFavoriteIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  function openTool(tool: ToolItem) {
    if (tool.route) navigation.navigate(tool.route);
    else tool.onPress?.(navigation);
  }

  const favoriteTools = TOOLS.filter((t) => favoriteIds.includes(t.id));

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={[styles.headerIconWrap, { backgroundColor: colors.primary }]}><Wrench size={18} color={colors.white} /></View>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Ferramentas</Text>
        <Pressable hitSlop={8}><Search size={20} color={colors.secondary} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}>
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroTitle}>Central de{'\n'}Ferramentas PDF</Text>
          <Text style={styles.heroSubtitle}>
            Manipule, converta e organize seus documentos com precisão profissional. Escolha uma das ferramentas abaixo para começar.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.neutral }]}>Favoritos</Text>
        {favoriteTools.length === 0 ? (
          <Text style={[styles.emptyFavText, { color: colors.secondary }]}>Nenhuma ferramenta fixada ainda.</Text>
        ) : (
          favoriteTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} colors={colors} isFavorite onToggleFavorite={() => toggleFavorite(tool.id)} onPress={() => openTool(tool)} expanded />
          ))
        )}

        <Text style={[styles.sectionLabel, { color: colors.neutral, marginTop: spacing.lg }]}>Todas as Ferramentas</Text>
        {TOOLS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} colors={colors} isFavorite={favoriteIds.includes(tool.id)} onToggleFavorite={() => toggleFavorite(tool.id)} onPress={() => openTool(tool)} />
        ))}
      </ScrollView>
    </View>
  );
}

function ToolCard({ tool, colors, isFavorite, onToggleFavorite, onPress, expanded }: any) {
  const Icon = tool.icon;
  return (
    <Pressable style={[styles.toolCard, { backgroundColor: colors.tertiary }, expanded && styles.toolCardExpanded]} onPress={onPress}>
      <View style={[styles.toolIconWrap, { backgroundColor: colors.primaryLight }]}>
        <Icon size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.toolLabel, { color: colors.neutral }]}>{tool.label}</Text>
        {expanded && <Text style={[styles.toolDescription, { color: colors.secondary }]}>{tool.description}</Text>}
      </View>
      {expanded ? (
        <Pressable hitSlop={8} onPress={onToggleFavorite}>
          <Star size={18} color={isFavorite ? '#D97706' : colors.secondary} fill={isFavorite ? '#D97706' : 'none'} />
        </Pressable>
      ) : (
        <ChevronRight size={18} color={colors.secondary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  headerIconWrap: { width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700' },
  heroCard: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg },
  heroTitle: { color: '#fff', fontSize: typography.headline * 0.65, fontWeight: '700', marginBottom: spacing.sm, lineHeight: 26 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: typography.label, lineHeight: 19 },
  sectionLabel: { fontSize: typography.body, fontWeight: '700', marginBottom: spacing.sm },
  emptyFavText: { fontSize: typography.label, marginBottom: spacing.sm },
  toolCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
  toolCardExpanded: { padding: spacing.md },
  toolIconWrap: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { fontSize: typography.body, fontWeight: '700' },
  toolDescription: { fontSize: typography.label, marginTop: 2, lineHeight: 18 },
});