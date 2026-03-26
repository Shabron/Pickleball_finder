import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { MoreVertical, Plus } from 'lucide-react-native';
import Header from '../../components/common/Header';
import PartnerPostCard, { PartnerPostData } from '../../components/PartnerPostCard';
import FAB from '../../components/common/FAB';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const MY_POSTS: PartnerPostData[] = [
  {
    id: '1',
    name: 'Arthur S.',
    level: '3.0',
    timeAgo: 'Just now',
    content: 'Looking for a mixed doubles partner for next Saturday morning at Riverside Courts.',
  },
  {
    id: '2',
    name: 'Arthur S.',
    level: '3.0',
    timeAgo: '2 days ago',
    content: 'My Singles Post: Casual Level 3.0 play. (Sarasota Area)',
  },
];

export default function MyPostsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      
      <View style={styles.headerContainer}>
        <Text style={styles.title}>My Posts ({MY_POSTS.length} Active)</Text>
      </View>

      <FlatList
        data={MY_POSTS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.postWrapper}>
            <View style={styles.postTypeWarning}>
               <Text style={styles.postTypeText}>Looking for: {item.name}</Text>
               <TouchableOpacity style={styles.manageButton}>
                 <Text style={styles.manageButtonText}>Manage My Post</Text>
               </TouchableOpacity>
            </View>
            <PartnerPostCard post={item} />
          </View>
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
  headerContainer: {
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    paddingBottom: spacing.s,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  listContainer: {
    paddingHorizontal: spacing.s,
    paddingBottom: 80,
  },
  postWrapper: {
    marginBottom: spacing.m,
    position: 'relative',
  },
  postTypeWarning: {
    backgroundColor: '#D6EAF8',
    padding: spacing.s,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -10, // overlap visually with card below
    zIndex: 1,
  },
  postTypeText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  manageButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  manageButtonText: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: '600',
  },
});
