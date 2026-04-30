/**
 * Avatar — User avatar with initials fallback
 *
 * Theme-aware colors with optional online status indicator.
 */
import React from 'react';
import { View, Image, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface AvatarProps {
  uri?: string;
  name: string;
  size?: number;
  style?: ViewStyle;
  /** Show green online dot */
  showOnline?: boolean;
}

export default function Avatar({ uri, name, size = 56, style, showOnline }: AvatarProps) {
  const { colors, typography } = useTheme();

  const getInitials = (nameStr: string): string => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nameStr.substring(0, 1).toUpperCase();
  };

  const dotSize = Math.max(12, size * 0.2);

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.primaryContainer,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          <Text
            style={[
              typography.titleMedium,
              { 
                fontSize: size * 0.4, 
                color: colors.onPrimaryContainer,
                textAlign: 'center',
                textAlignVertical: 'center',
                lineHeight: size,
              },
            ]}
          >
            {getInitials(name)}
          </Text>
        )}
      </View>

      {showOnline && (
        <View
          style={[
            styles.onlineDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: colors.success,
              borderColor: colors.surfaceContainerLowest,
              borderWidth: 2,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  onlineDot: {
    position: 'absolute',
  },
});
