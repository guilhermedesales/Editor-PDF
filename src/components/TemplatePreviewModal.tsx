import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image, TextInput, ScrollView, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { spacing, radius, typography } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import { DEFAULT_DATE_CONFIG, formatDateValue } from '../utils/dateFormat';
import { currencyToWords, plainNumberToWords } from '../utils/numberToWords';
import { DEFAULT_AUTO_INCREMENT_CONFIG, formatAutoIncrement } from '../utils/autoIncrement';
import type { TemplateField } from '../types/template';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  visible: boolean;
  onClose: () => void;
  pdfUri: string;
  pageWidth: number;
  pageHeight: number;
  fields: TemplateField[];
}

function sampleFor(field: TemplateField): string {
  switch (field.type) {
    case 'cpf': return '123.456.789-00';
    case 'cnpj': return '12.345.678/0001-00';
    case 'telefone': return '(21) 98765-4321';
    case 'valor': return `${field.valorConfig?.showSymbol ?? true ? 'R$ ' : ''}150,00`;
    case 'valorPorExtenso': return currencyToWords('150,00');
    case 'numeroPorExtenso': return plainNumberToWords('10');
    case 'autoIncremento': return formatAutoIncrement(field.autoIncrementConfig?.startAt ?? 1, field.autoIncrementConfig ?? DEFAULT_AUTO_INCREMENT_CONFIG);
    case 'data': {
      const cfg = field.dateConfig ?? DEFAULT_DATE_CONFIG;
      if (cfg.auto) return formatDateValue(cfg, '');
      return cfg.parts.length === 3 ? formatDateValue(cfg, '15/03/2026')
        : cfg.parts[0] === 'mes' ? formatDateValue(cfg, '3')
        : cfg.parts[0] === 'dia' ? '15' : '2026';
    }
    case 'hora': return '14:30';
    case 'numero': return '10';
    case 'textoMultilinha': return 'Texto de exemplo em múltiplas linhas';
    default: return field.internalName || 'Texto de exemplo';
  }
}

export default function TemplatePreviewModal({ visible, onClose, pdfUri, pageWidth, pageHeight, fields }: Props) {
  const { colors } = useThemeStore();
  const [values, setValues] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const displayWidth = SCREEN_WIDTH - spacing.md * 2;
  const scale = pageWidth ? displayWidth / pageWidth : 1;
  const displayHeight = pageHeight * scale;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.neutral }]}>Prévia do Documento</Text>
          <Pressable onPress={onClose} hitSlop={8} style={[styles.closeButton, { backgroundColor: colors.tertiary }]}>
            <X size={18} color={colors.secondary} />
          </Pressable>
        </View>
        <Text style={[styles.hint, { color: colors.secondary }]}>Toque em qualquer campo para editar o texto de exemplo</Text>

        <ScrollView contentContainerStyle={{ alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: displayWidth, height: displayHeight }}>
            <Image source={{ uri: pdfUri }} style={{ width: displayWidth, height: displayHeight }} resizeMode="contain" />
            {fields.map((field) => {
              const value = values[field.id] ?? sampleFor(field);
              const isEditing = editingId === field.id;
              return (
                <Pressable
                  key={field.id}
                  onPress={() => setEditingId(field.id)}
                  style={{ position: 'absolute', left: field.position.x * scale, top: field.position.y * scale, width: field.position.width * scale, height: field.position.height * scale }}
                >
                  {isEditing ? (
                    <TextInput
                      autoFocus
                      style={[
                        styles.inlineInput,
                        { borderColor: colors.primary, backgroundColor: colors.white },
                        {
                          fontSize: (field.style.fontSize ?? 12) * scale,
                          color: field.style.color || colors.neutral,
                          fontWeight: field.style.bold ? '700' : '400',
                          fontStyle: field.style.italic ? 'italic' : 'normal',
                          textAlign: field.style.align,
                        },
                      ]}
                      value={value}
                      onChangeText={(t) => setValues((prev) => ({ ...prev, [field.id]: t }))}
                      onBlur={() => setEditingId(null)}
                      multiline={field.type === 'textoMultilinha'}
                    />
                  ) : (
                    <Text
                      numberOfLines={field.type === 'textoMultilinha' ? field.maxLines ?? 4 : 1}
                      style={{
                        fontSize: (field.style.fontSize ?? 12) * scale,
                        color: field.style.color || colors.neutral,
                        fontWeight: field.style.bold ? '700' : '400',
                        fontStyle: field.style.italic ? 'italic' : 'normal',
                        textAlign: field.style.align,
                      }}
                    >
                      {value}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  headerTitle: { fontSize: typography.body, fontWeight: '700' },
  closeButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: typography.label, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  inlineInput: { borderWidth: 1, borderRadius: 4, padding: 0, margin: 0 },
});