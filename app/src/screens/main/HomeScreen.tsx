/**
 * HomeScreen — Posts & Location Filter
 *
 * Matches Stitch "Posts & Location Filter" design:
 * - Filter bar with state dropdown and distance slider
 * - Partner post cards with tonal layering
 * - FAB for creating new posts
 * - Responsive layout
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Plus } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import PartnerPostCard, { PartnerPostData } from '../../components/PartnerPostCard';
import Dropdown from '../../components/common/Dropdown';
import FAB from '../../components/common/FAB';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';

const LOCATION_OPTIONS = [
  { label: 'Florida', value: 'FL' },
  { label: 'California', value: 'CA' },
  { label: 'Arizona', value: 'AZ' },
  { label: 'Texas', value: 'TX' },
  { label: 'North Carolina', value: 'NC' },
];

const MOCK_POSTS: PartnerPostData[] = [
  {
    id: '1',
    name: 'Arthur S.',
    level: '3.0',
    timeAgo: '1 day ago',
    content: 'Looking for a mixed doubles partner for next Saturday morning at Riverside Courts. Intermediate level preferred!',
    playStyle: 'Doubles',
    location: 'Sarasota, FL',
  },
  {
    id: '2',
    name: 'Betty L.',
    level: '3.5',
    timeAgo: '3 hours ago',
    content: 'Intermediate player seeking a regular Tuesday partner, 10 am. Open to all levels.',
    playStyle: 'Any',
    location: 'Tampa, FL',
  },
  {
    id: '3',
    name: 'Walter K.',
    level: '4.0',
    timeAgo: '5 hours ago',
    content: 'Advanced player looking for competitive practice partners for weekend mornings.',
    playStyle: 'Singles',
    location: 'Miami, FL',
  },
];

export default function HomeScreen({ navigation }: any) {
  const [location, setLocation] = useState('FL');
  const { colors, typography } = useTheme();

  return (
    <ScreenWrapper>
      <Header
        showNotificationBell
        notificationCount={3}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      {/* ─── Filter Section ─── */}
      <View
        style={[
          styles.filterSection,
          { backgroundColor: colors.surfaceContainerLow },
        ]}
      >
        <Text
          style={[typography.labelLarge, { color: colors.onSurfaceVariant, marginBottom: spacing.sm }]}
        >
          Showing posts in:
        </Text>
        <Dropdown
          options={LOCATION_OPTIONS}
          value={location}
          onSelect={setLocation}
          placeholder="Select State"
        />

        {/* Distance indicator */}
        <View style={styles.distanceRow}>
          <View style={[styles.distanceTrack, { backgroundColor: colors.outlineVariant + '40' }]}>
            <View
              style={[
                styles.distanceFill,
                { backgroundColor: colors.primary, width: '40%' },
              ]}
            />
            <View
              style={[
                styles.distanceThumb,
                {
                  left: '40%',
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginLeft: spacing.md }]}>
            Within 10 mi
          </Text>
        </View>
      </View>

      {/* ─── Post List ─── */}
      <View style={styles.listHeader}>
        <Text style={[typography.titleLarge, { color: colors.onSurface }]}>
          Partner Posts
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
          {MOCK_POSTS.length} active posts
        </Text>
      </View>

      <FlatList
        data={MOCK_POSTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PartnerPostCard
            post={item}
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            onMessage={() => navigation.navigate('ChatThread')}
          />
        )}
      />

      <FAB
        icon={<Plus color={colors.surfaceContainerLowest} size={24} />}
        onPress={() => navigation.navigate('CreatePost')}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  filterSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  distanceTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  distanceFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    borderRadius: 2,
  },
  distanceThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    marginLeft: -9,
  },
  listHeader: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
});
