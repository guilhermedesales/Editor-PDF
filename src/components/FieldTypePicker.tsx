// Modal de seleção de tipo de campo, exibido ao tocar em "+".
// Cada opção mostra ícone + label + descrição curta, em grid de 2
// colunas — bem mais fácil de escanear visualmente que texto puro.

import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList } from 'react-native';
import { colors, spacing, radius, typography } from '../constants/theme';
import { FIELD_TYPE_OPTIONS } from '../constants/fieldTypes';
import type { FieldType } from '../types/template';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: FieldType) => void;
}

export default function FieldTypePicker({ visible, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Adicionar Campo</Text>
          <Text style={styles.subtitle}>Escolha o tipo de dado</Text>

          <FlatList
            data={FIELD_TYPE_OPTIONS}
            numColumns={2}
            keyExtractor={(item) => item.type}
            columnWrapperStyle={{ gap: spacing.sm }}
            contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}
            renderItem={({ item }) => {
              const Icon = item.icon;
              return (
                <Pressable style={styles.option} onPress={() => onSelect(item.type)}>
                  <View style={styles.optionIconWrap}>
                    <Icon size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  <Text style={styles.optionDesc} numberOfLines={1}>
                    {item.description}
                  </Text>
                </Pressable>
              );
            }}
          />

          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '75%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: typography.body, fontWeight: '700', color: colors.neutral },
  subtitle: {
    fontSize: typography.label,
    color: colors.secondary,
    marginBottom: spacing.md,
  },
  option: {
    flex: 1,
    backgroundColor: colors.tertiary,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  optionLabel: { fontSize: typography.label, fontWeight: '700', color: colors.neutral },
  optionDesc: { fontSize: 11, color: colors.secondary, marginTop: 2 },
  cancelButton: { paddingVertical: spacing.sm, alignItems: 'center' },
  cancelText: { color: colors.secondary, fontSize: typography.body },
});