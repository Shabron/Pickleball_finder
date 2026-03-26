import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Card from './common/Card';
import Avatar from './common/Avatar';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export interface SuggestedMatchData {
  id: string;
  name: string;
  level: string;
  distance: string;
  avatarUri?: string;
}

interface SuggestedMatchCardProps {
  match: SuggestedMatchData;
  onMatch?: () => void;
}

export default function SuggestedMatchCard({ match, onMatch }: SuggestedMatchCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Avatar name={match.name} uri={match.avatarUri} size={46} />
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{match.name}</Text>
          <View style={styles.levelRow}>
            <View style={styles.dot} />
            <Text style={styles.levelText}>Level {match.level}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.distanceText}>{match.distance} away</Text>
      
      <TouchableOpacity style={styles.matchButton} onPress={onMatch}>
        <Text style={styles.matchButtonText}>Match</Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: spacing.s,
    alignItems: 'center',
    padding: spacing.m,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  infoContainer: {
    marginLeft: spacing.s,
    flex: 1,
  },
  name: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary,
    marginRight: 4,
  },
  levelText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  distanceText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.m,
    alignSelf: 'flex-start',
  },
  matchButton: {
    width: '100%',
    paddingVertical: spacing.s,
    borderRadius: 20,
    backgroundColor: colors.primary, // Using solid color instead of gradient due to lib limitations
    alignItems: 'center',
  },
  matchButtonText: {
    ...typography.bodySmall,
    color: '#FFF',
    fontWeight: '700',
  },
});
