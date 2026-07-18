// Modal de edição de um campo já posicionado no template: nome interno,
// obrigatoriedade, tamanho da fonte, cor, negrito/itálico e alinhamento.
// Abre ao tocar num campo já selecionado ou no ícone de lápis dele.

import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput } from 'react-native';
import { colors, spacing, radius, typography } from '../constants/theme';
import { FIELD_TYPE_OPTIONS } from '../constants/fieldTypes';
import type { TemplateField } from '../types/template';

const COLOR_OPTIONS = [
  '#1C1B1B',
  '#2563EB',
  '#DC2626',
  '#059669',
  '#D97706',
  '#7C3AED',
];

const ALIGN_OPTIONS: { value: TemplateField['style']['align']; label: string }[] = [
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Direita' },
];

interface Props {
  visible: boolean;
  field: TemplateField | null;
  onClose: () => void;
  onUpdate: (partial: Partial<TemplateField>) => void;
  onUpdateStyle: (partial: Partial<TemplateField['style']>) => void;
  onDelete: () => void;
}

export default function FieldEditorSheet({
  visible,
  field,
  onClose,
  onUpdate,
  onUpdateStyle,
  onDelete,
}: Props) {
  if (!field) return null;

  const typeLabel =
    FIELD_TYPE_OPTIONS.find((opt) => opt.type === field.type)?.label ?? field.type;

  function adjustFontSize(delta: number) {
    const current = field!.style.fontSize ?? 12;
    const next = Math.min(Math.max(current + delta, 8), 48);
    onUpdateStyle({ fontSize: next });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Editar Campo</Text>
          <Text style={styles.typeLabel}>Tipo: {typeLabel}</Text>

          <Text style={styles.sectionLabel}>Nome do Campo</Text>
          <TextInput
            style={styles.input}
            value={field.internalName}
            placeholder="Ex: nome_locatario"
            onChangeText={(text) => onUpdate({ internalName: text })}
          />

          <Pressable
            style={styles.requiredRow}
            onPress={() => onUpdate({ required: !field.required })}
          >
            <View style={[styles.checkbox, field.required && styles.checkboxChecked]} />
            <Text style={styles.requiredText}>Campo obrigatório</Text>
          </Pressable>

          <Text style={styles.sectionLabel}>Tamanho da Fonte</Text>
          <View style={styles.row}>
            <Pressable style={styles.stepButton} onPress={() => adjustFontSize(-1)}>
              <Text style={styles.stepButtonText}>−</Text>
            </Pressable>
            <Text style={styles.stepValue}>{field.style.fontSize ?? 12}</Text>
            <Pressable style={styles.stepButton} onPress={() => adjustFontSize(1)}>
              <Text style={styles.stepButtonText}>+</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Cor</Text>
          <View style={styles.row}>
            {COLOR_OPTIONS.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  field.style.color === color && styles.swatchSelected,
                ]}
                onPress={() => onUpdateStyle({ color })}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Estilo</Text>
          <View style={styles.row}>
            <Pressable
              style={[styles.pill, field.style.bold && styles.pillActive]}
              onPress={() => onUpdateStyle({ bold: !field.style.bold })}
            >
              <Text style={[styles.pillText, field.style.bold && styles.pillTextActive]}>
                Negrito
              </Text>
            </Pressable>
            <Pressable
              style={[styles.pill, field.style.italic && styles.pillActive]}
              onPress={() => onUpdateStyle({ italic: !field.style.italic })}
            >
              <Text style={[styles.pillText, field.style.italic && styles.pillTextActive]}>
                Itálico
              </Text>
            </Pressable>
          </View>

            <Text style={styles.sectionLabel}>Alinhamento</Text>
            <View style={styles.row}>
            {[
                { value: 'left' as const, Icon: AlignLeft },
                { value: 'center' as const, Icon: AlignCenter },
                { value: 'right' as const, Icon: AlignRight },
            ].map(({ value, Icon }) => (
                <Pressable
                key={value}
                style={[styles.pill, field.style.align === value && styles.pillActive]}
                onPress={() => onUpdateStyle({ align: value })}
                >
                <Icon
                    size={18}
                    color={field.style.align === value ? colors.white : colors.neutral}
                />
                </Pressable>
            ))}
          </View>

          <Pressable style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteButtonText}>Excluir Campo</Text>
          </Pressable>

          <Pressable style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Concluir</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '85%',
  },
  title: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  typeLabel: {
    fontSize: typography.label,
    color: colors.secondary,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.neutral,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  requiredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  requiredText: {
    fontSize: typography.label,
    color: colors.neutral,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral,
  },
  stepValue: {
    fontSize: typography.body,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'center',
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderColor: colors.neutral,
  },
  pill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.tertiary,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    fontSize: typography.label,
    fontWeight: '600',
    color: colors.neutral,
  },
  pillTextActive: {
    color: colors.white,
  },
  deleteButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.danger,
    fontWeight: '600',
  },
  doneButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  doneButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
});