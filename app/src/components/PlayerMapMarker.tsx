/**
 * PlayerMapMarker — Custom map pin for Matchmaking screen
 *
 * Renders a circular avatar (initials or photo) with a colored ring
 * and a name label. Tap triggers a Callout with player details.
 */
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { useTheme } from '../theme/ThemeContext';
import { borderRadius, spacing } from '../theme/spacing';

export interface PlayerMarkerData {
  id: string;
  name: string;
  level: string;
  distance: string;
  coordinate: { latitude: number; longitude: number };
  avatarUri?: string;
  /** If true, renders as the "You" pin with tertiary color */
  isCurrentUser?: boolean;
}

interface PlayerMapMarkerProps {
  player: PlayerMarkerData;
  onPress?: (player: PlayerMarkerData) => void;
}

export default function PlayerMapMarker({ player, onPress }: PlayerMapMarkerProps) {
  const { colors, typography } = useTheme();

  const initials = (() => {
    const parts = player.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return player.name.substring(0, 2).toUpperCase();
  })();

  const pinColor = player.isCurrentUser ? colors.tertiary : colors.primary;
  const pinBg = player.isCurrentUser ? colors.tertiaryContainer : colors.primaryContainer;
  const pinText = player.isCurrentUser ? colors.onTertiaryContainer : colors.onPrimaryContainer;

  return (
    <Marker
      coordinate={player.coordinate}
      onPress={() => onPress?.(player)}
      tracksViewChanges={false}
    >
      {/* Custom pin view */}
      <View style={styles.markerWrapper}>
        <View
          style={[
            styles.avatarRing,
            { borderColor: pinColor },
          ]}
        >
          <View style={[styles.avatarInner, { backgroundColor: pinBg }]}>
            {player.avatarUri ? (
              <Image
                source={{ uri: player.avatarUri }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={[typography.labelMedium, { color: pinText, fontSize: 13, fontWeight: '700' }]}>
                {initials}
              </Text>
            )}
          </View>
        </View>
        {/* Pointy tail */}
        <View style={[styles.tail, { borderTopColor: pinColor }]} />
        <Text
          numberOfLines={1}
          style={[
            typography.labelSmall,
            styles.nameLabel,
            { color: colors.onSurface, backgroundColor: colors.surfaceContainerLowest },
          ]}
        >
          {player.isCurrentUser ? 'You' : player.name.split(' ')[0]}
        </Text>
      </View>

      {/* Callout popup on tap */}
      <Callout tooltip>
        <View style={[styles.callout, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
          <Text style={[typography.titleSmall, { color: colors.onSurface }]}>{player.name}</Text>
          <View style={[styles.calloutBadge, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[typography.labelSmall, { color: colors.onPrimaryContainer }]}>
              Level {player.level}
            </Text>
          </View>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
            📍 {player.distance}
          </Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerWrapper: {
    alignItems: 'center',
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    padding: 2,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  nameLabel: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    fontSize: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  callout: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  calloutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    marginTop: 4,
  },
});
