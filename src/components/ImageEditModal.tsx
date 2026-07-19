// Editor simples de imagem antes de virar página de PDF: rotacionar em
// passos de 90° e recortar com um retângulo arrastável sobre a imagem.
// Usa expo-image-manipulator pra aplicar as transformações de verdade
// nos pixels (não é só um efeito visual).

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image, PanResponder, ActivityIndicator, Dimensions } from 'react-native';
import { X, RotateCw, Check, Crop as CropIcon, RotateCcw as ResetIcon } from 'lucide-react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { spacing, radius, typography } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';

interface Props {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
  onSave: (newUri: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CANVAS_SIZE = SCREEN_WIDTH - spacing.md * 2;
const HANDLE_SIZE = 26;

export default function ImageEditModal({ visible, uri, onClose, onSave }: Props) {
  const { colors } = useThemeStore();
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [imgSize, setImgSize] = useState({ width: 1, height: 1 });
  const [cropMode, setCropMode] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Retângulo de corte em coordenadas de TELA (dentro do canvas exibido).
  const [rect, setRect] = useState({ x: 0, y: 0, width: CANVAS_SIZE, height: CANVAS_SIZE });
  const dragStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const displayWidth = CANVAS_SIZE;
  const displayHeight = imgSize.width ? (CANVAS_SIZE * imgSize.height) / imgSize.width : CANVAS_SIZE;

  function resetForNewImage(w: number, h: number) {
    setImgSize({ width: w, height: h });
    const dh = (CANVAS_SIZE * h) / w;
    setRect({ x: 0, y: 0, width: CANVAS_SIZE, height: dh });
    setRotation(0);
    setCropMode(false);
  }

  React.useEffect(() => {
    if (visible && uri) {
      Image.getSize(uri, (w, h) => resetForNewImage(w, h), () => resetForNewImage(1, 1));
    }
  }, [visible, uri]);

  function makeCornerResponder(corner: 'tl' | 'tr' | 'bl' | 'br') {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStart.current = { ...rect };
      },
      onPanResponderMove: (_evt, g) => {
        setRect((prev) => {
          let { x, y, width, height } = dragStart.current;
          if (corner === 'br') { width = Math.max(40, dragStart.current.width + g.dx); height = Math.max(40, dragStart.current.height + g.dy); }
          if (corner === 'bl') { width = Math.max(40, dragStart.current.width - g.dx); x = dragStart.current.x + g.dx; height = Math.max(40, dragStart.current.height + g.dy); }
          if (corner === 'tr') { width = Math.max(40, dragStart.current.width + g.dx); height = Math.max(40, dragStart.current.height - g.dy); y = dragStart.current.y + g.dy; }
          if (corner === 'tl') { width = Math.max(40, dragStart.current.width - g.dx); x = dragStart.current.x + g.dx; height = Math.max(40, dragStart.current.height - g.dy); y = dragStart.current.y + g.dy; }
          x = Math.max(0, Math.min(x, displayWidth - 40));
          y = Math.max(0, Math.min(y, displayHeight - 40));
          width = Math.min(width, displayWidth - x);
          height = Math.min(height, displayHeight - y);
          return { x, y, width, height };
        });
      },
    });
  }

  const tl = useRef(makeCornerResponder('tl')).current;
  const tr = useRef(makeCornerResponder('tr')).current;
  const bl = useRef(makeCornerResponder('bl')).current;
  const br = useRef(makeCornerResponder('br')).current;

  function handleRotate() {
    setRotation((r) => (r + 90) % 360);
  }

  function handleResetCrop() {
    setRect({ x: 0, y: 0, width: displayWidth, height: displayHeight });
  }

  async function handleConfirm() {
    if (!uri) return;
    setProcessing(true);
    try {
      const actions: ImageManipulator.Action[] = [];

      if (cropMode) {
        // Converte retângulo de TELA pra coordenadas reais da imagem
        // (a imagem pode ter sido exibida menor/maior que o tamanho real).
        const scaleX = imgSize.width / displayWidth;
        const scaleY = imgSize.height / displayHeight;
        actions.push({
          crop: {
            originX: Math.round(rect.x * scaleX),
            originY: Math.round(rect.y * scaleY),
            width: Math.round(rect.width * scaleX),
            height: Math.round(rect.height * scaleY),
          },
        });
      }

      if (rotation !== 0) {
        actions.push({ rotate: rotation });
      }

      if (actions.length === 0) {
        onSave(uri);
        onClose();
        return;
      }

      const result = await ImageManipulator.manipulateAsync(uri, actions, {
        compress: 0.92,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      onSave(result.uri);
      onClose();
    } catch (err) {
      // Se der erro, mantém a imagem original em vez de travar o fluxo
      onSave(uri);
      onClose();
    } finally {
      setProcessing(false);
    }
  }

  if (!uri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.white }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.neutral }]}>Editar Imagem</Text>
            <Pressable onPress={onClose} hitSlop={8} style={[styles.closeButton, { backgroundColor: colors.tertiary }]}>
              <X size={18} color={colors.secondary} />
            </Pressable>
          </View>

          <View style={[styles.canvas, { width: displayWidth, height: displayHeight }]}>
            <Image
              source={{ uri }}
              style={{ width: displayWidth, height: displayHeight, transform: [{ rotate: `${rotation}deg` }] }}
              resizeMode="contain"
            />

            {cropMode && (
              <>
                <View pointerEvents="none" style={[styles.dimOverlay, { top: 0, height: rect.y, width: displayWidth }]} />
                <View pointerEvents="none" style={[styles.dimOverlay, { top: rect.y + rect.height, height: displayHeight - rect.y - rect.height, width: displayWidth }]} />
                <View pointerEvents="none" style={[styles.dimOverlay, { top: rect.y, left: 0, width: rect.x, height: rect.height }]} />
                <View pointerEvents="none" style={[styles.dimOverlay, { top: rect.y, left: rect.x + rect.width, width: displayWidth - rect.x - rect.width, height: rect.height }]} />

                <View pointerEvents="none" style={[styles.cropBorder, { left: rect.x, top: rect.y, width: rect.width, height: rect.height, borderColor: colors.primary }]} />

                {[
                  { corner: 'tl' as const, responder: tl, left: rect.x - HANDLE_SIZE / 2, top: rect.y - HANDLE_SIZE / 2 },
                  { corner: 'tr' as const, responder: tr, left: rect.x + rect.width - HANDLE_SIZE / 2, top: rect.y - HANDLE_SIZE / 2 },
                  { corner: 'bl' as const, responder: bl, left: rect.x - HANDLE_SIZE / 2, top: rect.y + rect.height - HANDLE_SIZE / 2 },
                  { corner: 'br' as const, responder: br, left: rect.x + rect.width - HANDLE_SIZE / 2, top: rect.y + rect.height - HANDLE_SIZE / 2 },
                ].map(({ corner, responder, left, top }) => (
                  <View
                    key={corner}
                    {...responder.panHandlers}
                    hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                    style={[styles.handle, { left, top, backgroundColor: colors.primary }]}
                  />
                ))}
              </>
            )}
          </View>

          <View style={styles.toolsRow}>
            <Pressable style={[styles.toolButton, { backgroundColor: colors.tertiary }]} onPress={handleRotate}>
              <RotateCw size={18} color={colors.neutral} />
              <Text style={[styles.toolButtonText, { color: colors.neutral }]}>Girar</Text>
            </Pressable>
            <Pressable
              style={[styles.toolButton, { backgroundColor: cropMode ? colors.primaryLight : colors.tertiary }]}
              onPress={() => setCropMode((v) => !v)}
            >
              <CropIcon size={18} color={cropMode ? colors.primary : colors.neutral} />
              <Text style={[styles.toolButtonText, { color: cropMode ? colors.primary : colors.neutral }]}>Cortar</Text>
            </Pressable>
            {cropMode && (
              <Pressable style={[styles.toolButton, { backgroundColor: colors.tertiary }]} onPress={handleResetCrop}>
                <ResetIcon size={18} color={colors.neutral} />
                <Text style={[styles.toolButtonText, { color: colors.neutral }]}>Resetar</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            style={[styles.confirmButton, { backgroundColor: colors.primary, opacity: processing ? 0.6 : 1 }]}
            onPress={handleConfirm}
            disabled={processing}
          >
            {processing ? <ActivityIndicator color="#fff" /> : (
              <>
                <Check size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Aplicar</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  card: { width: '100%', borderRadius: radius.lg, padding: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontSize: 17, fontWeight: '700' },
  closeButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  canvas: { alignSelf: 'center', backgroundColor: '#000', overflow: 'hidden', position: 'relative' },
  dimOverlay: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.55)' },
  cropBorder: { position: 'absolute', borderWidth: 2 },
  handle: { position: 'absolute', width: HANDLE_SIZE, height: HANDLE_SIZE, borderRadius: HANDLE_SIZE / 2, borderWidth: 3, borderColor: '#fff' },
  toolsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  toolButton: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: radius.md },
  toolButtonText: { fontWeight: '700', fontSize: typography.label },
  confirmButton: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.md, marginTop: spacing.md },
  confirmButtonText: { color: '#fff', fontWeight: '700' },
});