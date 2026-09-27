/**
 * ChatThreadScreen — v2
 *
 *  - Header matches the app; avatar + name open the partner's profile
 *  - Date separators (Today / Yesterday / Mon, Sep 22)
 *  - "Seen" under my latest message once they've read it
 *  - Failed sends stay in the list with "Not sent · Tap to retry"
 *  - Request states in place of the input:
 *      received → Decline / Accept bar
 *      sent     → "Waiting for X to accept" + Cancel request
 *  - Polls every 5s while open, only re-renders when something changed
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ChevronLeft, Send, MoreVertical, RotateCw } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Avatar from '../../components/common/Avatar';
import ReportBlockSheet from '../../components/ReportBlockSheet';
import RatingSheet from '../../components/RatingSheet';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';
import { messageApi, profileApi, getAvatarUrl } from '../../services/api';
import { getSkillLevelLabel } from '../../constants/skillLevels';

type ViewStatus = 'accepted' | 'pending_sent' | 'pending_received' | 'none';

interface Msg {
  id: string;
  text: string;
  mine: boolean;
  createdAt: string;
  isRead?: boolean;
  state?: 'sending' | 'failed';
}

type Row = { type: 'date'; id: string; label: string } | { type: 'msg'; id: string; msg: Msg };

function dayLabel(d: Date): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (t === start) return 'Today';
  if (t === start - 86400000) return 'Yesterday';
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function ChatThreadScreen({ navigation, route }: any) {
  const { colors, typography } = useTheme();
  const partnerName: string = route?.params?.name || 'Player';
  const partnerId: string | undefined = route?.params?.userId;
  const firstName = partnerName.trim().split(/\s+/)[0];

  const [conversationId, setConversationId] = useState<string | undefined>(route?.params?.conversationId);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loaded, setLoaded] = useState(!route?.params?.conversationId);
  const [status, setStatus] = useState<ViewStatus>(route?.params?.conversationId ? 'accepted' : 'none');
  const [statusKnown, setStatusKnown] = useState(!route?.params?.conversationId);
  const [inputText, setInputText] = useState('');
  const [acting, setActing] = useState(false);
  const [partner, setPartner] = useState<{ avatar?: string; subtitle?: string }>({});
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showRatingSheet, setShowRatingSheet] = useState(false);

  const listRef = useRef<FlatList>(null);
  const lastSig = useRef('');
  const pending = useRef<Msg[]>([]); // local sending/failed messages survive polling

  // ── Partner info (avatar + level/city for header) ───────────────────────
  useEffect(() => {
    if (!partnerId) return;
    profileApi
      .getProfileByUserId(partnerId)
      .then((res: any) => {
        const p = res?.data;
        if (!p) return;
        setPartner({
          avatar: getAvatarUrl(p.avatar),
          subtitle:
            [p.skillLevel && getSkillLevelLabel(p.skillLevel), [p.city, p.state].filter(Boolean).join(', ')]
              .filter(Boolean)
              .join(' · ') || undefined,
        });
        if (!conversationId && p.conversationId) setConversationId(p.conversationId);
        if (!route?.params?.conversationId && p.connectionStatus) {
          setStatus(p.connectionStatus);
          setStatusKnown(true);
        }
      })
      .catch((err: any) => console.warn('Chat: partner profile failed', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  // ── Messages ────────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await messageApi.getMessages(conversationId);
      if (!res?.success || !res.data) return;
      const server: Msg[] = res.data.map((m: any) => ({
        id: m._id,
        text: m.content,
        mine: String(m.senderId?._id ?? m.senderId) !== String(partnerId),
        createdAt: m.createdAt,
        isRead: m.isRead,
      }));
      const vs: ViewStatus =
        res.viewStatus ||
        (res.conversationStatus === 'accepted'
          ? 'accepted'
          : res.conversationStatus === 'pending'
          ? String(res.initiator) === String(partnerId)
            ? 'pending_received'
            : 'pending_sent'
          : 'none');

      const last = server[server.length - 1];
      const sig = `${server.length}|${last?.id}|${last?.isRead}|${vs}`;
      if (sig !== lastSig.current) {
        lastSig.current = sig;
        setMessages([...server, ...pending.current]);
        setStatus(vs);
      }
      setStatusKnown(true);
    } catch (e) {
      console.warn('Chat: fetch failed', e);
    } finally {
      setLoaded(true);
    }
  }, [conversationId, partnerId]);

  useEffect(() => {
    if (!conversationId) return;
    fetchMessages();
    messageApi.markAsRead(conversationId).catch(() => {});
    const interval = setInterval(() => {
      fetchMessages();
      messageApi.markAsRead(conversationId).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [conversationId, fetchMessages]);

  // ── Send / retry ────────────────────────────────────────────────────────
  const deliver = async (msg: Msg) => {
    if (!partnerId) return;
    try {
      const res = await messageApi.sendMessage(partnerId, msg.text);
      if (!res?.success) throw new Error(res?.message);
      pending.current = pending.current.filter(m => m.id !== msg.id);
      if (!conversationId && res.conversationId) setConversationId(res.conversationId);
      lastSig.current = ''; // force refresh
      await fetchMessages();
      if (!conversationId) setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, state: undefined } : m)));
    } catch (e) {
      pending.current = pending.current.map(m => (m.id === msg.id ? { ...m, state: 'failed' } : m));
      setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, state: 'failed' } : m)));
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !partnerId) return;
    const msg: Msg = { id: `local-${Date.now()}`, text, mine: true, createdAt: new Date().toISOString(), state: 'sending' };
    pending.current = [...pending.current, msg];
    setMessages(prev => [...prev, msg]);
    setInputText('');
    deliver(msg);
  };

  const retry = (msg: Msg) => {
    pending.current = pending.current.map(m => (m.id === msg.id ? { ...m, state: 'sending' } : m));
    setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, state: 'sending' } : m)));
    deliver({ ...msg, state: 'sending' });
  };

  // ── Request actions ─────────────────────────────────────────────────────
  const accept = async () => {
    if (!conversationId) return;
    setActing(true);
    try {
      const res = await messageApi.acceptRequest(conversationId);
      if (!res?.success) throw new Error(res?.message);
      setStatus('accepted');
      lastSig.current = '';
    } catch (e: any) {
      Alert.alert("Couldn't accept", e?.message || 'Please try again.');
    } finally {
      setActing(false);
    }
  };

  const decline = () =>
    Alert.alert(`Decline ${firstName}'s request?`, "They won't be notified.", [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          if (!conversationId) return;
          setActing(true);
          try {
            await messageApi.declineRequest(conversationId);
            navigation.goBack();
          } catch (e: any) {
            setActing(false);
            Alert.alert("Couldn't decline", e?.message || 'Please try again.');
          }
        },
      },
    ]);

  const cancel = () =>
    Alert.alert(`Cancel your request to ${firstName}?`, undefined, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel request',
        style: 'destructive',
        onPress: async () => {
          if (!conversationId) return;
          setActing(true);
          try {
            await messageApi.cancelRequest(conversationId);
            navigation.goBack();
          } catch (e: any) {
            setActing(false);
            Alert.alert("Couldn't cancel", e?.message || 'Please try again.');
          }
        },
      },
    ]);

  const openProfile = () => partnerId && navigation.navigate('UserProfile', { userId: partnerId });

  // ── Rows with date separators ───────────────────────────────────────────
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    let lastDay = '';
    messages.forEach(m => {
      const d = new Date(m.createdAt);
      const key = d.toDateString();
      if (key !== lastDay) {
        lastDay = key;
        out.push({ type: 'date', id: `d-${key}`, label: dayLabel(d) });
      }
      out.push({ type: 'msg', id: m.id, msg: m });
    });
    return out;
  }, [messages]);

  const lastMineId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].mine && !messages[i].state) return messages[i].id;
    return null;
  }, [messages]);
  const lastMessageIsMine = messages.length > 0 && messages[messages.length - 1].mine;

  const renderRow = ({ item, index }: { item: Row; index: number }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateWrap}>
          <View style={[styles.datePill, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>{item.label}</Text>
          </View>
        </View>
      );
    }
    const m = item.msg;
    const next = rows[index + 1];
    const groupedWithNext = next?.type === 'msg' && next.msg.mine === m.mine;
    const failed = m.state === 'failed';
    const bubble = (
      <View
        style={[
          styles.bubble,
          m.mine
            ? { backgroundColor: failed ? colors.errorContainer : colors.primary, borderBottomRightRadius: groupedWithNext ? 20 : 6 }
            : { backgroundColor: colors.surface, borderBottomLeftRadius: groupedWithNext ? 20 : 6 },
          m.state === 'sending' && { opacity: 0.7 },
        ]}
      >
        <Text style={[typography.bodyLarge, { color: m.mine && !failed ? colors.onPrimary : colors.onSurface }]}>{m.text}</Text>
        <Text
          style={[
            typography.labelSmall,
            styles.time,
            { color: m.mine && !failed ? 'rgba(255,255,255,0.75)' : colors.onSurfaceVariant },
          ]}
        >
          {m.state === 'sending' ? 'Sending…' : timeOf(m.createdAt)}
        </Text>
      </View>
    );
    return (
      <View style={[styles.msgRow, m.mine ? styles.right : styles.left, { marginBottom: groupedWithNext ? 3 : spacing.sm }]}>
        {failed ? (
          <Pressable onPress={() => retry(m)}>
            {bubble}
            <View style={[styles.inline, { alignSelf: 'flex-end', marginTop: 3 }]}>
              <RotateCw size={12} color={colors.error} />
              <Text style={[typography.labelSmall, { color: colors.error, marginLeft: 4 }]}>Not sent · Tap to retry</Text>
            </View>
          </Pressable>
        ) : (
          bubble
        )}
        {m.id === lastMineId && lastMessageIsMine && status === 'accepted' && (
          <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, alignSelf: 'flex-end', marginTop: 3 }]}>
            {m.isRead ? 'Seen' : 'Delivered'}
          </Text>
        )}
      </View>
    );
  };

  // ── Bottom area by status ───────────────────────────────────────────────
  let bottom: React.ReactNode;
  if (!statusKnown) {
    bottom = <View style={{ height: 60 }} />;
  } else if (status === 'pending_received') {
    bottom = (
      <View style={styles.requestBar}>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.sm }]}>
          {firstName} wants to connect with you
        </Text>
        {acting ? (
          <ActivityIndicator color={colors.primary} style={{ height: 44 }} />
        ) : (
          <View style={styles.inline}>
            <TouchableOpacity onPress={decline} activeOpacity={0.8} style={[styles.reqBtn, { backgroundColor: colors.surfaceContainer }]}>
              <Text style={[typography.labelLarge, { color: colors.onSurfaceVariant, fontWeight: '700' }]}>Decline</Text>
            </TouchableOpacity>
            <View style={{ width: spacing.sm }} />
            <TouchableOpacity onPress={accept} activeOpacity={0.85} style={[styles.reqBtn, { backgroundColor: colors.primary }]}>
              <Text style={[typography.labelLarge, { color: colors.onPrimary, fontWeight: '700' }]}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  } else if (status === 'pending_sent') {
    bottom = (
      <View style={[styles.requestBar, { alignItems: 'center' }]}>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
          Waiting for {firstName} to accept your request
        </Text>
        {acting ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />
        ) : (
          <TouchableOpacity onPress={cancel} hitSlop={10} style={{ marginTop: spacing.sm }}>
            <Text style={[typography.labelLarge, { color: colors.error, fontWeight: '600' }]}>Cancel request</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  } else if (status === 'none' && conversationId && loaded) {
    bottom = (
      <View style={[styles.requestBar, { alignItems: 'center' }]}>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
          This conversation is no longer available.
        </Text>
      </View>
    );
  } else {
    const canSend = inputText.trim().length > 0;
    bottom = (
      <View style={styles.inputRow}>
        <TextInput
          style={[typography.bodyLarge, styles.input, { backgroundColor: colors.surfaceContainer, color: colors.onSurface }]}
          placeholder={status === 'none' ? `Say hi to ${firstName}…` : 'Message'}
          placeholderTextColor={colors.onSurfaceVariant}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: canSend ? colors.primary : colors.surfaceContainer }]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.85}
        >
          <Send color={canSend ? colors.onPrimary : colors.onSurfaceVariant} size={20} style={{ marginLeft: -2 }} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
            <ChevronLeft color={colors.onPrimaryContainer} size={sizes.iconLarge} />
          </TouchableOpacity>

          <Pressable onPress={openProfile} style={({ pressed }) => [styles.headerWho, pressed && { opacity: 0.6 }]}>
            <Avatar name={partnerName} uri={partner.avatar} size={40} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text style={[typography.titleSmall, { color: colors.onPrimaryContainer, fontWeight: '700' }]} numberOfLines={1}>
                {partnerName}
              </Text>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {partner.subtitle || 'View profile'}
              </Text>
            </View>
          </Pressable>

          <TouchableOpacity
            hitSlop={12}
            onPress={() => setShowActionSheet(true)}
            style={[styles.moreBtn, { backgroundColor: colors.surface }]}
            activeOpacity={0.75}
          >
            <MoreVertical color={colors.onSurfaceVariant} size={18} />
          </TouchableOpacity>
        </View>

        {/* ─── Messages ─── */}
        {!loaded ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={rows}
            keyExtractor={item => item.id}
            renderItem={renderRow}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Avatar name={partnerName} uri={partner.avatar} size={64} />
                <Text style={[typography.titleSmall, { color: colors.onSurface, fontWeight: '700', marginTop: spacing.md }]}>
                  {partnerName}
                </Text>
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }]}>
                  Say hi and suggest a time to play 🏓
                </Text>
              </View>
            }
          />
        )}

        {/* ─── Bottom ─── */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface }]}>{bottom}</View>
      </KeyboardAvoidingView>

      {partnerId && (
        <>
          <ReportBlockSheet
            visible={showActionSheet}
            userId={partnerId}
            userName={partnerName}
            context="chat"
            onClose={() => setShowActionSheet(false)}
            onBlocked={() => navigation.goBack()}
            onRate={status === 'accepted' ? () => setShowRatingSheet(true) : undefined}
          />
          <RatingSheet
            visible={showRatingSheet}
            userId={partnerId}
            userName={partnerName}
            conversationId={conversationId}
            onClose={() => setShowRatingSheet(false)}
          />
        </>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginRight: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerWho: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  dateWrap: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  msgRow: {
    maxWidth: '80%',
  },
  left: {
    alignSelf: 'flex-start',
  },
  right: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  time: {
    alignSelf: 'flex-end',
    marginTop: 2,
    fontSize: 11,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  bottomBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: 11,
    paddingBottom: 11,
    minHeight: 44,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  requestBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  reqBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
