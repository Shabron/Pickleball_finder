import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Search } from 'lucide-react-native';
import Header from '../../components/common/Header';
import SuggestedMatchCard, { SuggestedMatchData } from '../../components/SuggestedMatchCard';
import FAB from '../../components/common/FAB';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const MOCK_MATCHES: SuggestedMatchData[] = [
  { id: '1', name: 'Arthur S.', level: '3.0', distance: '1.2 miles' },
  { id: '2', name: 'Betty L.', level: '3.5', distance: '2.5 miles' },
  { id: '3', name: 'Clara M.', level: '2.5', distance: '0.8 miles' },
  { id: '4', name: 'David K.', level: '4.0', distance: '3.1 miles' },
];

export default function SearchScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>MatchMaking</Text>
          <Text style={styles.sectionSubtitle}>Find Your Nearest Players</Text>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 37.78825,
              longitude: -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker coordinate={{ latitude: 37.78825, longitude: -122.4324 }} title="You" pinColor={colors.secondary} />
            <Marker coordinate={{ latitude: 37.79825, longitude: -122.4424 }} title="Player" />
            <Marker coordinate={{ latitude: 37.77825, longitude: -122.4224 }} title="Player" />
          </MapView>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Suggested Matches</Text>
        </View>

        <View style={styles.matchesGrid}>
          {MOCK_MATCHES.map((match) => (
            <View key={match.id} style={styles.gridItem}>
              <SuggestedMatchCard match={match} />
            </View>
          ))}
        </View>
      </ScrollView>

      <FAB icon={<Search color="#FFF" size={24} />} onPress={() => {}} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.m,
    paddingBottom: 80,
  },
  sectionHeader: {
    marginBottom: spacing.m,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  liveBadge: {
    position: 'absolute',
    top: spacing.s,
    left: spacing.s,
    backgroundColor: '#FFF',
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 4,
  },
  liveText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text,
  },
  matchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  gridItem: {
    width: '50%',
    padding: spacing.xs,
    marginBottom: spacing.s,
  },
});
