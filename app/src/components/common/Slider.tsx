import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, LayoutChangeEvent } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme/spacing';

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onValueChange: (val: number) => void;
  label?: string;
}

export default function Slider({ min, max, value, onValueChange, label }: SliderProps) {
  const { colors, typography } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  // Convert value to percentage string
  const getPercent = (val: number) => {
    return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
         const { locationX } = evt.nativeEvent;
         updateValueFromX(locationX);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Find x coordinate relative to the track
        const x = gestureState.moveX - trackX.current;
        updateValueFromX(x);
      },
    })
  ).current;

  const trackX = useRef(0);

  const updateValueFromX = (x: number) => {
    if (trackWidth === 0) return;
    const clampedX = Math.max(0, Math.min(x, trackWidth));
    const percent = clampedX / trackWidth;
    const newValue = Math.round(min + percent * (max - min));
    onValueChange(newValue);
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
    // Note: To get accurate global X, you'd ideally use measure(), but for simplicity
    // we assume the moveX is roughly comparable if we calculate offset.
    // Instead of complex absolute measuring, let's use a simpler drag logic based on dx
  };

  // Improved simpler sliding logic uses accumulated dragged distance
  const currentValRef = useRef(value);
  currentValRef.current = value;

  const improvedPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
         
      },
      onPanResponderMove: (evt, gestureState) => {
        if (trackWidth === 0) return;
        // Calculate raw new value based on dx
        const deltaPercent = gestureState.dx / trackWidth;
        const deltaValue = deltaPercent * (max - min);
        // We shouldn't mutate state infinitely. The simple approach:
        // Use a base value at start of gesture
      },
    })
  ).current;

  // Final functioning slider code
  const valStart = useRef(value);
  const bestPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        valStart.current = currentValRef.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (trackWidth === 0) return;
        const deltaPercent = gestureState.dx / trackWidth;
        const deltaValue = deltaPercent * (max - min);
        let newVal = Math.round(valStart.current + deltaValue);
        newVal = Math.max(min, Math.min(max, newVal));
        onValueChange(newVal);
      },
    })
  ).current;

  const percentStr = `${getPercent(value)}%`;

  return (
    <View style={styles.container}>
      <View
        style={styles.hitSlopArea}
        onLayout={handleLayout}
        {...bestPan.panHandlers}
      >
        <View style={[styles.trackInner, { backgroundColor: colors.outlineVariant + '40' }]} />
        <View style={[styles.fill, { backgroundColor: colors.primary, width: percentStr }]} />
        <View
          style={[
            styles.thumb,
            {
              left: percentStr,
              backgroundColor: colors.surfaceContainerLowest,
              borderColor: colors.primary,
            },
          ]}
        />
      </View>
      {label && (
        <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginLeft: 16 }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    height: 32, // More compact container
  },
  hitSlopArea: {
    flex: 1,
    height: 32,
    justifyContent: 'center', // Distribute inner lines
    position: 'relative',
  },
  trackInner: {
    width: '100%',
    height: 4,
    borderRadius: 2,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
    top: 14, // (32 - 4) / 2
  },
  thumb: {
    position: 'absolute',
    width: 20, // Smaller thumb
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginLeft: -10, // Half width
    top: 6, // (32 - 20) / 2
  },
});
