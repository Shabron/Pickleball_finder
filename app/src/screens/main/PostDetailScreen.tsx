/**
 * PostDetailScreen — Full post detail view
 *
 * Shows post author, description, metadata, and "Send Match Request" CTA.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { postApi, profileApi } from '../../services/api';
import { MapPin, Clock, Target, Users as UsersIcon } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

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

export default function PostDetailScreen({ navigation, route }: any) {
  const { colors, typography } = useTheme();
  const postId = route?.params?.postId;
  const [post, setPost] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!postId) return;
        const postRes = await postApi.getPostById(postId);
        const postData = postRes.data;
        setPost(postData);

        if (postData?.author?._id) {
          try {
            const profileRes = await profileApi.getProfileByUserId(postData.author._id);
            setProfile(profileRes.data);
          } catch (profileErr) {
            console.error('Failed to fetch author profile:', profileErr);
          }
        }
      } catch (error) {
        console.error('Failed to fetch post details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [postId]);

  if (loading) {
    return (
      <ScreenWrapper>
        <Header title="Post Details" showBack onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!post) {
    return (
      <ScreenWrapper>
        <Header title="Post Details" showBack onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant }]}>Post not found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const location = profile?.city && profile?.state ? `${profile.city}, ${profile.state}` : profile?.state || post.state;

  return (
    <ScreenWrapper>
      <Header title="Post Details" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Author Card ─── */}
        <Text style={[typography.titleSmall, { color: colors.onSurfaceVariant, marginBottom: spacing.sm, marginLeft: spacing.xs }]}>
          Author
        </Text>
        <Card elevation={1} padding={spacing.xl} style={{ marginBottom: spacing.xl, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.outlineVariant }}>
          <View style={styles.authorRow}>
            <Avatar name={post.author.name} size={sizes.avatarLarge} uri={profile?.avatar} />
            <View style={styles.authorInfo}>
              <Text style={[typography.titleLarge, { color: colors.onSurface }]}>
                {post.author.name}
              </Text>
              <View style={styles.authorBadges}>
                <Badge label={`Level ${profile?.skillLevel || post.skillLevel || 'N/A'}`} variant="primary" size="small" />
                <Badge
                  label={location}
                  variant="secondary"
                  size="small"
                  style={{ marginLeft: spacing.xs }}
                />
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <Text
            style={[typography.bodyMedium, { color: colors.onSurfaceVariant, fontStyle: profile?.bio ? 'normal' : 'italic' }]}
          >
            {profile?.bio || 'No bio provided.'}
          </Text>
        </Card>

        {/* ─── Post Content ─── */}
        <Text style={[typography.titleSmall, { color: colors.onSurfaceVariant, marginBottom: spacing.sm, marginLeft: spacing.xs }]}>
          Post Details
        </Text>
        <Card elevation={2} padding={spacing.xl} style={{ marginBottom: spacing.xl, backgroundColor: '#FFFFFF' }}>
          <View style={styles.postHeader}>
            <Badge label={post.status} variant={post.status === 'Open' ? 'success' : 'surface'} size="large" />
            <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
              {formatTimeAgo(post.createdAt)}
            </Text>
          </View>

          <Text style={[typography.headlineMedium, { color: colors.onSurface, marginBottom: spacing.md, fontWeight: '700' }]}>
            {post.title}
          </Text>

          <Text style={[typography.bodyLarge, { color: colors.onSurface, lineHeight: 26, marginBottom: spacing.xl }]}>
            {post.description}
          </Text>

          <View style={styles.divider} />

          {/* Metadata */}
          <Text style={[typography.titleSmall, { color: colors.onSurface, marginBottom: spacing.md }]}>
            Match Preferences
          </Text>
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <View style={[styles.iconBox, { backgroundColor: colors.secondaryContainer }]}>
                  <UsersIcon size={20} color={colors.onSecondaryContainer} />
                </View>
                <View style={{ marginLeft: spacing.md }}>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>Play Style</Text>
                  <Text style={[typography.bodyLarge, { color: colors.onSurface, fontWeight: '500' }]}>{post.playStyle || 'Any'}</Text>
                </View>
              </View>
              <View style={styles.metaItem}>
                <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
                  <Target size={20} color={colors.onPrimaryContainer} />
                </View>
                <View style={{ marginLeft: spacing.md }}>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>Skill Level</Text>
                  <Text style={[typography.bodyLarge, { color: colors.onSurface, fontWeight: '500' }]}>{post.skillLevel || 'Any Level'}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.metaRow, { marginTop: spacing.lg }]}>
              <View style={styles.metaItem}>
                <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
                  <MapPin size={20} color={colors.onSurfaceVariant} />
                </View>
                <View style={{ marginLeft: spacing.md }}>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>Location</Text>
                  <Text style={[typography.bodyLarge, { color: colors.onSurface, fontWeight: '500' }]}>{location}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Availability */}
          {profile?.availability && Object.keys(profile.availability).length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={[typography.titleSmall, { color: colors.onSurface, marginBottom: spacing.md }]}>
                Author's Preferred Schedule
              </Text>
              <View style={styles.availabilityGrid}>
                {Object.entries(profile.availability).map(([day, times]: [string, any]) => (
                  <View key={day} style={styles.availabilityRow}>
                    <View style={[styles.dayChip, { backgroundColor: colors.secondaryContainer }]}>
                      <Text style={[typography.labelMedium, { color: colors.onSecondaryContainer }]}>{day}</Text>
                    </View>
                    <Clock size={16} color={colors.onSurfaceVariant} style={{ marginRight: spacing.sm, marginLeft: spacing.sm }} />
                    <Text style={[typography.bodyMedium, { color: colors.onSurface, fontWeight: '500' }]}>
                      {times.start} - {times.end}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>

        {/* ─── Actions ─── */}
        <Button
          title="SEND MATCH REQUEST"
          onPress={() => {}}
          style={{ marginHorizontal: spacing.md }}
        />

        <Button
          title="MESSAGE"
          onPress={() => navigation.navigate('ChatThread', { name: post.author.name })}
          variant="secondary"
          style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.massive,
    backgroundColor: '#F7FAFC',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  authorBadges: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  metaContainer: {
    marginTop: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: spacing.lg,
  },
  availabilityGrid: {
    marginTop: spacing.xs,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    minWidth: 50,
    alignItems: 'center',
  },
});
