/**
 * SavedPostsScreen — Posts the user has bookmarked
 *
 * Mirrors MyPostsScreen's layout, but renders full PartnerPostCards
 * (Reply/Save/Message) since these posts aren't owned by the user.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { postApi, messageApi, getAvatarUrl } from '../../services/api';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import PartnerPostCard from '../../components/PartnerPostCard';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function SavedPostsScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchSavedPosts = async () => {
        try {
          const res = await postApi.getSavedPosts();
          if (res.success) {
            setPosts(res.data.posts);
          }
        } catch (error) {
          console.error('Failed to load saved posts', error);
        } finally {
          setLoading(false);
        }
      };
      fetchSavedPosts();
    }, [])
  );

  const handleMessage = async (authorId: string, authorName: string) => {
    try {
      const res = await messageApi.sendMessage(
        authorId,
        "Hi! I saw your post on Senior Pickleball Partners."
      );
      if (res.success) {
        navigation.navigate('ChatThread', {
          conversationId: res.conversationId,
          userId: authorId,
          name: authorName,
        });
      } else {
        console.error('Failed to send message: ' + res.message);
      }
    } catch (error: any) {
      console.error('Failed to message:', error);
    }
  };

  return (
    <ScreenWrapper>
      <Header title="Saved Posts" showBack onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PartnerPostCard
              post={{
                id: item._id,
                name: item.author.name,
                level: item.skillLevel || 'Unknown',
                timeAgo: formatTimeAgo(item.createdAt),
                content: item.description,
                playStyle: item.playStyle,
                location: `${item.city ? item.city + ', ' : ''}${item.state}`,
                avatarUri: getAvatarUrl(item.author?.avatar),
              }}
              initialSaved
              onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
              onMessage={() => handleMessage(item.author._id, item.author.name)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                No saved posts yet.{'\n'}Tap the bookmark on a post to save it here.
              </Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },
  emptyState: {
    paddingTop: spacing.giant,
    alignItems: 'center',
  },
});
