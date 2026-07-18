// Barra de ferramentas vertical no canto direito da tela do editor.
// Cada ferramenta muda o que um toque/arrasto no campo faz (ver
// FieldOverlay). Só uma fica ativa por vez.

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Plus, Move, Maximize2, Pencil, Trash2 } from 'lucide-react-native';
import { colors, radius, spacing } from '../constants/theme';
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
  return (
    <View style={styles.container}>
      {TOOLS.map(({ tool, Icon }) => {
        const isActive = active === tool;
        const isDelete = tool === 'delete';
        return (
          <Pressable
            key={tool}
            style={[
              styles.button,
              isActive && (isDelete ? styles.buttonActiveDanger : styles.buttonActive),
            ]}
            onPress={() => onChange(tool)}
          >
            <Icon size={20} color={isActive ? colors.white : isDelete ? colors.danger : colors.neutral} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%',
    marginTop: -110,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 6,
    gap: 6,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 20,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: { backgroundColor: colors.primary },
  buttonActiveDanger: { backgroundColor: '#FEE2E2' },
});