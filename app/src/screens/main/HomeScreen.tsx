import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ScrollView } from 'react-native';
import { Plus } from 'lucide-react-native';
import Header from '../../components/common/Header';
import PartnerPostCard, { PartnerPostData } from '../../components/PartnerPostCard';
import Dropdown from '../../components/common/Dropdown';
import FAB from '../../components/common/FAB';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const MOCK_POSTS: PartnerPostData[] = [
  {
    id: '1',
    name: 'Arthur S.',
    level: '3.0',
    timeAgo: '1 day ago',
    content: 'Looking for a mixed doubles partner for next Saturday morning at Riverside Courts.',
  },
  {
    id: '2',
    name: 'Betty L.',
    level: '3.5',
    timeAgo: '3 hours ago',
    content: 'Intermediate player seeking a regular Tuesday partner, 10 am. Open to all levels.',
  },
];

export default function HomeScreen() {
  const [location, setLocation] = useState('florida');

  const locationOptions = [
    { label: 'Florida (FL)', value: 'florida' },
    { label: 'California (CA)', value: 'california' },
    { label: 'Arizona (AZ)', value: 'arizona' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      
      <View style={styles.filterSection}>
        <View style={styles.locationContainer}>
          <Text style={styles.filterText}>Showing posts in:</Text>
          <View style={{ flex: 1, marginLeft: spacing.s }}>
            <Dropdown
              options={locationOptions}
              value={location}
              onSelect={setLocation}
              placeholder="Select Location"
            />
          </View>
        </View>
        
        {/* Simple mock slider UI */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrack}>
            <View style={styles.sliderFill} />
            <View style={styles.sliderThumb} />
          </View>
          <Text style={styles.distanceText}>Within 10 miles</Text>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Partner Posts</Text>
      </View>

      <FlatList
        data={MOCK_POSTS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <PartnerPostCard post={item} />
        )}
      />

      <FAB icon={<Plus color="#FFF" size={24} />} onPress={() => {}} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterSection: {
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    paddingBottom: spacing.s,
    backgroundColor: colors.primaryLight,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: spacing.m,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
    zIndex: 10,
  },
  filterText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.m, // to align with dropdown
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginRight: spacing.m,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    width: '40%',
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    left: '40%',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: colors.primary,
    marginLeft: -8,
  },
  distanceText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  listHeader: {
    paddingHorizontal: spacing.m,
    marginBottom: spacing.s,
  },
  listTitle: {
    ...typography.h2,
    color: colors.text,
  },
  listContainer: {
    paddingHorizontal: spacing.s,
    paddingBottom: 80, // For FAB
  },
});
