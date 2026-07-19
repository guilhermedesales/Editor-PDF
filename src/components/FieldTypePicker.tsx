import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList } from 'react-native';
import { spacing, radius, typography } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import { FIELD_TYPE_OPTIONS } from '../constants/fieldTypes';
import type { FieldType } from '../types/template';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: FieldType) => void;
}

export default function FieldTypePicker({ visible, onClose, onSelect }: Props) {
  const { colors } = useThemeStore();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.white }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.neutral }]}>Adicionar Campo</Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>Escolha o tipo de dado</Text>

          <FlatList
            data={FIELD_TYPE_OPTIONS}
            numColumns={2}
            keyExtractor={(item) => item.type}
            columnWrapperStyle={{ gap: spacing.sm }}
            contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}
            renderItem={({ item }) => {
              const Icon = item.icon;
              return (
                <Pressable style={[styles.option, { backgroundColor: colors.tertiary }]} onPress={() => onSelect(item.type)}>
                  <View style={[styles.optionIconWrap, { backgroundColor: colors.primaryLight }]}>
                    <Icon size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.optionLabel, { color: colors.neutral }]}>{item.label}</Text>
                  <Text style={[styles.optionDesc, { color: colors.secondary }]} numberOfLines={1}>{item.description}</Text>
                </Pressable>
              );
            }}
          />

          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.secondary }]}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.md, maxHeight: '75%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  title: { fontSize: typography.body, fontWeight: '700' },
  subtitle: { fontSize: typography.label, marginBottom: spacing.md },
  option: { flex: 1, borderRadius: radius.md, padding: spacing.sm },
  optionIconWrap: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  optionLabel: { fontSize: typography.label, fontWeight: '700' },
  optionDesc: { fontSize: 11, marginTop: 2 },
  cancelButton: { paddingVertical: spacing.sm, alignItems: 'center' },
  cancelText: { fontSize: typography.body },
});