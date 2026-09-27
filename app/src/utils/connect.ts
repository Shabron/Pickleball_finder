/**
 * One place for the Connect / Requested / Accept / Message flow, shared by
 * Post Detail and User Profile so both behave identically.
 */
import { Alert } from 'react-native';
import { messageApi } from '../services/api';

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export const INTRO_MESSAGE = "Hi! I saw you on Senior Pickleball Partners. Let's play!";

export function connectLabel(status: ConnectionStatus = 'none'): string {
  switch (status) {
    case 'accepted':
      return 'Message';
    case 'pending_sent':
      return 'Request sent';
    case 'pending_received':
      return 'Accept request';
    default:
      return 'Connect';
  }
}

interface Target {
  userId: string;
  name: string;
  status: ConnectionStatus;
  conversationId?: string | null;
}

/**
 * Runs the right action for the current status. `onChange` receives the new
 * status (optimistically for Connect, rolled back on failure).
 */
export async function runConnect(
  target: Target,
  navigation: any,
  onChange: (patch: { status: ConnectionStatus; conversationId?: string | null }) => void
): Promise<void> {
  const openChat = (conversationId?: string | null) =>
    navigation.navigate('ChatThread', { conversationId, userId: target.userId, name: target.name });

  try {
    if (target.status === 'accepted') {
      openChat(target.conversationId);
      return;
    }
    if (target.status === 'pending_received' && target.conversationId) {
      const res = await messageApi.acceptRequest(target.conversationId);
      if (res.success) {
        onChange({ status: 'accepted' });
        openChat(target.conversationId);
      } else {
        Alert.alert("Couldn't accept", res.message || 'Please try again.');
      }
      return;
    }
    if (target.status === 'pending_sent') return;

    onChange({ status: 'pending_sent' });
    const res = await messageApi.sendMessage(target.userId, INTRO_MESSAGE);
    if (res.success) {
      onChange({ status: 'pending_sent', conversationId: res.conversationId });
    } else {
      onChange({ status: target.status });
      Alert.alert("Couldn't connect", res.message || 'Please try again.');
    }
  } catch (e: any) {
    onChange({ status: target.status });
    Alert.alert("Couldn't connect", e?.message || 'Please try again.');
  }
}
