import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
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
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      {TOOLS.map(({ tool, Icon }) => {
        const isActive = active === tool;
        const isDelete = tool === 'delete';
        return (
          <Pressable
            key={tool}
            style={[styles.button, isActive && { backgroundColor: isDelete ? '#FEE2E2' : colors.primary }]}
            onPress={() => onChange(tool)}
          >
            <Icon size={20} color={isActive && !isDelete ? colors.white : isDelete ? colors.danger : colors.neutral} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', right: spacing.sm, top: '50%', marginTop: -110,
    borderRadius: radius.lg, padding: 6, gap: 6, elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, zIndex: 20,
  },
  button: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});