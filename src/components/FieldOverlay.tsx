import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, PanResponder } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import type { TemplateField } from '../types/template';

export type FieldTool = 'move' | 'resize' | 'edit' | 'delete';

interface Props {
  field: TemplateField;
  scale: number;
  zoomScale: number;
  selected: boolean;
  tool: FieldTool;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (dx: number, dy: number) => void;
  onResize: (dw: number, dh: number, dx: number, dy: number) => void;
}

type Mode = 'move' | 'tl' | 'tr' | 'bl' | 'br';

const MIN_WIDTH = 40;
const MIN_HEIGHT = 16;
const TAP_MAX_MOVEMENT = 6;
const HANDLE_SIZE = 20;
const FIELD_RADIUS = 4;

export default function FieldOverlay(props: Props) {
  const { field, scale, zoomScale, selected, tool, onSelect, onEdit, onDelete, onMove, onResize } = props;
  const { colors } = useThemeStore();

  const fieldRef = useRef(field);
  const scaleRef = useRef(scale);
  const zoomScaleRef = useRef(zoomScale);
  const toolRef = useRef(tool);
  const callbacksRef = useRef({ onSelect, onEdit, onDelete, onMove, onResize });

  useEffect(() => {
    fieldRef.current = field;
    scaleRef.current = scale;
    zoomScaleRef.current = zoomScale;
    toolRef.current = tool;
    callbacksRef.current = { onSelect, onEdit, onDelete, onMove, onResize };
  });

  const [drag, setDrag] = useState<{ mode: Mode; dx: number; dy: number } | null>(null);

  function commit(mode: Mode, dxScreen: number, dyScreen: number) {
    const f = fieldRef.current;
    const effectiveScale = scaleRef.current * zoomScaleRef.current;
    const { onSelect, onMove, onResize } = callbacksRef.current;

    if (mode === 'move') {
      const movedEnough = Math.abs(dxScreen) > TAP_MAX_MOVEMENT || Math.abs(dyScreen) > TAP_MAX_MOVEMENT;
      if (movedEnough) {
        onMove(dxScreen / effectiveScale, dyScreen / effectiveScale);
      } else if (toolRef.current === 'resize') {
        onSelect();
      }
      setDrag(null);
      return;
    }

    const dxPoints = dxScreen / effectiveScale;
    const dyPoints = dyScreen / effectiveScale;
    let dw = 0;
    let dh = 0;
    if (mode === 'br') { dw = dxPoints; dh = dyPoints; }
    else if (mode === 'bl') { dw = -dxPoints; dh = dyPoints; }
    else if (mode === 'tr') { dw = dxPoints; dh = -dyPoints; }
    else if (mode === 'tl') { dw = -dxPoints; dh = -dyPoints; }

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

  function useGestureResponder(mode: Mode) {
    return useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => {
          const t = toolRef.current;
          if (mode === 'move') return t === 'move' || t === 'resize' || t === 'edit' || t === 'delete';
          return t === 'resize';
        },
        onStartShouldSetPanResponderCapture: () => mode !== 'move',
        onMoveShouldSetPanResponder: (_e, g) => {
          const t = toolRef.current;
          const moved = Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2;
          if (mode === 'move') return t === 'move' && moved;
          return t === 'resize' && moved;
        },
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          mode !== 'move' && toolRef.current === 'resize' && (Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {},
        onPanResponderMove: (_e, g) => {
          setDrag({ mode, dx: g.dx / (zoomScaleRef.current || 1), dy: g.dy / (zoomScaleRef.current || 1) });
        },
        onPanResponderRelease: (_e, g) => {
          const moved = Math.abs(g.dx) > TAP_MAX_MOVEMENT || Math.abs(g.dy) > TAP_MAX_MOVEMENT;
          if (mode === 'move' && !moved) {
            handleTap();
            setDrag(null);
            return;
          }
          commit(mode, g.dx, g.dy);
        },
        onPanResponderTerminate: (_e, g) => commit(mode, g.dx, g.dy),
      })
    ).current;
  }

  function handleTap() {
    const t = toolRef.current;
    const { onEdit, onDelete, onSelect } = callbacksRef.current;
    if (t === 'edit') onEdit();
    else if (t === 'delete') onDelete();
    else if (t === 'resize') onSelect();
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
  const showHandles = tool === 'resize' && selected;

  return (
    <React.Fragment>
      <View
        {...moveResponder.panHandlers}
        style={[
          styles.field,
          {
            left, top, width, height,
            borderColor: selected ? colors.primary : colors.primaryLight,
            backgroundColor: selected ? 'rgba(37, 99, 235, 0.14)' : 'rgba(37, 99, 235, 0.08)',
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
      </View>

      {showHandles &&
        ([
          { mode: 'tl' as Mode, responder: tlResponder, top: -handleHalf, left: -handleHalf },
          { mode: 'tr' as Mode, responder: trResponder, top: -handleHalf, left: width - handleHalf },
          { mode: 'bl' as Mode, responder: blResponder, top: height - handleHalf, left: -handleHalf },
          { mode: 'br' as Mode, responder: brResponder, top: height - handleHalf, left: width - handleHalf },
        ] as const).map(({ mode, responder, top: handleTop, left: handleLeft }) => (
          <View
            key={mode}
            {...responder.panHandlers}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            style={[
              styles.resizeHandle,
              {
                left: left + handleLeft, top: top + handleTop,
                width: handleVisualSize, height: handleVisualSize, borderRadius: handleVisualSize / 2,
                backgroundColor: colors.white, borderColor: colors.primary,
              },
            ]}
          />
        ))}
    </React.Fragment>
  );
}

const styles = StyleSheet.create({
  field: { position: 'absolute', borderWidth: 1.5, borderRadius: FIELD_RADIUS, justifyContent: 'center', paddingHorizontal: 6 },
  label: { fontWeight: '600' },
  resizeHandle: { position: 'absolute', borderWidth: 2 },
});