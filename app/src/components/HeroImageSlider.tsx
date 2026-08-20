/**
 * HeroImageSlider — Auto-advancing image carousel with dot indicators
 *
 * Cycles through a fixed set of local images, swipeable and auto-advancing
 * (senior-friendly: dots always visible, swipe isn't required to see all
 * images). Fills its parent container — the caller controls size/shape.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Image, FlatList, StyleSheet, NativeSyntheticEvent, NativeScrollEvent, ImageSourcePropType } from 'react-native';

interface HeroImageSliderProps {
  images: ImageSourcePropType[];
  intervalMs?: number;
}

export default function HeroImageSlider({ images, intervalMs = 4000 }: HeroImageSliderProps) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!width || images.length <= 1) return;
    const timer = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % images.length;
      flatListRef.current?.scrollToOffset({ offset: indexRef.current * width, animated: true });
      setActiveIndex(indexRef.current);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [width, images.length, intervalMs]);

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    indexRef.current = idx;
    setActiveIndex(idx);
  };

  return (
    <View style={styles.container} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <FlatList
          ref={flatListRef}
          data={images}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          renderItem={({ item }) => <Image source={item} style={{ width, height: '100%' }} resizeMode="cover" />}
        />
      )}

      {images.length > 1 && (
        <View style={styles.dotsRow} pointerEvents="none">
          {images.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === activeIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
