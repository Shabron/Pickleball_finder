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
import { messageApi, profileApi } from '../../services/api';

interface ChatPreview {
  id: string; // conversationId
  userId: string; // partnerId
  name: string;
  timeAgo: string;
  message: string;
  unreadCount: number;
  avatarUri?: string;
  isOnline?: boolean;
  status: string;
  initiator?: string;
}

export default function MessagesListScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { colors, typography } = useTheme();

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchConversations();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await messageApi.getConversations();
      if (res.success && res.data) {
        const currentUserId = res.currentUserId;
        const mapped: ChatPreview[] = res.data.map((conv: any) => {
          // Find the participant that is NOT the current user
          const otherParticipant = conv.participants.find((p: any) => p._id !== currentUserId) || conv.participants[0];
          
          return {
            id: conv._id,
            userId: otherParticipant?._id,
            name: otherParticipant?.name || 'Unknown',
            timeAgo: new Date(conv.updatedAt).toLocaleDateString(), // Simple format for now
            message: conv.lastMessage?.content || 'Started a conversation',
            unreadCount: conv.unreadCount || 0,
            avatarUri: undefined,
            isOnline: true, // Mock
            status: conv.status,
            initiator: conv.initiator,
          };
        });
        setChats(mapped);
        
        const profileRes = await profileApi.getProfile();
        if (profileRes.success) {
          setUnreadCount(profileRes.unreadNotificationsCount || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAcceptRequest = async (conversationId: string) => {
    try {
      const res = await messageApi.acceptRequest(conversationId);
      if (res.success) {
        setChats(prev => prev.map(chat => chat.id === conversationId ? { ...chat, status: 'accepted' } : chat));
      } else {
        alert('Failed to accept request');
      }
    } catch (err) {
      console.error(err);
      alert('Error accepting request');
    }
  };

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
        onPress={() => navigation.navigate('ChatThread', { conversationId: item.id, userId: item.userId, name: item.name })}
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
              numberOfLines={1}
            >
              {item.status === 'pending' && item.initiator === item.userId 
                ? 'Requested to connect' 
                : item.status === 'pending'
                ? 'Connection request sent'
                : item.message}
            </Text>
            {item.status === 'pending' && item.initiator === item.userId ? (
              <TouchableOpacity
                style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                onPress={(e) => { e.stopPropagation(); handleAcceptRequest(item.id); }}
              >
                <Text style={[typography.labelSmall, { color: colors.onPrimary, fontWeight: '700' }]}>Accept</Text>
              </TouchableOpacity>
            ) : hasUnread ? (
              <View style={[styles.badge, { backgroundColor: colors.tertiary }]}>
                <Text style={[typography.labelSmall, { color: colors.onTertiary, fontSize: 10 }]}>
                  {item.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper backgroundColor={colors.surfaceContainerLowest}>
      <Header
        showLogo
        showNotificationBell
        notificationCount={unreadCount}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

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
  acceptBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
});
