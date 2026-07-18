// Representa um campo desenhado sobre a imagem do PDF durante a
// configuração do template (Modo 1).
//
// Toque simples: seleciona o campo (mostra borda + handles).
// Toque num campo JÁ selecionado: abre o editor (onEdit).
// Arrastar o corpo do campo: move (onMove).
// Arrastar o "handle" do canto inferior direito: redimensiona (onResize).
// Ícone de lápis: abre o editor. Ícone de "×": exclui.

import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, Pressable } from 'react-native';
import { colors, radius } from '../constants/theme';
import type { TemplateField } from '../types/template';

interface Props {
  field: TemplateField;
  scale: number; // pontos de pdf -> pixels de tela, na escala base (zoom 1x)
  zoomScale: number; // zoom adicional aplicado pelo ZoomablePdfView
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (dx: number, dy: number) => void; // deltas em PONTOS de pdf
  onResize: (dw: number, dh: number) => void; // idem, pra largura/altura
}

const MIN_WIDTH = 40;
const MIN_HEIGHT = 16;

export default function FieldOverlay({
  field,
  scale,
  zoomScale,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onMove,
  onResize,
}: Props) {
  // Escala efetiva: converte pixels de gesto (que já vêm "ampliados"
  // pelo zoom da tela) de volta pra pontos de pdf.
  const effectiveScale = scale * zoomScale;

  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (selected) {
          onEdit();
        } else {
          onSelect();
        }
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        // Se o dedo praticamente não se moveu, trata como toque (já
        // resolvido no onPanResponderGrant) em vez de arrasto.
        if (Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3) {
          onMove(gesture.dx / effectiveScale, gesture.dy / effectiveScale);
        }
        pan.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  const resizePan = useRef(new Animated.ValueXY()).current;
  const resizeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dx: resizePan.x, dy: resizePan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        const dw = gesture.dx / effectiveScale;
        const dh = gesture.dy / effectiveScale;
        // Não deixa passar do tamanho mínimo.
        const clampedDw = Math.max(dw, MIN_WIDTH - field.position.width);
        const clampedDh = Math.max(dh, MIN_HEIGHT - field.position.height);
        onResize(clampedDw, clampedDh);
        resizePan.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.field,
        {
          left: field.position.x * scale,
          top: field.position.y * scale,
          width: field.position.width * scale,
          height: field.position.height * scale,
          borderColor: selected ? colors.primary : colors.primaryLight,
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={selected ? onEdit : onSelect}>
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            {
              fontSize: (field.style.fontSize ?? 12) * Math.min(scale, 1.4),
              color: field.style.color || colors.primary,
              fontWeight: field.style.bold ? '700' : '600',
              fontStyle: field.style.italic ? 'italic' : 'normal',
              textAlign: field.style.align,
            },
          ]}
        >
          {field.internalName || 'Sem nome'}
        </Text>
      </Pressable>

      {selected && (
        <>
          <Pressable style={[styles.iconButton, styles.editButton]} onPress={onEdit}>
            <Text style={styles.iconButtonText}>✎</Text>
          </Pressable>

          <Pressable style={[styles.iconButton, styles.deleteButton]} onPress={onDelete}>
            <Text style={styles.iconButtonText}>×</Text>
          </Pressable>

          <Animated.View
            {...resizeResponder.panHandlers}
            style={[
              styles.resizeHandle,
              { transform: resizePan.getTranslateTransform() },
            ]}
          />
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  field: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  label: {
    fontWeight: '600',
  },
  iconButton: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    top: -12,
    right: -12,
  },
  deleteButton: {
    top: -12,
    left: -12,
    backgroundColor: colors.danger,
  },
  iconButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  resizeHandle: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
});