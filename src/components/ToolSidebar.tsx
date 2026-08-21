import React from 'react';
import { ScrollView, View, Pressable, StyleSheet, Text } from 'react-native';
import { Plus, Move, Maximize2, Pencil, Trash2 } from 'lucide-react-native';
import { radius, spacing } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
import type { FieldTool } from './FieldOverlay';

export type EditorTool = 'add' | FieldTool;

interface Props {
  active: EditorTool;
  onChange: (tool: EditorTool) => void;
}

const TOOLS: { tool: EditorTool; Icon: any; label: string }[] = [
  { tool: 'add', Icon: Plus, label: 'Adicionar' },
  { tool: 'move', Icon: Move, label: 'Mover' },
  { tool: 'resize', Icon: Maximize2, label: 'Redimensionar' },
  { tool: 'edit', Icon: Pencil, label: 'Editar' },
  { tool: 'delete', Icon: Trash2, label: 'Excluir' },
];

export default function ToolSidebar({ active, onChange }: Props) {
  const { colors } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.white, borderTopColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
      {TOOLS.map(({ tool, Icon, label }) => {
        const isActive = active === tool;
        const isDelete = tool === 'delete';
        return (
          <Pressable
            key={tool}
            style={[styles.button, { borderColor: colors.border }, isActive && { backgroundColor: isDelete ? '#FEE2E2' : colors.primary, borderColor: isDelete ? '#FEE2E2' : colors.primary }]}
            onPress={() => onChange(tool)}
          >
            <Icon size={20} color={isActive && !isDelete ? colors.white : isDelete ? colors.danger : colors.neutral} />
            <Text style={[styles.label, { color: isActive && !isDelete ? colors.white : isDelete ? colors.danger : colors.neutral }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingVertical: spacing.xs,
    elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  content: { paddingHorizontal: spacing.md, gap: spacing.sm },
  button: {
    minWidth: 76, height: 52, borderRadius: radius.md, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, gap: 2,
  },
  label: { fontSize: 10, fontWeight: '700' },
});