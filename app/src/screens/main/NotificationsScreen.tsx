/**
 * NotificationsScreen — v2
 *
 *  - Sections: Today / This week / Earlier
 *  - Unread = light blue tint + dot; read = plain
 *  - Repeats collapse: 3 "New Message" from the same chat → "Shaurya sent you 3 messages"
 *  - Tapping a message/request opens that exact chat (falls back to Messages)
 *  - "Mark all read" in the header row
 *  - Skeletons, pull-to-refresh, error state with retry, friendly empty state
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Heart, MessageSquare, Users, FileText, UserPlus, BellOff, Check } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { notificationApi, messageApi } from '../../services/api';

interface RawNotif {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  referenceId?: string;
}

/** One row on screen — may stand for several raw notifications. */
interface Row {
  key: string;
  ids: string[];
  type: string;
  title: string;
  body: string;
  createdAt: string; // newest in the group
  read: boolean; // true only if every item is read
  referenceId?: string;
}

const CHAT_TYPES = ['request_sent', 'request_accepted', 'new_message'];

// ── Time helpers ──────────────────────────────────────────────────────────
const DAY = 86400000;
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

function shortTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (t >= startOfToday()) return `${Math.floor(diff / 3600000)}h`;
  if (t >= startOfToday() - 6 * DAY) {
    return new Date(iso).toLocaleDateString([], { weekday: 'short' });
  }
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function sectionOf(iso: string): 'Today' | 'This week' | 'Earlier' {
  const t = new Date(iso).getTime();
  if (t >= startOfToday()) return 'Today';
  if (t >= startOfToday() - 6 * DAY) return 'This week';
  return 'Earlier';
}

/** "Shaurya: Hi there" → "Shaurya" */
const senderFromBody = (body: string) => {
  const i = body.indexOf(':');
  return i > 0 && i < 40 ? body.slice(0, i).trim() : '';
};

// ── Collapse repeats ──────────────────────────────────────────────────────
function buildRows(list: RawNotif[]): Row[] {
  const groups = new Map<string, RawNotif[]>();
  const order: string[] = [];
  for (const n of list) {
    // Messages collapse per conversation within the same section; everything
    // else collapses only when it is an exact repeat (same type/ref/body).
    const base =
      n.type === 'new_message' && n.referenceId
        ? `msg:${n.referenceId}`
        : `${n.type}:${n.referenceId || ''}:${n.body}`;
    const key = `${sectionOf(n.createdAt)}|${base}`;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(n);
  }

  return order.map(key => {
    const items = groups.get(key)!; // list is newest-first, so items[0] is newest
    const first = items[0];
    const count = items.length;
    let title = first.title;
    let body = first.body;
    if (count > 1 && first.type === 'new_message') {
      const who = senderFromBody(first.body) || 'Someone';
      title = `${who} sent you ${count} messages`;
      body = first.body.slice(who.length + 1).trim() || first.body;
    } else if (count > 1) {
      title = `${first.title} (${count})`;
    }
    return {
      key,
      ids: items.map(i => i.id),
      type: first.type,
      title,
      body,
      createdAt: first.createdAt,
      read: items.every(i => i.read),
      referenceId: first.referenceId,
    };
  });
}

// ── Skeleton ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  const { colors } = useTheme();
  const bar = { backgroundColor: colors.surfaceContainerHigh, borderRadius: 6 };
  return (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <View style={[styles.icon, { backgroundColor: colors.surfaceContainerHigh }]} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={[bar, { height: 14, width: '60%' }]} />
        <View style={[bar, { height: 12, width: '90%' }]} />
      </View>
    </View>
  );
}

export default function NotificationsScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const [raw, setRaw] = useState<RawNotif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const convCache = useRef<Map<string, { userId: string; name: string }> | null>(null);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(false);
    try {
      const res = await notificationApi.getNotifications();
      if (!res?.success || !res.data) throw new Error('bad response');
      const mapped: RawNotif[] = res.data
        .map((n: any) => ({
          id: n._id,
          type: n.type,
          title: n.title,
          body: n.body || '',
          createdAt: n.createdAt,
          read: !!n.read,
          referenceId: n.referenceId ? String(n.referenceId) : undefined,
        }))
        .sort((a: RawNotif, b: RawNotif) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRaw(mapped);
    } catch (e) {
      console.warn('Failed to fetch notifications', e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const rows = useMemo(() => buildRows(raw), [raw]);
  const sections = useMemo(() => {
    const out: { title: string; data: Row[] }[] = [];
    for (const r of rows) {
      const t = sectionOf(r.createdAt);
      const last = out[out.length - 1];
      if (last && last.title === t) last.data.push(r);
      else out.push({ title: t, data: [r] });
    }
    return out;
  }, [rows]);
  const unreadCount = rows.filter(r => !r.read).length;

  const markRead = (ids: string[]) => {
    const set = new Set(ids);
    setRaw(prev => prev.map(n => (set.has(n.id) ? { ...n, read: true } : n)));
    ids.forEach(id => {
      notificationApi.markAsRead(id).catch((e: any) => console.warn('markAsRead failed', e));
    });
  };

  const handleMarkAll = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    const before = raw;
    setRaw(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await notificationApi.markAllAsRead();
    } catch (e) {
      console.warn('markAllAsRead failed', e);
      setRaw(before);
    } finally {
      setMarkingAll(false);
    }
  };

  /** Find who is on the other side of a conversation so we can open that chat. */
  const lookupConversation = async (conversationId: string) => {
    if (!convCache.current) {
      const map = new Map<string, { userId: string; name: string }>();
      const res = await messageApi.getConversations();
      const me = String(res?.currentUserId);
      (res?.data || []).forEach((c: any) => {
        const other = c.participants?.find((p: any) => String(p._id) !== me) || c.participants?.[0];
        if (other?._id) map.set(String(c._id), { userId: String(other._id), name: other.name?.trim() || 'Player' });
      });
      convCache.current = map;
    }
    return convCache.current.get(conversationId);
  };

  const handlePress = async (row: Row) => {
    if (!row.read) markRead(row.ids.filter(id => raw.find(n => n.id === id && !n.read)));

    if (CHAT_TYPES.includes(row.type)) {
      if (row.referenceId) {
        try {
          const c = await lookupConversation(row.referenceId);
          if (c) {
            navigation.navigate('ChatThread', { conversationId: row.referenceId, userId: c.userId, name: c.name });
            return;
          }
        } catch (e) {
          console.warn('conversation lookup failed', e);
        }
      }
      navigation.navigate('MainTabs', { screen: 'Messages' });
    } else if (row.type === 'new_post_nearby' || row.type === 'new_reply') {
      if (row.referenceId) navigation.navigate('PostDetail', { postId: row.referenceId });
    } else if (row.type === 'new_user_nearby') {
      if (row.referenceId) navigation.navigate('UserProfile', { userId: row.referenceId });
    }
  };

  const iconFor = (type: string) => {
    const c = colors.primary;
    switch (type) {
      case 'request_sent':
        return <Heart size={20} color={c} />;
      case 'request_accepted':
        return <UserPlus size={20} color={c} />;
      case 'new_message':
      case 'new_reply':
        return <MessageSquare size={20} color={c} />;
      case 'new_post_nearby':
        return <FileText size={20} color={c} />;
      case 'new_user_nearby':
        return <Users size={20} color={c} />;
      default:
        return <Heart size={20} color={c} />;
    }
  };

  const renderItem = ({ item }: { item: Row }) => (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: item.read ? colors.surface : colors.primaryContainer },
      ]}
      activeOpacity={0.7}
      onPress={() => handlePress(item)}
    >
      <View style={[styles.icon, { backgroundColor: item.read ? colors.primaryContainer : colors.surface }]}>
        {iconFor(item.type)}
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text
            style={[
              typography.bodyLarge,
              { color: colors.onSurface, flex: 1, fontWeight: item.read ? '500' : '700' },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, marginLeft: spacing.sm }]}>
            {shortTime(item.createdAt)}
          </Text>
        </View>
        <Text
          style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 2 }]}
          numberOfLines={2}
        >
          {item.body}
        </Text>
      </View>
      {!item.read && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.list}>
          {[0, 1, 2, 3, 4].map(i => (
            <View key={i} style={{ marginBottom: spacing.sm }}>
              <SkeletonRow />
            </View>
          ))}
        </View>
      );
    }
    if (error && raw.length === 0) {
      return (
        <View style={styles.center}>
          <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700', textAlign: 'center' }]}>
            Couldn't load notifications
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }]}>
            The server may be waking up. Give it a few seconds.
          </Text>
          <TouchableOpacity
            style={[styles.pillBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              setLoading(true);
              fetchNotifications();
            }}
            activeOpacity={0.8}
          >
            <Text style={[typography.labelLarge, { color: '#FFFFFF' }]}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <SectionList
        sections={sections}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={[typography.labelLarge, styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
            {section.title}
          </Text>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={[styles.list, sections.length === 0 && { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchNotifications(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primaryContainer }]}>
              <BellOff size={28} color={colors.primary} />
            </View>
            <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700', textAlign: 'center' }]}>
              You're all caught up
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }]}>
              Requests, messages and replies will show up here.
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <ScreenWrapper>
      <Header title="Notifications" showBack onBack={() => navigation.goBack()} />
      {!loading && unreadCount > 0 && (
        <View style={styles.markRow}>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>{unreadCount} unread</Text>
          <TouchableOpacity
            onPress={handleMarkAll}
            disabled={markingAll}
            activeOpacity={0.7}
            style={styles.markBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Check size={16} color={colors.primary} />
            <Text style={[typography.labelLarge, { color: colors.primary, marginLeft: 4 }]}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}
      {renderBody()}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.massive,
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  markRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  markBtn: { flexDirection: 'row', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.giant,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pillBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
  },
});
