/**
 * PostDetailScreen — Full post detail view
 *
 * Shows post author, description, metadata, and "Send Match Request" CTA.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MapPin, Clock, Target, Users as UsersIcon } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

export default function PostDetailScreen({ navigation, route }: any) {
  const { colors, typography } = useTheme();

  // Mock data — in production, fetch by route.params.postId
  const post = {
    id: route?.params?.postId || '1',
    author: {
      name: 'Arthur Smith',
      level: '3.0',
      location: 'Sarasota, FL',
      bio: 'Retired teacher, love playing pickleball at the courts near Riverside.',
    },
    title: 'Looking for Doubles Partner',
    content:
      'Looking for a mixed doubles partner for next Saturday morning at Riverside Courts. Intermediate level preferred! I usually play from 9-11 AM on weekends.',
    playStyle: 'Doubles',
    preferredTime: 'Sat AM, Sun AM',
    desiredLevel: 'Intermediate',
    status: 'Open',
    timeAgo: '1 day ago',
  };

  return (
    <ScreenWrapper>
      <Header title="Post Details" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Author Card ─── */}
        <Card elevation={2} padding={spacing.xl}>
          <View style={styles.authorRow}>
            <Avatar name={post.author.name} size={sizes.avatarMedium} />
            <View style={styles.authorInfo}>
              <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                {post.author.name}
              </Text>
              <View style={styles.authorBadges}>
                <Badge label={`Level ${post.author.level}`} variant="primary" size="small" />
                <Badge
                  label={post.author.location}
                  variant="secondary"
                  size="small"
                  style={{ marginLeft: spacing.xs }}
                />
              </View>
            </View>
          </View>
          <Text
            style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.md }]}
          >
            {post.author.bio}
          </Text>
        </Card>

        {/* ─── Post Content ─── */}
        <Card elevation={2} padding={spacing.xl}>
          <View style={styles.postHeader}>
            <Badge label={post.status} variant="success" size="large" />
            <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
              {post.timeAgo}
            </Text>
          </View>

          <Text style={[typography.headlineSmall, { color: colors.onSurface, marginBottom: spacing.md }]}>
            {post.title}
          </Text>

          <Text style={[typography.bodyLarge, { color: colors.onSurface, lineHeight: 26, marginBottom: spacing.xl }]}>
            {post.content}
          </Text>

          {/* Metadata */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <UsersIcon size={18} color={colors.secondary} />
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginLeft: spacing.sm }]}>
                {post.playStyle}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Target size={18} color={colors.primary} />
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginLeft: spacing.sm }]}>
                {post.desiredLevel}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={18} color={colors.tertiary} />
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginLeft: spacing.sm }]}>
                {post.preferredTime}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={18} color={colors.secondary} />
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginLeft: spacing.sm }]}>
                {post.author.location}
              </Text>
            </View>
          </View>
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
    marginTop: spacing.xs,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
    paddingVertical: spacing.xs,
  },
});
