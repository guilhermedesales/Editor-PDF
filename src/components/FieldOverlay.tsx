// Representa um campo desenhado sobre a imagem do PDF durante a
// configuração do template (Modo 1).
//
// IMPORTANTE: cada PanResponder é criado UMA ÚNICA VEZ (useRef) e nunca
// recriado. Isso é essencial: PanResponder guarda o gestureState (dx/dy
// acumulado) DENTRO da própria instância — se recriássemos o responder
// a cada render (que acontece toda vez que setDrag dispara durante o
// próprio gesto), o acumulado resetava no meio do arrasto, causando o
// "tremor"/volta à posição original.
//
// Para os callbacks ainda lerem os valores mais recentes de field/scale/
// zoomScale sem precisar recriar o responder, usamos refs atualizadas a
// cada render (padrão comum pra "closures sempre atualizadas" com
// PanResponder).

import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, PanResponder } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { colors, radius } from '../constants/theme';
import type { TemplateField } from '../types/template';

interface Props {
  field: TemplateField;
  scale: number;
  zoomScale: number;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onMove: (dx: number, dy: number) => void;
  onResize: (dw: number, dh: number, dx: number, dy: number) => void;
}

type Mode = 'move' | 'tl' | 'tr' | 'bl' | 'br';

const MIN_WIDTH = 40;
const MIN_HEIGHT = 16;
const TAP_MAX_MOVEMENT = 6;
const HANDLE_SIZE = 20;

export default function FieldOverlay(props: Props) {
  const { field, scale, zoomScale, selected, onSelect, onEdit, onMove, onResize } = props;

  // refs sempre atualizadas — os PanResponders (criados 1x) leem daqui
  const fieldRef = useRef(field);
  const scaleRef = useRef(scale);
  const zoomScaleRef = useRef(zoomScale);
  const selectedRef = useRef(selected);
  const callbacksRef = useRef({ onSelect, onEdit, onMove, onResize });

  useEffect(() => {
    fieldRef.current = field;
    scaleRef.current = scale;
    zoomScaleRef.current = zoomScale;
    selectedRef.current = selected;
    callbacksRef.current = { onSelect, onEdit, onMove, onResize };
  });

  const [drag, setDrag] = useState<{ mode: Mode; dx: number; dy: number } | null>(null);

  function commit(mode: Mode, dxScreen: number, dyScreen: number) {
    const f = fieldRef.current;
    const effectiveScale = scaleRef.current * zoomScaleRef.current;
    const { onSelect, onEdit, onMove, onResize } = callbacksRef.current;

    if (mode === 'move') {
      const movedEnough =
        Math.abs(dxScreen) > TAP_MAX_MOVEMENT || Math.abs(dyScreen) > TAP_MAX_MOVEMENT;
      if (movedEnough) {
        onMove(dxScreen / effectiveScale, dyScreen / effectiveScale);
      } else {
        if (selectedRef.current) onEdit();
        else onSelect();
      }
      setDrag(null);
      return;
    }

    const dxPoints = dxScreen / effectiveScale;
    const dyPoints = dyScreen / effectiveScale;
    let dw = 0;
    let dh = 0;
    if (mode === 'br') {
      dw = dxPoints;
      dh = dyPoints;
    } else if (mode === 'bl') {
      dw = -dxPoints;
      dh = dyPoints;
    } else if (mode === 'tr') {
      dw = dxPoints;
      dh = -dyPoints;
    } else if (mode === 'tl') {
      dw = -dxPoints;
      dh = -dyPoints;
    }

    const newWidth = Math.max(f.position.width + dw, MIN_WIDTH);
    const newHeight = Math.max(f.position.height + dh, MIN_HEIGHT);
    const actualDw = newWidth - f.position.width;
    const actualDh = newHeight - f.position.height;

    let dxOut = 0;
    let dyOut = 0;
    if (mode === 'bl' || mode === 'tl') dxOut = -actualDw;
    if (mode === 'tr' || mode === 'tl') dyOut = -actualDh;

    onResize(actualDw, actualDh, dxOut, dyOut);
    setDrag(null);
  }

  // criado 1x por modo, nunca recriado — evita reset do gestureState
  function useGestureResponder(mode: Mode) {
    return useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => mode !== 'move',
        onMoveShouldSetPanResponder: (_e, g) =>
          Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          mode !== 'move' && (Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2),
        onPanResponderTerminationRequest: () => false,

        onPanResponderMove: (_e, g) => {
          setDrag({ mode, dx: g.dx / (zoomScaleRef.current || 1), dy: g.dy / (zoomScaleRef.current || 1) });
        },
        onPanResponderRelease: (_e, g) => commit(mode, g.dx, g.dy),
        onPanResponderTerminate: (_e, g) => commit(mode, g.dx, g.dy),
      })
    ).current;
  }

  const moveResponder = useGestureResponder('move');
  const tlResponder = useGestureResponder('tl');
  const trResponder = useGestureResponder('tr');
  const blResponder = useGestureResponder('bl');
  const brResponder = useGestureResponder('br');

  const safeZoom = zoomScale || 1;
  const baseLeft = field.position.x * scale;
  const baseTop = field.position.y * scale;
  const baseWidth = field.position.width * scale;
  const baseHeight = field.position.height * scale;
  const minW = MIN_WIDTH * scale;
  const minH = MIN_HEIGHT * scale;

  let left = baseLeft;
  let top = baseTop;
  let width = baseWidth;
  let height = baseHeight;

  if (drag) {
    if (drag.mode === 'move') {
      left += drag.dx;
      top += drag.dy;
    } else {
      if (drag.mode === 'br') {
        width = Math.max(baseWidth + drag.dx, minW);
        height = Math.max(baseHeight + drag.dy, minH);
      } else if (drag.mode === 'bl') {
        width = Math.max(baseWidth - drag.dx, minW);
        left = baseLeft + (baseWidth - width);
        height = Math.max(baseHeight + drag.dy, minH);
      } else if (drag.mode === 'tr') {
        width = Math.max(baseWidth + drag.dx, minW);
        height = Math.max(baseHeight - drag.dy, minH);
        top = baseTop + (baseHeight - height);
      } else if (drag.mode === 'tl') {
        width = Math.max(baseWidth - drag.dx, minW);
        left = baseLeft + (baseWidth - width);
        height = Math.max(baseHeight - drag.dy, minH);
        top = baseTop + (baseHeight - height);
      }
    }
  }

  const handleVisualSize = HANDLE_SIZE / safeZoom;
  const handleHalf = handleVisualSize / 2;

  return (
    <React.Fragment>
      <View
        {...moveResponder.panHandlers}
        style={[
          styles.field,
          {
            left,
            top,
            width,
            height,
            borderColor: selected ? colors.primary : colors.primaryLight,
          },
        ]}
      >
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

        {selected && (
          <Pressable
            style={[styles.iconButton, styles.editButton]}
            onPress={onEdit}
            hitSlop={8}
          >
            <Pencil size={14} color={colors.white} />
          </Pressable>
        )}
      </View>

      {selected &&
        (
          [
            { mode: 'tl' as Mode, responder: tlResponder, top: -handleHalf, left: -handleHalf },
            { mode: 'tr' as Mode, responder: trResponder, top: -handleHalf, left: width - handleHalf },
            { mode: 'bl' as Mode, responder: blResponder, top: height - handleHalf, left: -handleHalf },
            { mode: 'br' as Mode, responder: brResponder, top: height - handleHalf, left: width - handleHalf },
          ] as const
        ).map(({ mode, responder, top: handleTop, left: handleLeft }) => (
          <View
            key={mode}
            {...responder.panHandlers}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            style={[
              styles.resizeHandle,
              {
                left: left + handleLeft,
                top: top + handleTop,
                width: handleVisualSize,
                height: handleVisualSize,
                borderRadius: handleVisualSize / 2,
              },
            ]}
          />
        ))}
    </React.Fragment>
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
  label: { fontWeight: '600' },
  iconButton: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    top: -12,
    right: -12,
  },
  editButton: {},
  resizeHandle: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
});