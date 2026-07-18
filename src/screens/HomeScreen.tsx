import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilePlus2, FileEdit, RefreshCw, Combine, FileText, MoreVertical, Search } from 'lucide-react-native';
import { spacing, radius, typography } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import { getAllTemplates } from '../services/templateStorage';
import type { Template } from '../types/template';

const logo = require('../../assets/logo.png');

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
  const { colors } = useThemeStore();
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
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
        <Text style={[styles.headerTitle, { color: colors.primary }]}>PDF Studio</Text>
        <Pressable hitSlop={8}>
          <Search size={20} color={colors.secondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}>
    

        <Text style={[styles.sectionLabel, { color: colors.secondary }]}>AÇÕES RÁPIDAS</Text>
        <View style={styles.grid}>
          <QuickAction icon={FilePlus2} label="Criar Template" colors={colors} onPress={() => navigation.navigate('TemplateEditor', {})} />
          <QuickAction icon={FileEdit} label="Preencher Template" colors={colors} onPress={pickTemplateToFill} />
          <QuickAction icon={RefreshCw} label="Converter Arquivo" colors={colors} onPress={() => navigation.navigate('ConvertToPdf')} />
          <QuickAction icon={Combine} label="Juntar PDFs" colors={colors} onPress={() => navigation.navigate('MergePdf')} />
        </View>

        <Pressable style={[styles.wideAction, { backgroundColor: colors.tertiary }]} onPress={() => navigation.navigate('Files')}>
          <FileText size={22} color={colors.primary} />
          <Text style={[styles.wideActionText, { color: colors.neutral }]}>Abrir PDF</Text>
        </Pressable>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionLabel, { color: colors.secondary }]}>RECENTES</Text>
          <Pressable onPress={() => navigation.navigate('Templates')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>Ver tudo</Text>
          </Pressable>
        </View>

        {templates.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.secondary }]}>Nenhum template criado ainda.</Text>
        ) : (
          templates.map((t) => (
            <Pressable key={t.id} style={[styles.recentCard, { backgroundColor: colors.tertiary }]} onPress={() => navigation.navigate('TemplateFill', { templateId: t.id })}>
              <View style={[styles.recentThumb, { backgroundColor: colors.primaryLight }]}>
                <FileText size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.recentTitle, { color: colors.neutral }]} numberOfLines={1}>{t.name}</Text>
                <Text style={[styles.recentMeta, { color: colors.secondary }]}>Modificado {formatRelativeTime(t.updatedAt)}</Text>
              </View>
              <MoreVertical size={18} color={colors.secondary} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function QuickAction({ icon: Icon, label, onPress, colors }: { icon: any; label: string; onPress: () => void; colors: any }) {
  return (
    <Pressable style={[styles.quickAction, { backgroundColor: colors.tertiary }]} onPress={onPress}>
      <View style={[styles.quickActionIconWrap, { backgroundColor: colors.primaryLight }]}>
        <Icon size={22} color={colors.primary} />
      </View>
      <Text style={[styles.quickActionLabel, { color: colors.neutral }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  headerLogo: { width: 28, height: 28, borderRadius: radius.sm },
  headerTitle: { flex: 1, fontSize: typography.body, fontWeight: '700' },
  greeting: { fontSize: typography.headline * 0.7, fontWeight: '700', marginTop: spacing.sm },
  subGreeting: { fontSize: typography.label, marginBottom: spacing.lg },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.sm },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { fontSize: typography.label, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  quickAction: { width: '47%', borderRadius: radius.md, padding: spacing.md, alignItems: 'flex-start' },
  quickActionIconWrap: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  quickActionLabel: { fontSize: typography.label, fontWeight: '700' },
  wideAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  wideActionText: { fontSize: typography.body, fontWeight: '700' },
  emptyText: { fontSize: typography.label, paddingVertical: spacing.md },
  recentCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.sm },
  recentThumb: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  recentTitle: { fontSize: typography.label, fontWeight: '700' },
  recentMeta: { fontSize: 11, marginTop: 2 },
});