import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageSquare, Bookmark, CornerUpLeft } from 'lucide-react-native';
import Card from './common/Card';
import Avatar from './common/Avatar';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export interface PartnerPostData {
  id: string;
  name: string;
  level: string;
  timeAgo: string;
  content: string;
  avatarUri?: string;
}

interface PartnerPostCardProps {
  post: PartnerPostData;
  onReply?: () => void;
  onSave?: () => void;
  onMessage?: () => void;
}

export default function PartnerPostCard({ post, onReply, onSave, onMessage }: PartnerPostCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Avatar name={post.name} uri={post.avatarUri} size={40} />
        <View style={styles.headerTextContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{post.name}</Text>
            <Text style={styles.timeText}>{post.timeAgo}</Text>
          </View>
          <View style={styles.levelRow}>
            <View style={styles.dot} />
            <Text style={styles.levelText}>Level {post.level}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.content}>{post.content}</Text>
      
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onReply}>
          <CornerUpLeft size={18} color={colors.textSecondary} />
          <Text style={styles.actionText}>Reply</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onSave}>
          <Bookmark size={18} color={colors.textSecondary} />
          <Text style={styles.actionText}>Save</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onMessage}>
          <MessageSquare size={18} color={colors.textSecondary} />
          <Text style={styles.actionText}>Message</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.m,
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.s,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: spacing.m,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  timeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
    marginRight: 4,
  },
  levelText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  content: {
    ...typography.bodySmall,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.m,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: colors.background, // extremely subtle divider
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s,
  },
  actionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
});
