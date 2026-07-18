// Tela inicial: lista os templates salvos, cada um com ações de
// Editar/Preencher, e um botão pra criar um novo template do zero.
// Segue o mockup: título, botão "+ Novo Template" em destaque, cards
// de template com miniatura, nome e metadados.

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../constants/theme';
import { getAllTemplates } from '../services/templateStorage';
import type { Template } from '../types/template';

export default function HomeScreen({ navigation }: any) {
  const [templates, setTemplates] = useState<Template[]>([]);

  // useFocusEffect (em vez de useEffect simples) garante que a lista
  // recarrega toda vez que o usuário volta pra essa tela — por exemplo,
  // depois de salvar um template novo no editor.
  useFocusEffect(
    useCallback(() => {
      getAllTemplates().then(setTemplates);
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Templates</Text>

      <Pressable
        style={styles.newButton}
        onPress={() => navigation.navigate('TemplateEditor', {})}
      >
        <Text style={styles.newButtonText}>+ Novo Template</Text>
      </Pressable>

      {templates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Nenhum template ainda. Toque em "+ Novo Template" para começar.
          </Text>
        </View>
      ) : (
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          renderItem={({ item }) => (
            <TemplateCard
              template={item}
              onEdit={() =>
                navigation.navigate('TemplateEditor', { templateId: item.id })
              }
              onFill={() =>
                navigation.navigate('TemplateFill', { templateId: item.id })
              }
            />
          )}
        />
      )}
    </View>
  );
}

// Componente isolado pro card — facilita reaproveitar/ajustar o visual
// sem mexer na lógica de carregamento da tela.
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
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{template.name}</Text>
        <Text style={styles.cardMeta}>{template.fields.length} campos</Text>
      </View>
      <View style={styles.cardActions}>
        <Pressable style={styles.actionButton} onPress={onEdit}>
          <Text style={styles.actionText}>Editar</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={onFill}
        >
          <Text style={[styles.actionText, styles.actionTextPrimary]}>
            Preencher
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: typography.headline,
    fontWeight: '700',
    color: colors.neutral,
    marginBottom: spacing.md,
  },
  newButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  newButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.secondary,
    textAlign: 'center',
    fontSize: typography.body,
  },
  card: {
    backgroundColor: colors.tertiary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.neutral,
  },
  cardMeta: {
    fontSize: typography.label,
    color: colors.secondary,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
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
  actionTextPrimary: {
    color: colors.white,
  },
});