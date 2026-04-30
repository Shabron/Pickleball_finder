/**
 * ChatThreadScreen — Real-time messaging
 *
 * Matches Stitch "Messaging (Final Polish)" design:
 * - Themed message bubbles (primary for sent, surfaceContainer for received)
 * - Tonal input bar
 * - Glassmorphic header with back button and avatar
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft, Send, Phone, MoreVertical } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Avatar from '../../components/common/Avatar';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';
import { messageApi } from '../../services/api';

interface Message {
  id: string;
  text: string;
  senderId: 'me' | 'other';
  time: string;
}

const MOCK_MESSAGES: Message[] = [
  { id: '1', text: 'Hey, saw your post. Are you still looking for a partner?', senderId: 'other', time: '10:00 AM' },
  { id: '2', text: 'Yes, definitely! Are you available this Saturday morning?', senderId: 'me', time: '10:05 AM' },
  { id: '3', text: 'Saturday works perfectly. What skill level are you looking for exactly?', senderId: 'other', time: '10:08 AM' },
  { id: '4', text: "I'm a 3.0, but open to play with a 3.5. Let's meet at Riverside.", senderId: 'me', time: '10:10 AM' },
  { id: '5', text: 'Sounds like a plan. See you there at 9 AM! 🏓', senderId: 'other', time: '10:15 AM' },
];

export default function ChatThreadScreen({ navigation, route }: any) {
  const partnerName = route?.params?.name || 'Partner';
  const partnerId = route?.params?.userId;
  const conversationId = route?.params?.conversationId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { colors, typography } = useTheme();

  React.useEffect(() => {
    if (conversationId) {
      fetchMessages();
      // Mark as read immediately upon entering the chat
      messageApi.markAsRead(conversationId).catch((err) => console.error('Failed to mark read:', err));

      // Simple polling for new messages (could be replaced with websockets)
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      if (!conversationId) return;
      const res = await messageApi.getMessages(conversationId);
      if (res.success && res.data) {
        const mapped: Message[] = res.data.map((m: any) => ({
          id: m._id,
          text: m.content,
          senderId: m.senderId?._id === partnerId ? 'other' : 'me',
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !partnerId) return;

    // Optimistic update
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      senderId: 'me',
      time: 'Sending...',
    };

    setMessages((prev) => [...prev, newMessage]);
    const textToSend = inputText.trim();
    setInputText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const res = await messageApi.sendMessage(partnerId, textToSend);
      if (res.success) {
        fetchMessages(); // Refresh to get actual DB message
      }
    } catch (error) {
      console.error('Failed to send message', error);
      // Could remove the optimistic message here or show error
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === 'me';
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowRight]}>
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isMe ? colors.primary : colors.surfaceContainerHigh,
              borderBottomRightRadius: isMe ? 4 : borderRadius.xl,
              borderBottomLeftRadius: isMe ? borderRadius.xl : 4,
            },
          ]}
        >
          <Text
            style={[
              typography.bodyLarge,
              { color: isMe ? colors.surfaceContainerLowest : colors.onSurface },
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              typography.labelSmall,
              {
                color: isMe ? 'rgba(255,255,255,0.65)' : colors.onSurfaceVariant,
                alignSelf: 'flex-end',
                marginTop: spacing.xs,
              },
            ]}
          >
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper backgroundColor={colors.surfaceContainerLowest}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ─── Chat Header ─── */}
        <View style={[styles.header, { backgroundColor: colors.surfaceContainerLow }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backButton}
          >
            <ChevronLeft color={colors.onSurface} size={sizes.iconLarge} />
          </TouchableOpacity>

          <Avatar name={partnerName} size={42} showOnline />

          <View style={styles.headerInfo}>
            <Text style={[typography.titleSmall, { color: colors.onSurface }]}>
              {partnerName}
            </Text>
            <Text style={[typography.labelSmall, { color: colors.success }]}>Online</Text>
          </View>

          <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Phone color={colors.onSurfaceVariant} size={sizes.iconDefault} />
          </TouchableOpacity>

          <TouchableOpacity
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ marginLeft: spacing.md }}
          >
            <MoreVertical color={colors.onSurfaceVariant} size={sizes.iconDefault} />
          </TouchableOpacity>
        </View>

        {/* ─── Messages ─── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {/* ─── Input Bar ─── */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surfaceContainerLow }]}>
          <TextInput
            style={[
              typography.bodyLarge,
              styles.input,
              {
                backgroundColor: colors.surfaceContainerHighest,
                color: colors.onSurface,
              },
            ]}
            placeholder="Type a message..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() ? colors.primary : colors.outlineVariant,
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send color={colors.surfaceContainerLowest} size={20} style={{ marginLeft: -2 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  messageList: {
    padding: spacing.lg,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageRow: {
    marginBottom: spacing.sm,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  messageRowRight: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 44,
    maxHeight: 120,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
});
