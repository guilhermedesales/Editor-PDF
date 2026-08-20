// Modal usado na tela de criação/edição do Template pra vincular (ou
// editar o vínculo) a uma planilha: define o nome da planilha e, pra
// cada campo do template, se ele vira uma coluna e qual o nome dela.
// A coluna "Data/Hora" é sempre incluída automaticamente, sem opção de
// remover.

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { X, Table, Trash2 } from 'lucide-react-native';
import { spacing, radius, typography } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import {
  createSpreadsheet, updateSpreadsheetConfig, deleteSpreadsheet,
  type SpreadsheetEntry, type SpreadsheetColumn,
} from '../services/spreadsheetsStorage';
import type { TemplateField } from '../types/template';

interface Props {
  visible: boolean;
  templateId: string;
  templateName: string;
  fields: TemplateField[];
  existingSpreadsheet: SpreadsheetEntry | null;
  onClose: () => void;
  onSaved: (spreadsheetId: string) => void;
  onUnlink: () => void;
}

interface FieldRowState {
  fieldId: string;
  included: boolean;
  label: string;
}

function generateColumnId() {
  return `col-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function SpreadsheetLinkModal({
  visible, templateId, templateName, fields, existingSpreadsheet, onClose, onSaved, onUnlink,
}: Props) {
  const { colors } = useThemeStore();
  const [sheetName, setSheetName] = useState('');
  const [rows, setRows] = useState<FieldRowState[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setSheetName(existingSpreadsheet?.name ?? `${templateName || 'Template'} - Dados`);

    if (existingSpreadsheet) {
      const byFieldId = new Map(
        existingSpreadsheet.columns.filter((c) => c.fieldId).map((c) => [c.fieldId as string, c])
      );
      setRows(
        fields.map((f) => {
          const existingCol = byFieldId.get(f.id);
          return { fieldId: f.id, included: !!existingCol, label: existingCol?.label ?? (f.internalName || 'Campo') };
        })
      );
    } else {
      setRows(fields.map((f) => ({ fieldId: f.id, included: true, label: f.internalName || 'Campo' })));
    }
  }, [visible, existingSpreadsheet, fields, templateName]);

  function toggleField(fieldId: string) {
    setRows((prev) => prev.map((r) => (r.fieldId === fieldId ? { ...r, included: !r.included } : r)));
  }

  function updateLabel(fieldId: string, label: string) {
    setRows((prev) => prev.map((r) => (r.fieldId === fieldId ? { ...r, label } : r)));
  }

  function buildColumns(): SpreadsheetColumn[] {
    const fixed: SpreadsheetColumn = { id: 'data-hora', label: 'Data/Hora', fieldId: null };
    const fieldColumns: SpreadsheetColumn[] = rows
      .filter((r) => r.included)
      .map((r) => {
        const existingCol = existingSpreadsheet?.columns.find((c) => c.fieldId === r.fieldId);
        return { id: existingCol?.id ?? generateColumnId(), label: r.label.trim() || 'Coluna', fieldId: r.fieldId };
      });
    return [fixed, ...fieldColumns];
  }

  async function handleSave() {
    setSaving(true);
    try {
      const columns = buildColumns();
      const name = sheetName.trim() || 'Planilha sem nome';

      if (existingSpreadsheet) {
        await updateSpreadsheetConfig(existingSpreadsheet.id, { name, columns });
        onSaved(existingSpreadsheet.id);
      } else {
        const created = await createSpreadsheet(name, templateId, columns);
        onSaved(created.id);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlink() {
    if (!existingSpreadsheet) return;
    await deleteSpreadsheet(existingSpreadsheet.id);
    onUnlink();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.white }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.neutral }]}>Vincular a uma Planilha</Text>
            <Pressable onPress={onClose} hitSlop={8} style={[styles.closeButton, { backgroundColor: colors.tertiary }]}>
              <X size={18} color={colors.secondary} />
            </Pressable>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.secondary }]}>NOME DA PLANILHA</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.neutral }]}
            value={sheetName}
            onChangeText={setSheetName}
            placeholder="Ex: Recibos - Controle"
            placeholderTextColor={colors.secondary}
          />

          <Text style={[styles.sectionLabel, { color: colors.secondary, marginTop: spacing.md }]}>COLUNAS</Text>
          <Text style={[styles.hint, { color: colors.secondary }]}>
            Toda linha salva já inclui a coluna "Data/Hora" automaticamente. Escolha quais campos viram colunas e o nome de cada uma.
          </Text>

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {fields.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.secondary }]}>Este template ainda não tem campos.</Text>
            )}
            {rows.map((row) => {
              const field = fields.find((f) => f.id === row.fieldId);
              if (!field) return null;
              return (
                <View key={row.fieldId} style={[styles.fieldRow, { borderColor: colors.border }]}>
                  <Pressable
                    style={[
                      styles.checkbox,
                      { borderColor: colors.border },
                      row.included && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => toggleField(row.fieldId)}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldOriginalName, { color: colors.secondary }]} numberOfLines={1}>
                      {field.internalName || 'Campo sem nome'}
                    </Text>
                    <TextInput
                      editable={row.included}
                      style={[
                        styles.columnInput,
                        { borderColor: colors.border, color: colors.neutral },
                        !row.included && { opacity: 0.4 },
                      ]}
                      value={row.label}
                      onChangeText={(t) => updateLabel(row.fieldId, t)}
                      placeholder="Nome da coluna"
                      placeholderTextColor={colors.secondary}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.actionsRow}>
            {existingSpreadsheet && (
              <Pressable style={[styles.unlinkButton, { borderColor: colors.danger }]} onPress={handleUnlink}>
                <Trash2 size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, fontWeight: '700' }}>Desvincular</Text>
              </Pressable>
            )}
            <Pressable style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]} onPress={handleSave} disabled={saving}>
              <Table size={16} color="#fff" />
              <Text style={styles.saveButtonText}>Salvar Vínculo</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.md, paddingBottom: spacing.lg, maxHeight: '90%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontSize: 18, fontWeight: '700' },
  closeButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: spacing.xs },
  hint: { fontSize: 12, marginBottom: spacing.sm, lineHeight: 16 },
  input: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, fontSize: typography.body },
  emptyText: { fontSize: typography.label, paddingVertical: spacing.md, textAlign: 'center' },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, marginTop: 4 },
  fieldOriginalName: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  columnInput: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.xs, fontSize: typography.label },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  unlinkButton: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  saveButton: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, paddingVertical: spacing.sm },
  saveButtonText: { color: '#fff', fontWeight: '700' },
});