/**
 * SearchScreen — MatchMaking
 *
 * Matches Stitch "MatchMaking" design:
 * - Map with player markers and live badge
 * - Grid of suggested matches with compatibility badges
 * - "Send Match Request" action
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import SuggestedMatchCard, { SuggestedMatchData } from '../../components/SuggestedMatchCard';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';

const MOCK_MATCHES: SuggestedMatchData[] = [
  { id: '1', name: 'Arthur S.', level: '3.0', distance: '1.2 mi', matchScore: 92, playStyle: 'Doubles' },
  { id: '2', name: 'Betty L.', level: '3.5', distance: '2.5 mi', matchScore: 85, playStyle: 'Singles' },
  { id: '3', name: 'Clara M.', level: '2.5', distance: '0.8 mi', matchScore: 78, playStyle: 'Any' },
  { id: '4', name: 'David K.', level: '4.0', distance: '3.1 mi', matchScore: 65, playStyle: 'Doubles' },
];

export default function SearchScreen({ navigation }: any) {
  const { colors, typography } = useTheme();

  return (
    <ScreenWrapper>
      <Header title="MatchMaking" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ─── */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.headlineSmall, { color: colors.onSurface }]}>
            Find Your Nearest Players
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.xs }]}>
            Based on your location and skill level
          </Text>
        </View>

        {/* ─── Map ─── */}
        <View style={[styles.mapContainer, { backgroundColor: colors.surfaceContainerHigh }]}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 37.78825,
              longitude: -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{ latitude: 37.78825, longitude: -122.4324 }}
              title="You"
              pinColor={colors.tertiary}
            />
            <Marker
              coordinate={{ latitude: 37.79825, longitude: -122.4424 }}
              title="Arthur S."
            />
            <Marker
              coordinate={{ latitude: 37.77825, longitude: -122.4224 }}
              title="Betty L."
            />
          </MapView>

          {/* LIVE badge */}
          <View
            style={[
              styles.liveBadge,
              { backgroundColor: colors.surfaceContainerLowest },
            ]}
          >
            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
            <Text style={[typography.labelSmall, { color: colors.onSurface }]}>LIVE</Text>
          </View>
        </View>

        {/* ─── Suggested Matches ─── */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.titleLarge, { color: colors.onSurface }]}>
            Your Suggested Matches
          </Text>
        </View>

        <View style={styles.matchesGrid}>
          {MOCK_MATCHES.map((match) => (
            <View key={match.id} style={styles.gridItem}>
              <SuggestedMatchCard
                match={match}
                onMatch={() => {}}
                onViewProfile={() => navigation.navigate('UserProfile', { userId: match.id })}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  sectionHeader: {
    marginBottom: spacing.lg,
  },
  mapContainer: {
    height: 220,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  liveBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  matchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  gridItem: {
    width: '50%',
    padding: spacing.xs,
  },
});
