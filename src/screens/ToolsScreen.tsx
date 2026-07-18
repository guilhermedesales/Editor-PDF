// Aba "Ferramentas": central de utilidades pra manipulação de PDF.
// Card de destaque no topo + seção "Favoritos" (fixados pelo usuário)
// + grade "Todas as Ferramentas". A maioria ainda é "em breve" — só
// Juntar PDFs e Criar Template já têm tela funcional.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Wrench, Search, Combine, FileImage, Star, Scissors, ArrowDownWideNarrow,
  FileArchive, ScanLine, PenLine, FilePlus2, ChevronRight,
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../constants/theme';

interface ToolItem {
  id: string;
  label: string;
  description: string;
  icon: any;
  available: boolean;
  onPress: (navigation: any) => void;
}

const TOOLS: ToolItem[] = [
  {
    id: 'merge', label: 'Juntar PDFs', description: 'Mescle vários arquivos em um único documento em segundos.',
    icon: Combine, available: false, onPress: () => comingSoon('Juntar PDFs'),
  },
  {
    id: 'convert', label: 'Converter para PDF', description: 'Transforme documentos Office, Word, Excel e PPT em PDF de alta qualidade.',
    icon: FileImage, available: false, onPress: () => comingSoon('Converter para PDF'),
  },
  {
    id: 'template', label: 'Criar Template', description: 'Monte um formulário inteligente sobre um PDF existente.',
    icon: FilePlus2, available: true, onPress: (navigation) => navigation.navigate('TemplateEditor', {}),
  },
  {
    id: 'split', label: 'Dividir PDF', description: 'Separe páginas específicas em arquivos individuais.',
    icon: Scissors, available: false, onPress: () => comingSoon('Dividir PDF'),
  },
  {
    id: 'reorder', label: 'Reorganizar Páginas', description: 'Reordene, gire ou remova páginas de um PDF.',
    icon: ArrowDownWideNarrow, available: false, onPress: () => comingSoon('Reorganizar Páginas'),
  },
  {
    id: 'compress', label: 'Compactar PDF', description: 'Reduza o tamanho do arquivo sem perder qualidade.',
    icon: FileArchive, available: false, onPress: () => comingSoon('Compactar PDF'),
  },
  {
    id: 'scan', label: 'Escanear Documento', description: 'Use a câmera para digitalizar papéis em PDF.',
    icon: ScanLine, available: false, onPress: () => comingSoon('Escanear Documento'),
  },
  {
    id: 'sign', label: 'Assinar PDF', description: 'Adicione sua assinatura digital a um documento.',
    icon: PenLine, available: false, onPress: () => comingSoon('Assinar PDF'),
  },
];

function comingSoon(feature: string) {
  Alert.alert(feature, 'Em breve nesta versão.');
}

export default function ToolsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [favoriteIds, setFavoriteIds] = useState<string[]>(['merge', 'convert']);

  function toggleFavorite(id: string) {
    setFavoriteIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  const favoriteTools = TOOLS.filter((t) => favoriteIds.includes(t.id));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerIconWrap}><Wrench size={18} color={colors.white} /></View>
        <Text style={styles.headerTitle}>Ferramentas</Text>
        <Pressable hitSlop={8}>
          <Search size={20} color={colors.secondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Central de{'\n'}Ferramentas PDF</Text>
          <Text style={styles.heroSubtitle}>
            Manipule, converta e organize seus documentos com precisão profissional. Escolha uma das ferramentas abaixo para começar.
          </Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Favoritos</Text>
          <Pressable onPress={() => Alert.alert('Gerenciar Favoritos', 'Toque na estrela de cada ferramenta pra fixar ou remover.')}>
            <Text style={styles.manageLink}>Gerenciar</Text>
          </Pressable>
        </View>

        {favoriteTools.length === 0 ? (
          <Text style={styles.emptyFavText}>Nenhuma ferramenta fixada ainda.</Text>
        ) : (
          favoriteTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isFavorite
              onToggleFavorite={() => toggleFavorite(tool.id)}
              onPress={() => tool.onPress(navigation)}
              expanded
            />
          ))
        )}

        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Todas as Ferramentas</Text>
        {TOOLS.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            isFavorite={favoriteIds.includes(tool.id)}
            onToggleFavorite={() => toggleFavorite(tool.id)}
            onPress={() => tool.onPress(navigation)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function ToolCard({
  tool, isFavorite, onToggleFavorite, onPress, expanded,
}: {
  tool: ToolItem; isFavorite: boolean; onToggleFavorite: () => void; onPress: () => void; expanded?: boolean;
}) {
  const Icon = tool.icon;
  return (
    <Pressable style={[styles.toolCard, expanded && styles.toolCardExpanded]} onPress={onPress}>
      <View style={styles.toolIconWrap}>
        <Icon size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toolLabel}>{tool.label}</Text>
        {expanded && <Text style={styles.toolDescription}>{tool.description}</Text>}
        {!tool.available && <Text style={styles.comingSoonTag}>Em breve</Text>}
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
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  headerIconWrap: { width: 30, height: 30, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.primary },
  heroCard: {
    backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg,
  },
  heroTitle: { color: colors.white, fontSize: typography.headline * 0.65, fontWeight: '700', marginBottom: spacing.sm, lineHeight: 26 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: typography.label, lineHeight: 19 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionLabel: { fontSize: typography.body, fontWeight: '700', color: colors.neutral },
  manageLink: { fontSize: typography.label, color: colors.primary, fontWeight: '600' },
  emptyFavText: { color: colors.secondary, fontSize: typography.label, marginBottom: spacing.sm },
  toolCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.tertiary, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm,
  },
  toolCardExpanded: { padding: spacing.md },
  toolIconWrap: {
    width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  toolLabel: { fontSize: typography.body, fontWeight: '700', color: colors.neutral },
  toolDescription: { fontSize: typography.label, color: colors.secondary, marginTop: 2, lineHeight: 18 },
  comingSoonTag: { fontSize: 11, color: colors.primary, marginTop: 2, fontWeight: '600' },
});