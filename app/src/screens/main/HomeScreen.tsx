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
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { Plus } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import PartnerPostCard, { PartnerPostData } from '../../components/PartnerPostCard';
import Dropdown from '../../components/common/Dropdown';
import FAB from '../../components/common/FAB';
import Slider from '../../components/common/Slider';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';

const US_STATES = [
  { label: 'Alabama', value: 'AL' }, { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' }, { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' }, { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' }, { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' }, { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' }, { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' }, { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' }, { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' }, { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' }, { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' }, { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' }, { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' }, { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' }, { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' }, { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' }, { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' }, { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' }, { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' }, { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' }, { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' }, { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' }, { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' }, { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' }, { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' }, { label: 'Wyoming', value: 'WY' },
  { label: 'District of Columbia', value: 'DC' },
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
  const [distance, setDistance] = useState(10);
  const { colors, typography } = useTheme();

  return (
    <ScreenWrapper backgroundColor="#EAF4FC">
      <Header
        showLogo
        showNotificationBell
        notificationCount={3}
        onNotificationPress={() => navigation.navigate('Notifications')}
        style={{ backgroundColor: 'transparent' }}
      />
      


      {/* ─── Filter Section ─── */}
      <View
        style={[
          styles.filterSection,
          { backgroundColor: '#FFFFFF' },
        ]}
      >
        <Text
          style={[typography.labelLarge, { color: colors.onSurfaceVariant, marginBottom: spacing.sm }]}
        >
          Showing posts in:
        </Text>
        <Dropdown
          options={US_STATES}
          value={location}
          onSelect={setLocation}
          placeholder="Select State"
        />

        {/* Distance indicator */}
        <Slider
          min={1}
          max={50}
          value={distance}
          onValueChange={setDistance}
          label={`Within ${distance} mi`}
        />
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
        icon={<Text style={{ fontSize: 24 }}>🏓</Text>}
        onPress={() => navigation.navigate('CreatePost')}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  heroLogoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  heroLogo: {
    width: 280,
    height: 160,
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    marginBottom: spacing.lg,
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
