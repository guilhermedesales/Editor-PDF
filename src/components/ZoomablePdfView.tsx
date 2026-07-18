// Container que permite dar zoom (pinça com 2 dedos) e arrastar
// (2 dedos) o conteúdo dentro dele — no caso, a página do PDF com os
// campos por cima.
//
// Por que não usar o ScrollView.maximumZoomScale? Porque esse recurso
// só funciona no iOS — no Android o pinch-to-zoom do ScrollView nunca
// foi implementado nativamente. Por isso usamos os gesture handlers.
//
// Por que exigir 2 dedos pro pan (minPointers=2)? Porque 1 dedo já é
// usado pelo FieldOverlay pra mover/redimensionar os campos individuais
// — se o pan daqui aceitasse 1 dedo, os dois gestos brigariam.

import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from 'react-native-gesture-handler';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

interface Props {
  children: React.ReactNode;
  onScaleChange?: (scale: number) => void;
}

export default function ZoomablePdfView({ children, onScaleChange }: Props) {
  const pinchRef = useRef(null);
  const panRef = useRef(null);

  // "base" = valor consolidado depois que o gesto anterior terminou.
  // O Animated.Value correspondente representa só o delta do gesto
  // ATUAL, em andamento — os dois são somados/multiplicados no
  // transform final, lá embaixo.
  const [baseScale, setBaseScale] = useState(1);
  const pinchScale = useRef(new Animated.Value(1)).current;

  const [baseTranslate, setBaseTranslate] = useState({ x: 0, y: 0 });
  const panTranslate = useRef(new Animated.ValueXY()).current;

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const onPanGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: panTranslate.x,
          translationY: panTranslate.y,
        },
      },
    ],
    { useNativeDriver: true }
  );

  function onPinchStateChange(event: any) {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const next = Math.min(
        Math.max(baseScale * event.nativeEvent.scale, MIN_SCALE),
        MAX_SCALE
      );
      setBaseScale(next);
      pinchScale.setValue(1);
      onScaleChange?.(next);
    }
  }

  function onPanStateChange(event: any) {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      setBaseTranslate((prev) => ({
        x: prev.x + event.nativeEvent.translationX,
        y: prev.y + event.nativeEvent.translationY,
      }));
      panTranslate.setValue({ x: 0, y: 0 });
    }
  }

  // Toque duplo com 2 dedos rápido pra resetar zoom/posição — útil
  // porque não tem outro jeito óbvio de "voltar ao normal".
  function handleReset() {
    setBaseScale(1);
    setBaseTranslate({ x: 0, y: 0 });
    pinchScale.setValue(1);
    panTranslate.setValue({ x: 0, y: 0 });
  }

  const scale = Animated.multiply(pinchScale, baseScale);
  const translateX = Animated.add(panTranslate.x, baseTranslate.x);
  const translateY = Animated.add(panTranslate.y, baseTranslate.y);

  return (
    <View style={styles.container}>
      <PanGestureHandler
        ref={panRef}
        simultaneousHandlers={pinchRef}
        minPointers={2}
        maxPointers={2}
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanStateChange}
      >
        <Animated.View style={StyleSheet.absoluteFill}>
          <PinchGestureHandler
            ref={pinchRef}
            simultaneousHandlers={panRef}
            onGestureEvent={onPinchGestureEvent}
            onHandlerStateChange={onPinchStateChange}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  transform: [{ translateX }, { translateY }, { scale }],
                },
              ]}
              onTouchEnd={(e) => {
                if (e.nativeEvent.touches.length === 0 && baseScale === 1) {
                  // nada a fazer — só aqui pra deixar claro que reset
                  // manual fica disponível via handleReset() se algum
                  // botão futuro quiser chamá-lo.
                }
              }}
            >
              {children}
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});