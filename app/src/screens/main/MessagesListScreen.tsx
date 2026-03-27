/**
 * MessagesListScreen — Chat conversations list
 *
 * Matches Stitch "Messaging" design:
 * - Search bar for filtering conversations
 * - Chat list with tonal separation (no dividers per "No-Line Rule")
 * - Unread badges in tertiary orange
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Search } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Avatar from '../../components/common/Avatar';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';

interface ChatPreview {
  id: string;
  name: string;
  timeAgo: string;
  message: string;
  unreadCount: number;
  avatarUri?: string;
  isOnline?: boolean;
}

const MOCK_CHATS: ChatPreview[] = [
  { id: '1', name: 'Arthur Smith', timeAgo: '2m ago', message: 'Are we on for Tuesday? The courts are booked.', unreadCount: 2, isOnline: true },
  { id: '2', name: 'Clara Martinez', timeAgo: '1h ago', message: "I'm available for mixed doubles in Florida.", unreadCount: 1, isOnline: true },
  { id: '3', name: 'Walter Kim', timeAgo: '1h ago', message: "Thanks! Let's team up for the next one.", unreadCount: 0, isOnline: false },
  { id: '4', name: 'Betty Lopez', timeAgo: 'Yesterday', message: 'Sounds great. See you at 9 AM!', unreadCount: 0, isOnline: false },
  { id: '5', name: 'Robert Chen', timeAgo: '2 days ago', message: "I'm a beginner but eager to learn.", unreadCount: 0, isOnline: false },
];

export default function MessagesListScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const { colors, typography } = useTheme();

  const filteredChats = MOCK_CHATS.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderChatItem = ({ item }: { item: ChatPreview }) => {
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[
          styles.chatRow,
          {
            backgroundColor: hasUnread
              ? colors.surfaceContainerLow
              : colors.transparent,
          },
        ]}
        onPress={() => navigation.navigate('ChatThread', { chatId: item.id, name: item.name })}
        activeOpacity={0.7}
      >
        <Avatar name={item.name} uri={item.avatarUri} size={52} showOnline={item.isOnline} />

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text
              style={[
                typography.titleSmall,
                { color: colors.onSurface },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={[
                typography.labelSmall,
                { color: hasUnread ? colors.tertiary : colors.onSurfaceVariant },
              ]}
            >
              {item.timeAgo}
            </Text>
          </View>

          <View style={styles.chatFooter}>
            <Text
              style={[
                typography.bodyMedium,
                {
                  color: hasUnread ? colors.onSurface : colors.onSurfaceVariant,
                  fontWeight: hasUnread ? '600' : '400',
                  flex: 1,
                  marginRight: spacing.sm,
                },
              ]}
              numberOfLines={2}
            >
              {item.message}
            </Text>
            {hasUnread && (
              <View style={[styles.badge, { backgroundColor: colors.tertiary }]}>
                <Text style={[typography.labelSmall, { color: colors.onTertiary, fontSize: 10 }]}>
                  {item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper backgroundColor={colors.surfaceContainerLowest}>
      <Header title="Messages" />

      <View style={styles.container}>
        <Input
          placeholder="Search conversations..."
          icon={<Search color={colors.onSurfaceVariant} size={20} />}
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={{ marginBottom: spacing.lg }}
        />

        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          contentContainerStyle={{ paddingBottom: spacing.massive }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                No conversations yet.{'\n'}Match with a partner to start chatting!
              </Text>
            </View>
          }
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
  },
  chatInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    borderRadius: borderRadius.full,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  emptyState: {
    paddingTop: spacing.giant,
    alignItems: 'center',
  },
});
