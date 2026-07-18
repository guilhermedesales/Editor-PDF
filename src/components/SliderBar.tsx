import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';

interface Props {
  value: number; // 0 a 1
  onChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  trackColor: string;
  fillColor: string;
  thumbColor: string;
  height?: number;
}

export default function SliderBar({ value, onChange, onSlidingComplete, trackColor, fillColor, thumbColor, height = 6 }: Props) {
  const widthRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  function handleLayout(e: LayoutChangeEvent) {
    widthRef.current = e.nativeEvent.layout.width;
  }

  function valueFromX(x: number) {
    const w = widthRef.current || 1;
    return Math.min(Math.max(x / w, 0), 1);
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setDragging(true);
        const v = valueFromX(evt.nativeEvent.locationX);
        setLocalValue(v);
        onChange(v);
      },
      onPanResponderMove: (evt) => {
        const v = valueFromX(evt.nativeEvent.locationX);
        setLocalValue(v);
        onChange(v);
      },
      onPanResponderRelease: (evt) => {
        const v = valueFromX(evt.nativeEvent.locationX);
        setLocalValue(v);
        setDragging(false);
        onSlidingComplete?.(v);
      },
      onPanResponderTerminate: () => setDragging(false),
    })
  ).current;

  const displayValue = dragging ? localValue : value;

  return (
    <View style={styles.wrapper} onLayout={handleLayout} {...panResponder.panHandlers} hitSlop={{ top: 12, bottom: 12 }}>
      <View style={[styles.track, { backgroundColor: trackColor, height }]}>
        <View style={[styles.fill, { backgroundColor: fillColor, height, width: `${displayValue * 100}%` }]} />
      </View>
      <View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            backgroundColor: thumbColor,
            left: `${displayValue * 100}%`,
            transform: [{ translateX: -9 }, { scale: dragging ? 1.15 : 1 }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { justifyContent: 'center', paddingVertical: 10 },
  track: { borderRadius: 999, overflow: 'hidden', width: '100%' },
  fill: { borderRadius: 999 },
  thumb: {
    position: 'absolute', width: 18, height: 18, borderRadius: 9,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2,
  },
});