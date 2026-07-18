// Modal de zoom: mostra UMA página em tela cheia com pinça pra zoom e
// arrastar (via ZoomablePdfView, já com limites pra não deixar a
// página escapar da tela). Aberto com duplo toque numa página do
// leitor contínuo.

import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image } from 'react-native';
import { X } from 'lucide-react-native';
import { spacing, typography } from '../constants/theme';
import ZoomablePdfView from './ZoomablePdfView';

interface Props {
  visible: boolean;
  imageUri: string | null;
  pageNumber: number;
  pageCount: number;
  onClose: () => void;
}

export default function PdfZoomModal({ visible, imageUri, pageNumber, pageCount, onClose }: Props) {
  if (!visible || !imageUri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.closeButton} onPress={onClose} hitSlop={10}>
          <X size={22} color="#fff" />
        </Pressable>
        <Text style={styles.pageLabel}>{pageNumber} de {pageCount} · toque fora ou no X pra fechar</Text>
        {/* key força reiniciar o zoom sempre que a página muda */}
        <ZoomablePdfView key={pageNumber}>
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        </ZoomablePdfView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
  closeButton: {
    position: 'absolute', top: 48, right: spacing.md, zIndex: 10,
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  pageLabel: {
    position: 'absolute', top: 56, left: 0, right: 0, textAlign: 'center',
    color: '#fff', fontSize: 12, fontWeight: '600', zIndex: 5, paddingHorizontal: spacing.lg,
  },
  image: { width: '100%', height: '100%' },
});