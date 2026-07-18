// Container que permite dar zoom (pinça com 2 dedos) e arrastar
// (2 dedos) o conteúdo dentro dele.
//
// Implementado com PanResponder + Animated (API nativa do React Native),
// sem depender de react-native-gesture-handler nem react-native-reanimated.
// Isso evita a exigência de módulos nativos que não funcionam no Expo Go.

import React, { useRef } from 'react';
import { StyleSheet, View, PanResponder, Animated } from 'react-native';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

interface Props {
  children: React.ReactNode;
  onScaleChange?: (scale: number) => void;
}

function getDistance(touches: any[]) {
  const [a, b] = touches;
  const dx = a.pageX - b.pageX;
  const dy = a.pageY - b.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getMidpoint(touches: any[]) {
  const [a, b] = touches;
  return {
    x: (a.pageX + b.pageX) / 2,
    y: (a.pageY + b.pageY) / 2,
  };
}

export default function ZoomablePdfView({ children, onScaleChange }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const currentScale = useRef(1);
  const savedScale = useRef(1);
  const currentTranslateX = useRef(0);
  const currentTranslateY = useRef(0);
  const savedTranslateX = useRef(0);
  const savedTranslateY = useRef(0);

  const initialDistance = useRef(0);
  const initialMidpoint = useRef({ x: 0, y: 0 });

  // Precisamos ouvir os valores animados pra saber o total acumulado,
  // já que Animated.Value não expõe o valor atual diretamente.
  useRef(
    scale.addListener(({ value }) => {
      currentScale.current = value;
    })
  );
  useRef(
    translateX.addListener(({ value }) => {
      currentTranslateX.current = value;
    })
  );
  useRef(
    translateY.addListener(({ value }) => {
      currentTranslateY.current = value;
    })
  );

  const panResponder = useRef(
    PanResponder.create({
        onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
        onStartShouldSetPanResponderCapture: () => false, // não captura antes dos filhos decidirem
        onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
        onMoveShouldSetPanResponderCapture: () => false,

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          initialDistance.current = getDistance(touches);
          initialMidpoint.current = getMidpoint(touches);
          savedScale.current = currentScale.current;
          savedTranslateX.current = currentTranslateX.current;
          savedTranslateY.current = currentTranslateY.current;
        }
      },

      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length !== 2) return;

        // Pinça -> escala
        const distance = getDistance(touches);
        const rawScale = savedScale.current * (distance / initialDistance.current);
        const nextScale = Math.min(Math.max(rawScale, MIN_SCALE), MAX_SCALE);
        scale.setValue(nextScale);

        // Deslocamento dos 2 dedos -> translate
        const midpoint = getMidpoint(touches);
        const dx = midpoint.x - initialMidpoint.current.x;
        const dy = midpoint.y - initialMidpoint.current.y;
        translateX.setValue(savedTranslateX.current + dx);
        translateY.setValue(savedTranslateY.current + dy);
      },

      onPanResponderRelease: () => {
        savedScale.current = currentScale.current;
        savedTranslateX.current = currentTranslateX.current;
        savedTranslateY.current = currentTranslateY.current;
        onScaleChange?.(currentScale.current);
      },

      onPanResponderTerminate: () => {
        savedScale.current = currentScale.current;
        savedTranslateX.current = currentTranslateX.current;
        savedTranslateY.current = currentTranslateY.current;
        onScaleChange?.(currentScale.current);
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.content,
          {
            transform: [
              { translateX },
              { translateY },
              { scale },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
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