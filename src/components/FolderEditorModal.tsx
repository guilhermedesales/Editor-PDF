// Modal de criar/editar pasta: nome, cor e ícone. Usado tanto pra criar
// uma pasta nova quanto pra editar uma existente (mesmo modal, com
// initialFolder preenchido no segundo caso).

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import {
  X, Folder, BookOpen, Receipt, Briefcase, GraduationCap, Home, Heart,
  Star, Plane, Camera, Music, ShoppingBag, Stethoscope,
} from 'lucide-react-native';
import { spacing, radius, typography } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import type { PdfFolderEntry } from '../services/pdfFoldersStorage';

export const FOLDER_ICON_MAP: Record<string, any> = {
  folder: Folder,
  book: BookOpen,
  receipt: Receipt,
  briefcase: Briefcase,
  graduation: GraduationCap,
  home: Home,
  heart: Heart,
  star: Star,
  plane: Plane,
  camera: Camera,
  music: Music,
  shopping: ShoppingBag,
  health: Stethoscope,
};

const ICON_KEYS = Object.keys(FOLDER_ICON_MAP);

const COLOR_OPTIONS = [
  '#2563EB', '#DC2626', '#059669', '#D97706', '#7C3AED',
  '#DB2777', '#0891B2', '#65A30D', '#EA580C', '#4B5563',
];

interface Props {
  visible: boolean;
  initialFolder?: PdfFolderEntry | null;
  onClose: () => void;
  onSave: (name: string, color: string, icon: string) => void;
  onDelete?: () => void;
}

export default function FolderEditorModal({ visible, initialFolder, onClose, onSave, onDelete }: Props) {
  const { colors } = useThemeStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState(ICON_KEYS[0]);

  useEffect(() => {
    if (visible) {
      setName(initialFolder?.name ?? '');
      setColor(initialFolder?.color ?? COLOR_OPTIONS[0]);
      setIcon(initialFolder?.icon ?? ICON_KEYS[0]);
    }
  }, [visible, initialFolder]);

  const SelectedIcon = FOLDER_ICON_MAP[icon];

  function handleSave() {
    if (!name.trim()) return;
    onSave(name.trim(), color, icon);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.white }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.neutral }]}>{initialFolder ? 'Editar Pasta' : 'Nova Pasta'}</Text>
            <Pressable onPress={onClose} hitSlop={8} style={[styles.closeButton, { backgroundColor: colors.tertiary }]}>
              <X size={18} color={colors.secondary} />
            </Pressable>
          </View>

          <View style={styles.previewRow}>
            <View style={[styles.previewIconWrap, { backgroundColor: color }]}>
              <SelectedIcon size={30} color="#fff" />
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.secondary }]}>NOME</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.neutral }]}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Livros"
            placeholderTextColor={colors.secondary}
          />

          <Text style={[styles.sectionLabel, { color: colors.secondary, marginTop: spacing.md }]}>COR</Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((c) => (
              <Pressable
                key={c}
                style={[styles.swatch, { backgroundColor: c }, color === c && { borderColor: colors.neutral, borderWidth: 3 }]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.secondary, marginTop: spacing.md }]}>ÍCONE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xs }}>
            {ICON_KEYS.map((key) => {
              const Icon = FOLDER_ICON_MAP[key];
              const active = icon === key;
              return (
                <Pressable
                  key={key}
                  style={[styles.iconOption, { backgroundColor: active ? color : colors.tertiary }]}
                  onPress={() => setIcon(key)}
                >
                  <Icon size={20} color={active ? '#fff' : colors.secondary} />
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.actionsRow}>
            {onDelete && (
              <Pressable style={[styles.deleteButton, { borderColor: colors.danger }]} onPress={onDelete}>
                <Text style={{ color: colors.danger, fontWeight: '700' }}>Excluir</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.saveButton, { backgroundColor: name.trim() ? colors.primary : colors.border }]}
              onPress={handleSave}
              disabled={!name.trim()}
            >
              <Text style={styles.saveButtonText}>Salvar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.md, paddingBottom: spacing.lg },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontSize: 18, fontWeight: '700' },
  closeButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  previewRow: { alignItems: 'center', marginBottom: spacing.md },
  previewIconWrap: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, fontSize: typography.body },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: 34, height: 34, borderRadius: 17, borderColor: 'transparent' },
  iconOption: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  deleteButton: { flex: 1, borderWidth: 1.5, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveButton: { flex: 2, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '700' },
});