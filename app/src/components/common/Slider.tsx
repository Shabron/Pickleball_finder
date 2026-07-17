import React, { useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onValueChange: (val: number) => void;
  label?: string;
  activeColor?: string;
}

export default function Slider({ min, max, value, onValueChange, label, activeColor: activeColorProp }: SliderProps) {
  const { colors, typography } = useTheme();
  const activeColor = activeColorProp || colors.primary;

  const getPercent = (val: number) => {
    return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
  };

  const currentValRef = useRef(value);
  currentValRef.current = value;
  const valStart = useRef(value);
  const trackWidthRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        valStart.current = currentValRef.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (trackWidthRef.current === 0) return;
        const deltaPercent = gestureState.dx / trackWidthRef.current;
        const deltaValue = deltaPercent * (max - min);
        let newVal = Math.round(valStart.current + deltaValue);
        newVal = Math.max(min, Math.min(max, newVal));
        onValueChange(newVal);
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  };

  const percentStr = `${getPercent(value)}%`;

  return (
    <View style={styles.container}>
      <View
        style={styles.hitSlopArea}
        collapsable={false}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <View style={[styles.trackInner, { backgroundColor: colors.outlineVariant + '40' }]} />
        <View style={[styles.fill, { backgroundColor: activeColor, width: percentStr as any }]} />
        <View
          style={[
            styles.thumb,
            {
              left: percentStr as any,
              backgroundColor: colors.surfaceContainerLowest,
              borderColor: activeColor,
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
    height: 32,
  },
  hitSlopArea: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
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
    top: 14,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginLeft: -10,
    top: 6,
  },
});
