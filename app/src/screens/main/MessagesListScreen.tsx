/**
 * MessagesListScreen — v2
 *
 *  [ Chats | Requests • N ]  sliding segmented control (same as Search)
 *
 *  Chats:    accepted conversations. Avatar → profile, row → chat.
 *  Requests: RECEIVED (Decline / Accept) and SENT BY YOU (Waiting… / Cancel).
 *
 *  Skeletons on first load, silent refresh on focus, pull-to-refresh,
 *  retry state for Render cold starts, optimistic actions.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  TouchableOpacity,
  Pressable,
  Animated,
  RefreshControl,
  TextInput,
  Alert,
  LayoutChangeEvent,
  ActivityIndicator,
} from 'react-native';
import { Search, X, MessageCircle, UserPlus } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Avatar from '../../components/common/Avatar';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { messageApi, profileApi, getAvatarUrl } from '../../services/api';
import { getSkillLevelLabel } from '../../constants/skillLevels';

type ViewStatus = 'accepted' | 'pending_sent' | 'pending_received';
type Tab = 'chats' | 'requests';

interface Conv {
  id: string;
  userId: string;
  name: string;
  avatarUri?: string;
  subtitle?: string; // level · city (requests)
  message: string;
  lastFromMe: boolean;
  updatedAt: string;
  unreadCount: number;
  status: ViewStatus;
}

/** "2:15 PM" today · "Yesterday" · "Mon" this week · "Sep 3" older */
export function shortTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = d.getTime();
  if (t >= startOfToday) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (t >= startOfToday - 86400000) return 'Yesterday';
  if (t >= startOfToday - 6 * 86400000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function waitingFor(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'Sent today';
  if (days === 1) return 'Sent yesterday';
  return `Sent ${days}d ago`;
}

export default function MessagesListScreen({ navigation }: any) {
  const { colors, typography } = useTheme();

  const [tab, setTab] = useState<Tab>('chats');
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const [segWidth, setSegWidth] = useState(0);
  const pillX = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.5)).current;
  const pillW = segWidth > 0 ? (segWidth - 8) / 2 : 0;

  // ── Data ────────────────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await messageApi.getConversations();
      if (!res?.success || !res.data) throw new Error('bad response');
      const me = String(res.currentUserId);
      const mapped: Conv[] = res.data.map((c: any) => {
        const other = c.participants.find((p: any) => String(p._id) !== me) || c.participants[0];
        const status: ViewStatus =
          c.viewStatus ||
          (c.status === 'accepted' ? 'accepted' : String(c.initiator) === me ? 'pending_sent' : 'pending_received');
        return {
          id: c._id,
          userId: other?._id,
          name: other?.name?.trim() || 'Player',
          avatarUri: getAvatarUrl(other?.avatar),
          subtitle:
            [other?.skillLevel && getSkillLevelLabel(other.skillLevel), [other?.city, other?.state].filter(Boolean).join(', ')]
              .filter(Boolean)
              .join(' · ') || undefined,
          message: c.lastMessage?.content || '',
          lastFromMe: String(c.lastMessage?.senderId) === me,
          updatedAt: c.lastMessage?.createdAt || c.updatedAt,
          unreadCount: c.unreadCount || 0,
          status,
        };
      });
      mapped.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setConvs(mapped);
      setError(false);
      setLoaded(true);
      profileApi
        .getProfile()
        .then((p: any) => {
          if (p?.success) setUnreadNotifs(p.unreadNotificationsCount || 0);
        })
        .catch(() => {});
    } catch (e) {
      console.warn('Messages: fetch failed', e);
      setError(true);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchConversations);
    return unsub;
  }, [navigation, fetchConversations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  // ── Derived lists ───────────────────────────────────────────────────────
  const chats = useMemo(() => {
    const q = query.trim().toLowerCase();
    return convs.filter(c => c.status === 'accepted' && (!q || c.name.toLowerCase().includes(q)));
  }, [convs, query]);
  const received = useMemo(() => convs.filter(c => c.status === 'pending_received'), [convs]);
  const sent = useMemo(() => convs.filter(c => c.status === 'pending_sent'), [convs]);
  const unreadChats = useMemo(() => convs.filter(c => c.status === 'accepted' && c.unreadCount > 0).length, [convs]);

  // First load: land on Requests if something is waiting and there are no chats.
  const autoSwitched = useRef(false);
  useEffect(() => {
    if (!loaded || autoSwitched.current) return;
    autoSwitched.current = true;
    if (received.length > 0 && convs.every(c => c.status !== 'accepted')) setTab('requests');
  }, [loaded, received.length, convs]);

  // ── Animations ──────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(pillX, {
      toValue: tab === 'chats' ? 0 : pillW,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  }, [tab, pillW, pillX]);

  useEffect(() => {
    if (loaded) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [loaded, pulse]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const openProfile = (c: Conv) => {
    if (c.userId) navigation.navigate('UserProfile', { userId: c.userId });
  };
  const openChat = (c: Conv) =>
    navigation.navigate('ChatThread', { conversationId: c.id, userId: c.userId, name: c.name });

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await fn();
    } finally {
      setBusy(b => {
        const next = { ...b };
        delete next[id];
        return next;
      });
    }
  };

  const accept = (c: Conv) =>
    withBusy(c.id, async () => {
      try {
        const res = await messageApi.acceptRequest(c.id);
        if (!res?.success) throw new Error(res?.message);
        setConvs(prev => prev.map(x => (x.id === c.id ? { ...x, status: 'accepted' } : x)));
        openChat(c);
      } catch (e: any) {
        Alert.alert("Couldn't accept", e?.message || 'Please try again.');
      }
    });

  const removeOptimistic = (c: Conv, call: () => Promise<any>, failTitle: string) =>
    withBusy(c.id, async () => {
      const snapshot = convs;
      setConvs(prev => prev.filter(x => x.id !== c.id));
      try {
        await call();
      } catch (e: any) {
        setConvs(snapshot);
        Alert.alert(failTitle, e?.message || 'Please try again.');
      }
    });

  const decline = (c: Conv) =>
    Alert.alert(`Decline ${c.name.split(' ')[0]}'s request?`, "They won't be notified.", [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => removeOptimistic(c, () => messageApi.declineRequest(c.id), "Couldn't decline"),
      },
    ]);

  const cancel = (c: Conv) =>
    Alert.alert(`Cancel your request to ${c.name.split(' ')[0]}?`, undefined, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel request',
        style: 'destructive',
        onPress: () => removeOptimistic(c, () => messageApi.cancelRequest(c.id), "Couldn't cancel"),
      },
    ]);

  // ── Rows ────────────────────────────────────────────────────────────────
  const renderChat = ({ item }: { item: Conv }) => {
    const unread = item.unreadCount > 0;
    return (
      <Pressable
        onPress={() => openChat(item)}
        style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
      >
        <Pressable onPress={() => openProfile(item)} hitSlop={6}>
          <Avatar name={item.name} uri={item.avatarUri} size={50} />
        </Pressable>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text
              style={[typography.titleSmall, { color: colors.onSurface, fontWeight: unread ? '700' : '600', flex: 1 }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={[
                typography.labelSmall,
                { color: unread ? colors.primary : colors.onSurfaceVariant, fontWeight: unread ? '700' : '400' },
              ]}
            >
              {shortTime(item.updatedAt)}
            </Text>
          </View>
          <View style={styles.rowBottom}>
            <Text
              style={[
                typography.bodyMedium,
                { color: unread ? colors.onSurface : colors.onSurfaceVariant, fontWeight: unread ? '600' : '400', flex: 1 },
              ]}
              numberOfLines={1}
            >
              {item.message ? `${item.lastFromMe ? 'You: ' : ''}${item.message}` : 'Say hi 👋'}
            </Text>
            {unread && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={[typography.labelSmall, { color: colors.onPrimary, fontWeight: '700' }]}>
                  {item.unreadCount > 9 ? '9+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderRequest = ({ item }: { item: Conv }) => {
    const incoming = item.status === 'pending_received';
    const isBusy = !!busy[item.id];
    return (
      <Pressable
        onPress={() => (incoming ? openProfile(item) : openChat(item))}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.surface, alignItems: 'flex-start', opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Pressable onPress={() => openProfile(item)} hitSlop={6}>
          <Avatar name={item.name} uri={item.avatarUri} size={50} />
        </Pressable>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[typography.titleSmall, { color: colors.onSurface, fontWeight: '700', flex: 1 }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
              {incoming ? shortTime(item.updatedAt) : waitingFor(item.updatedAt)}
            </Text>
          </View>
          {!!item.subtitle && (
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}
          {!!item.message && (
            <Text style={[typography.bodyMedium, { color: colors.onSurface, marginTop: 4 }]} numberOfLines={2}>
              “{item.message}”
            </Text>
          )}

          <View style={styles.actions}>
            {isBusy ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
            ) : incoming ? (
              <>
                <TouchableOpacity
                  onPress={() => decline(item)}
                  activeOpacity={0.8}
                  style={[styles.actionBtn, { backgroundColor: colors.surfaceContainer }]}
                >
                  <Text style={[typography.labelLarge, { color: colors.onSurfaceVariant, fontWeight: '700' }]}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => accept(item)}
                  activeOpacity={0.85}
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[typography.labelLarge, { color: colors.onPrimary, fontWeight: '700' }]}>Accept</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={[styles.waitingPill, { backgroundColor: colors.secondaryContainer }]}>
                  <Text style={[typography.labelMedium, { color: colors.onSecondaryContainer }]}>Waiting for reply</Text>
                </View>
                <TouchableOpacity onPress={() => cancel(item)} hitSlop={10} style={{ marginLeft: 'auto' }}>
                  <Text style={[typography.labelLarge, { color: colors.error, fontWeight: '600' }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  // ── Empty / error / skeleton ───────────────────────────────────────────
  const emptyCard = (icon: React.ReactNode, title: string, text: string, cta?: string, onPress?: () => void) => (
    <View style={[styles.empty, { backgroundColor: colors.surface }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primaryContainer }]}>{icon}</View>
      <Text
        style={[typography.titleSmall, { color: colors.onSurface, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' }]}
      >
        {title}
      </Text>
      <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }]}>{text}</Text>
      {!!cta && (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
          <Text style={[typography.labelLarge, { color: colors.onPrimary, fontWeight: '700' }]}>{cta}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const goSearch = () => navigation.navigate('Search');

  const skeleton = (
    <Animated.View style={{ opacity: pulse }}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={[styles.row, { backgroundColor: colors.surface, marginBottom: spacing.sm }]}>
          <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.surfaceContainer }} />
          <View style={styles.rowBody}>
            <View style={{ width: '45%', height: 14, borderRadius: 6, backgroundColor: colors.surfaceContainer }} />
            <View style={{ width: '75%', height: 12, borderRadius: 6, marginTop: 10, backgroundColor: colors.surfaceContainer }} />
          </View>
        </View>
      ))}
    </Animated.View>
  );

  const refresh = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
  );

  // ── Body ────────────────────────────────────────────────────────────────
  let body: React.ReactNode;
  if (!loaded) {
    body = <View style={styles.listPad}>{skeleton}</View>;
  } else if (error && convs.length === 0) {
    body = (
      <View style={styles.listPad}>
        {emptyCard(
          <MessageCircle size={26} color={colors.primary} />,
          "Couldn't load messages",
          'The server may be waking up. This can take up to 30 seconds.',
          'Try again',
          () => {
            setLoaded(false);
            fetchConversations();
          }
        )}
      </View>
    );
  } else if (tab === 'chats') {
    body = (
      <FlatList
        data={chats}
        keyExtractor={i => i.id}
        renderItem={renderChat}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={styles.listPad}
        showsVerticalScrollIndicator={false}
        refreshControl={refresh}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query ? (
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xl }]}>
              No chats match “{query}”
            </Text>
          ) : (
            emptyCard(
              <MessageCircle size={26} color={colors.primary} />,
              'No chats yet',
              received.length
                ? `You have ${received.length} request${received.length === 1 ? '' : 's'} waiting.`
                : 'Connect with a player and your conversation will show up here.',
              received.length ? 'View requests' : 'Find players near you',
              received.length ? () => setTab('requests') : goSearch
            )
          )
        }
      />
    );
  } else {
    const sections = [
      ...(received.length ? [{ title: 'Received', data: received }] : []),
      ...(sent.length ? [{ title: 'Sent by you', data: sent }] : []),
    ];
    body = (
      <SectionList
        sections={sections}
        keyExtractor={i => i.id}
        renderItem={renderRequest}
        renderSectionHeader={({ section }) => (
          <Text style={[typography.labelMedium, styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
            {section.title.toUpperCase()}
          </Text>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listPad}
        showsVerticalScrollIndicator={false}
        refreshControl={refresh}
        ListEmptyComponent={emptyCard(
          <UserPlus size={26} color={colors.primary} />,
          'No requests',
          'Requests you send and receive will show up here.',
          'Find players near you',
          goSearch
        )}
      />
    );
  }

  return (
    <ScreenWrapper>
      <Header
        showLogo
        showNotificationBell
        notificationCount={unreadNotifs}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      {/* Tabs + search toggle */}
      <View style={styles.topRow}>
        {searchOpen && tab === 'chats' ? (
          <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
            <Search size={18} color={colors.onSurfaceVariant} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search chats"
              placeholderTextColor={colors.onSurfaceVariant}
              style={[typography.bodyMedium, { flex: 1, marginLeft: 8, color: colors.onSurface, paddingVertical: 0 }]}
            />
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setSearchOpen(false);
              }}
              hitSlop={10}
            >
              <X size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View
              style={[styles.segment, { backgroundColor: colors.surfaceContainerHigh }]}
              onLayout={(e: LayoutChangeEvent) => setSegWidth(e.nativeEvent.layout.width)}
            >
              {pillW > 0 && (
                <Animated.View
                  style={[styles.segPill, { width: pillW, backgroundColor: colors.surface, transform: [{ translateX: pillX }] }]}
                />
              )}
              {(['chats', 'requests'] as Tab[]).map(t => {
                const active = t === tab;
                const count = t === 'chats' ? unreadChats : received.length;
                return (
                  <Pressable key={t} style={styles.segItem} onPress={() => setTab(t)}>
                    <Text
                      style={[
                        typography.labelLarge,
                        { color: active ? colors.primary : colors.onSurfaceVariant, fontWeight: active ? '700' : '500' },
                      ]}
                    >
                      {t === 'chats' ? 'Chats' : 'Requests'}
                    </Text>
                    {count > 0 && (
                      <View style={[styles.segBadge, { backgroundColor: t === 'requests' ? colors.tertiary : colors.primary }]}>
                        <Text style={[typography.labelSmall, { color: colors.onPrimary, fontWeight: '700', fontSize: 11 }]}>
                          {count > 9 ? '9+' : count}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
            {tab === 'chats' && convs.filter(c => c.status === 'accepted').length > 3 && (
              <TouchableOpacity
                onPress={() => setSearchOpen(true)}
                style={[styles.searchBtn, { backgroundColor: colors.surface }]}
                activeOpacity={0.8}
              >
                <Search size={18} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {body}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    padding: 4,
    borderRadius: borderRadius.full,
  },
  segPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segItem: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segBadge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchBox: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  listPad: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  sectionTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rowBody: {
    flex: 1,
    marginLeft: spacing.md,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: spacing.sm,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtn: {
    marginTop: spacing.lg,
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
