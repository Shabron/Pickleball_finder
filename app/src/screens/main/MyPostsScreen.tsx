/**
 * MyPostsScreen — User's own posts management
 *
 * Shows user's active/closed posts with management actions.
 * Uses tonal layering, themed components, no border dividers.
 */
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Plus, Edit2, Trash2 } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import FAB from '../../components/common/FAB';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

interface MyPost {
  id: string;
  title: string;
  content: string;
  status: 'Open' | 'Closed';
  timeAgo: string;
  responseCount: number;
}

const MY_POSTS: MyPost[] = [
  {
    id: '1',
    title: 'Looking for Doubles Partner',
    content: 'Looking for a mixed doubles partner for next Saturday morning at Riverside Courts.',
    status: 'Open',
    timeAgo: 'Just now',
    responseCount: 3,
  },
  {
    id: '2',
    title: 'Casual Level 3.0 Play',
    content: 'My Singles Post: Casual Level 3.0 play. Sarasota Area. Weekday mornings preferred.',
    status: 'Open',
    timeAgo: '2 days ago',
    responseCount: 1,
  },
];

export default function MyPostsScreen({ navigation }: any) {
  const { colors, typography } = useTheme();

  const renderPostItem = ({ item }: { item: MyPost }) => (
    <Card elevation={2}>
      {/* Status + Time */}
      <View style={styles.postHeader}>
        <Badge
          label={item.status}
          variant={item.status === 'Open' ? 'success' : 'surface'}
        />
        <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
          {item.timeAgo}
        </Text>
      </View>

      {/* Title + Content */}
      <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.xs }]}>
        {item.title}
      </Text>
      <Text
        style={[typography.bodyLarge, { color: colors.onSurfaceVariant, marginBottom: spacing.lg }]}
        numberOfLines={3}
      >
        {item.content}
      </Text>

      {/* Response Count */}
      <Text style={[typography.labelMedium, { color: colors.secondary, marginBottom: spacing.md }]}>
        {item.responseCount} response{item.responseCount !== 1 ? 's' : ''}
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.secondaryContainer }]}
          onPress={() => navigation.navigate('CreatePost', { postId: item.id })}
        >
          <Edit2 size={16} color={colors.onSecondaryContainer} />
          <Text
            style={[
              typography.labelMedium,
              { color: colors.onSecondaryContainer, marginLeft: spacing.xs },
            ]}
          >
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.errorContainer + '60' }]}
        >
          <Trash2 size={16} color={colors.error} />
          <Text
            style={[
              typography.labelMedium,
              { color: colors.error, marginLeft: spacing.xs },
            ]}
          >
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <ScreenWrapper>
      <Header title="My Posts" />

      <View style={styles.headerContainer}>
        <Text style={[typography.titleLarge, { color: colors.onSurface }]}>
          My Posts ({MY_POSTS.length} Active)
        </Text>
      </View>

      <FlatList
        data={MY_POSTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={renderPostItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              You haven't posted yet.{'\n'}Tap + to find a partner!
            </Text>
          </View>
        }
      />

      <FAB
        icon={<Plus color={colors.surfaceContainerLowest} size={24} />}
        onPress={() => navigation.navigate('CreatePost')}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  emptyState: {
    paddingTop: spacing.giant,
    alignItems: 'center',
  },
});
