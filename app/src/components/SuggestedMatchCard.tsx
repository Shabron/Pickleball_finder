/**
 * SuggestedMatchCard — Match suggestion card with compatibility badge
 *
 * Displays potential partner with skill level, distance, and glassmorphic
 * "Partner Match" badge per Stitch design.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Card from './common/Card';
import Avatar from './common/Avatar';
import Badge from './common/Badge';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../theme/spacing';
import { MapPin } from 'lucide-react-native';

export interface SuggestedMatchData {
  id: string;
  name: string;
  level: string;
  distance: string;
  avatarUri?: string;
  matchScore?: number;
  playStyle?: string;
}

interface SuggestedMatchCardProps {
  match: SuggestedMatchData;
  onMatch?: () => void;
  onViewProfile?: () => void;
}

export default function SuggestedMatchCard({
  match,
  onMatch,
  onViewProfile,
}: SuggestedMatchCardProps) {
  const { colors, typography } = useTheme();

  return (
    <Card style={styles.card}>
      {/* Match compatibility badge */}
      {match.matchScore && match.matchScore >= 70 && (
        <View
          style={[
            styles.matchBadge,
            { backgroundColor: colors.primaryContainer + '99' },
          ]}
        >
          <Text style={[typography.labelSmall, { color: colors.onPrimaryContainer }]}>
            {match.matchScore}% Match
          </Text>
        </View>
      )}

      {/* Avatar + info */}
      <View style={styles.content}>
        <Avatar name={match.name} uri={match.avatarUri} size={sizes.avatarMedium} />

        <Text
          style={[typography.titleSmall, { color: colors.onSurface, marginTop: spacing.sm }]}
          numberOfLines={1}
        >
          {match.name}
        </Text>

        <Badge label={`Level ${match.level}`} variant="primary" size="small" style={{ marginTop: spacing.xs }} />

        <View style={styles.distanceRow}>
          <MapPin size={14} color={colors.onSurfaceVariant} />
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginLeft: 4 }]}>
            {match.distance}
          </Text>
        </View>

        {match.playStyle && (
          <Badge
            label={match.playStyle}
            variant="secondary"
            size="small"
            style={{ marginTop: spacing.xs }}
          />
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onViewProfile}
          style={[
            styles.actionBtn,
            { backgroundColor: colors.secondaryContainer },
          ]}
        >
          <Text style={[typography.labelMedium, { color: colors.onSecondaryContainer }]}>
            Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onMatch}
          style={[
            styles.actionBtn,
            { backgroundColor: colors.primary, marginLeft: spacing.xs },
          ]}
        >
          <Text style={[typography.labelMedium, { color: colors.surfaceContainerLowest }]}>
            Match
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    padding: spacing.lg,
    position: 'relative',
  },
  matchBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
