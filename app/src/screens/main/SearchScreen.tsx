/**
 * SearchScreen — Find players (v2)
 *
 * Never-empty strategy (small user base):
 *  - Nearby fetches players nearest-first with no practical cap, then splits
 *    them client-side into "Within X mi" and "Further away". If nobody is
 *    inside the radius, the closest players are still shown.
 *  - Zip is resolved to coordinates on the backend and works the same way.
 *  - Whenever the primary search has no results (no location yet, no zip
 *    entered, empty state), a nationwide list is shown underneath instead.
 *  - Only if the whole app has no other players do we show an invite card.
 *
 * Performance: profile is fetched quietly on focus (no full-screen spinner
 * after the first visit); changing the radius re-splits locally, no refetch.
 */
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Alert,
  Share,
  LayoutChangeEvent,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SlidersHorizontal, MapPin, Search, Sparkles, ChevronRight, Users, LocateFixed } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Dropdown from '../../components/common/Dropdown';
import Input from '../../components/common/Input';
import PlayerProfileCard, { PlayerProfileData } from '../../components/PlayerProfileCard';
import FilterBottomSheet, { FilterState, DEFAULT_FILTERS } from '../../components/FilterBottomSheet';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { matchmakingApi, messageApi, profileApi } from '../../services/api';
import { requestLocationPermission, getCurrentCoords } from '../../services/location';
import { US_STATES_FOR_SEARCH } from '../../constants/states';
import { API_BASE_URL } from '@env';

const AVATAR_BASE_URL = API_BASE_URL.replace(/\/api$/, '');
const KM_PER_MI = 1.609344;
/** Nearby fetch radius — wide enough to cover the US so the list never runs dry. */
const WIDE_RADIUS_KM = 5000;
const RADII_MI = [5, 12, 25, 50];
const PAGE = 25;
const ZIP_REGEX = /^\d{5}$/;

type SearchMode = 'nearby' | 'state' | 'zip';
const MODES: { key: SearchMode; label: string }[] = [
  { key: 'nearby', label: 'Nearby' },
  { key: 'state', label: 'By State' },
  { key: 'zip', label: 'By Zip' },
];

// Filter chip label → stored profile value
const SKILL_KEY: Record<string, string> = {
  Beginner: 'beginner',
  'Low Intermediate': 'lowIntermediate',
  'High Intermediate': 'highIntermediate',
  Advanced: 'advanced',
  Professional: 'professional',
};

type Row =
  | { kind: 'header'; key: string; title: string; count?: number }
  | { kind: 'notice'; key: string; text: string }
  | { kind: 'player'; key: string; player: PlayerProfileData };

interface Me {
  skillLevel?: string;
  playStyle?: string;
  city?: string;
  state?: string;
}

function mapPlayer(p: any): PlayerProfileData {
  const coords = p.location?.coordinates;
  const mi = p.distanceKm != null ? p.distanceKm / KM_PER_MI : undefined;
  return {
    id: p.user?._id || p._id,
    name: p.user?.name || 'Unknown',
    level: p.skillLevel || '',
    distanceMi: mi,
    distance: mi != null ? (mi < 0.1 ? '< 0.1 mi' : `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`) : 'Unknown',
    city: p.city || undefined,
    state: p.state || undefined,
    avatarUri: p.avatar ? `${AVATAR_BASE_URL}${p.avatar}` : undefined,
    matchScore: p.matchScore,
    playStyle: p.playStyle || undefined,
    age: p.age || undefined,
    connectionStatus: p.connectionStatus || 'none',
    conversationId: p.conversationId,
    coordinate: Array.isArray(coords) && coords.length === 2 ? { latitude: coords[1], longitude: coords[0] } : undefined,
    avgRating: p.avgRating,
    ratingCount: p.ratingCount,
    emailVerified: p.user?.emailVerified,
  };
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow({ pulse }: { pulse: Animated.Value }) {
  const { colors } = useTheme();
  const bar = (w: string, h: number, mt = 0) => (
    <View style={{ width: w as any, height: h, marginTop: mt, borderRadius: 6, backgroundColor: colors.surfaceContainer }} />
  );
  return (
    <Animated.View style={[styles.skeleton, { backgroundColor: colors.surface, opacity: pulse }]}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surfaceContainer }} />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        {bar('55%', 14)}
        {bar('35%', 12, 8)}
        {bar('45%', 12, 8)}
      </View>
      <View style={{ width: 92, height: 36, borderRadius: 18, backgroundColor: colors.surfaceContainer }} />
    </Animated.View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SearchScreen({ navigation }: any) {
  const { colors, typography } = useTheme();

  // Profile / context
  const [me, setMe] = useState<Me | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [locating, setLocating] = useState(false);

  // Mode + params
  const [searchMode, setSearchMode] = useState<SearchMode>('nearby');
  const [radiusMi, setRadiusMi] = useState(12);
  const [selectedState, setSelectedState] = useState('ALL');
  const [zipInput, setZipInput] = useState('');
  const [zipError, setZipError] = useState<string | null>(null);
  const [activeZip, setActiveZip] = useState<string | null>(null);

  // Results
  const [allPlayers, setAllPlayers] = useState<PlayerProfileData[]>([]);
  const [fallback, setFallback] = useState<PlayerProfileData[]>([]);
  const [fallbackLoaded, setFallbackLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const requestId = useRef(0);

  // Filters
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Segmented control pill
  const [segWidth, setSegWidth] = useState(0);
  const pillX = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.5)).current;

  // ── Profile: quiet refresh on every focus, no blocking spinner ──────────
  const loadProfile = useCallback(async () => {
    try {
      const res = await profileApi.getProfile();
      if (res.success && res.data) {
        setUnreadCount(res.unreadNotificationsCount || 0);
        const d = res.data;
        setMe({ skillLevel: d.skillLevel, playStyle: d.playStyle, city: d.city, state: d.state });
        const coords = d.location?.coordinates;
        setUserLocation(prev => {
          if (!(Array.isArray(coords) && coords.length === 2)) return prev;
          if (prev && prev.latitude === coords[1] && prev.longitude === coords[0]) return prev;
          return { latitude: coords[1], longitude: coords[0] };
        });
      }
    } catch (e) {
      console.warn('SearchScreen: profile load failed', e);
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  // ── Nationwide fallback (fetched once, reused everywhere) ───────────────
  const loadFallback = useCallback(async () => {
    try {
      const res = await matchmakingApi.getNearbyPlayers({ mode: 'state', state: 'ALL', limit: PAGE, offset: 0 });
      if (res.success && res.data) setFallback(res.data.map(mapPlayer));
    } catch (e) {
      console.warn('SearchScreen: fallback load failed', e);
    } finally {
      setFallbackLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadFallback();
  }, [loadFallback]);

  // ── Primary search ──────────────────────────────────────────────────────
  const canSearch =
    (searchMode === 'nearby' && !!userLocation) ||
    searchMode === 'state' ||
    (searchMode === 'zip' && !!activeZip);

  const fetchPlayers = useCallback(
    async (offset = 0) => {
      if (!canSearch) return;
      const id = ++requestId.current;
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);
      try {
        const params =
          searchMode === 'nearby'
            ? { mode: 'nearby' as const, lat: userLocation!.latitude, lng: userLocation!.longitude, radiusKm: WIDE_RADIUS_KM }
            : searchMode === 'state'
            ? { mode: 'state' as const, state: selectedState }
            : { mode: 'zip' as const, zipCode: activeZip! };
        const res = await matchmakingApi.getNearbyPlayers({ ...params, limit: PAGE, offset });
        if (id !== requestId.current) return; // a newer search superseded this one
        const mapped: PlayerProfileData[] = res.success && res.data ? res.data.map(mapPlayer) : [];
        setAllPlayers(prev => (offset === 0 ? mapped : [...prev, ...mapped]));
        setHasMore(Boolean(res.hasMore));
      } catch (e) {
        console.warn('SearchScreen: search failed', e);
        if (id === requestId.current && offset === 0) {
          setAllPlayers([]);
          setHasMore(false);
        }
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
          setSearched(true);
        }
      }
    },
    [canSearch, searchMode, userLocation, selectedState, activeZip]
  );

  useEffect(() => {
    if (!profileLoaded) return;
    setAllPlayers([]);
    setHasMore(false);
    setSearched(false);
    if (canSearch) fetchPlayers(0);
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoaded, searchMode, userLocation, selectedState, activeZip]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadFallback(), canSearch ? fetchPlayers(0) : Promise.resolve()]);
    setRefreshing(false);
  }, [loadProfile, loadFallback, fetchPlayers, canSearch]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore || !canSearch) return;
    fetchPlayers(allPlayers.length);
  }, [loading, loadingMore, hasMore, canSearch, fetchPlayers, allPlayers.length]);

  // ── Location refresh (compact button) ───────────────────────────────────
  const refreshLocation = async () => {
    setLocating(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert('Location off', 'Turn on location access in Settings, or search By Zip instead.');
        return;
      }
      const coords = await getCurrentCoords();
      if (!coords) {
        Alert.alert("Couldn't find you", 'Try again in a moment, or search By Zip instead.');
        return;
      }
      setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
      try {
        const geo = await profileApi.reverseGeocode(coords.latitude, coords.longitude);
        if (geo.success && geo.data) {
          setMe(prev => ({ ...(prev || {}), city: geo.data.city || prev?.city, state: geo.data.state || prev?.state }));
        }
      } catch {
        // coordinates are enough to search
      }
    } finally {
      setLocating(false);
    }
  };

  // ── Mode switch with sliding pill ───────────────────────────────────────
  const modeIndex = MODES.findIndex(m => m.key === searchMode);
  const pillW = segWidth > 0 ? (segWidth - 8) / 3 : 0;
  useEffect(() => {
    Animated.spring(pillX, { toValue: modeIndex * pillW, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
  }, [modeIndex, pillW, pillX]);

  // ── Filtering / sorting ─────────────────────────────────────────────────
  const activeFilterCount =
    filters.skillLevels.length + filters.playStyles.length + (filters.sortBy !== 'matchScore' ? 1 : 0);

  const applyFilters = useCallback(
    (list: PlayerProfileData[]) => {
      const skillKeys = filters.skillLevels.map(l => SKILL_KEY[l]).filter(Boolean);
      const styleKeys = filters.playStyles.map(s => s.toLowerCase());
      return list.filter(p => {
        if (skillKeys.length && !skillKeys.includes(p.level)) return false;
        if (styleKeys.length && !styleKeys.includes('any')) {
          const ps = (p.playStyle || '').toLowerCase();
          if (ps !== 'any' && !styleKeys.includes(ps)) return false;
        }
        return true;
      });
    },
    [filters.skillLevels, filters.playStyles]
  );

  const sortList = useCallback(
    (list: PlayerProfileData[]) => {
      const copy = [...list];
      if (filters.sortBy === 'distance') {
        copy.sort((a, b) => (a.distanceMi ?? Infinity) - (b.distanceMi ?? Infinity));
      } else {
        copy.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
      }
      return copy;
    },
    [filters.sortBy]
  );

  const stateLabel = US_STATES_FOR_SEARCH.find(s => s.value === selectedState)?.label || 'All States (Nationwide)';

  // ── Build list rows ─────────────────────────────────────────────────────
  const { rows, playerCount, emptyKind } = useMemo(() => {
    const out: Row[] = [];
    const push = (ps: PlayerProfileData[]) => ps.forEach(p => out.push({ kind: 'player', key: p.id, player: p }));
    const primary = applyFilters(allPlayers);
    const fb = applyFilters(fallback);
    const primaryIds = new Set(primary.map(p => p.id));

    if (canSearch && primary.length > 0) {
      const hasDist = primary.some(p => p.distanceMi != null);
      if ((searchMode === 'nearby' || searchMode === 'zip') && hasDist) {
        const within = sortList(primary.filter(p => (p.distanceMi ?? Infinity) <= radiusMi));
        const further = primary.filter(p => (p.distanceMi ?? Infinity) > radiusMi); // already nearest-first
        const where = searchMode === 'zip' ? ` of ${activeZip}` : '';
        if (within.length) {
          out.push({ kind: 'header', key: 'h-within', title: `Within ${radiusMi} mi${where}`, count: within.length });
          push(within);
        } else {
          out.push({ kind: 'notice', key: 'n-none', text: `No players within ${radiusMi} mi yet — here are the closest ones.` });
        }
        if (further.length) {
          out.push({ kind: 'header', key: 'h-further', title: within.length ? 'Further away' : 'Closest players', count: further.length });
          push(further);
        }
      } else {
        const title =
          searchMode === 'zip' ? `Near ${activeZip}` : selectedState === 'ALL' ? 'Players across the US' : `Players in ${stateLabel}`;
        out.push({ kind: 'header', key: 'h-primary', title, count: primary.length });
        push(sortList(primary));
      }
      return { rows: out, playerCount: primary.length, emptyKind: null as null | string };
    }

    // Primary empty (or not searchable yet) → explain + nationwide fallback
    const primaryDone = !canSearch || searched;
    if (!primaryDone) return { rows: out, playerCount: 0, emptyKind: null };

    if (canSearch && allPlayers.length > 0 && primary.length === 0) {
      return { rows: out, playerCount: 0, emptyKind: 'filtered' };
    }

    const extras = sortList(fb.filter(p => !primaryIds.has(p.id)));
    if (extras.length) {
      if (canSearch) {
        const why =
          searchMode === 'state'
            ? `No players in ${stateLabel} yet.`
            : searchMode === 'zip'
            ? `No players near ${activeZip} yet.`
            : 'No players near you yet.';
        out.push({ kind: 'notice', key: 'n-fb', text: `${why} Here are players across the US you can connect with.` });
      }
      out.push({ kind: 'header', key: 'h-fb', title: 'Players across the US', count: extras.length });
      push(extras);
      return { rows: out, playerCount: extras.length, emptyKind: null };
    }

    if (!fallbackLoaded) return { rows: out, playerCount: 0, emptyKind: null };
    if (fallback.length > 0 && fb.length === 0) return { rows: out, playerCount: 0, emptyKind: 'filtered' };
    return { rows: out, playerCount: 0, emptyKind: 'invite' };
  }, [
    allPlayers, fallback, fallbackLoaded, applyFilters, sortList, canSearch, searched,
    searchMode, radiusMi, activeZip, selectedState, stateLabel,
  ]);

  // Skeleton until we have something to show (or a definitive empty state)
  const showSkeleton = !refreshing && rows.length === 0 && !emptyKind;
  useEffect(() => {
    if (!showSkeleton) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [showSkeleton, pulse]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const updatePlayer = (id: string, patch: Partial<PlayerProfileData>) => {
    const f = (list: PlayerProfileData[]) => list.map(p => (p.id === id ? { ...p, ...patch } : p));
    setAllPlayers(f);
    setFallback(f);
  };

  const handleConnect = async (player: PlayerProfileData) => {
    try {
      if (player.connectionStatus === 'accepted') {
        navigation.navigate('ChatThread', { conversationId: player.conversationId, userId: player.id, name: player.name });
        return;
      }
      if (player.connectionStatus === 'pending_received' && player.conversationId) {
        const res = await messageApi.acceptRequest(player.conversationId);
        if (res.success) {
          updatePlayer(player.id, { connectionStatus: 'accepted' });
          navigation.navigate('ChatThread', { conversationId: player.conversationId, userId: player.id, name: player.name });
        }
        return;
      }
      if (player.connectionStatus === 'pending_sent') return;

      updatePlayer(player.id, { connectionStatus: 'pending_sent' }); // optimistic
      const res = await messageApi.sendMessage(player.id, "Hi! I saw you on Senior Pickleball Partners. Let's play!");
      if (res.success) {
        updatePlayer(player.id, { connectionStatus: 'pending_sent', conversationId: res.conversationId });
      } else {
        updatePlayer(player.id, { connectionStatus: 'none' });
        Alert.alert("Couldn't connect", res.message || 'Please try again.');
      }
    } catch (error: any) {
      updatePlayer(player.id, { connectionStatus: player.connectionStatus });
      Alert.alert("Couldn't connect", error.message || 'Please try again.');
    }
  };

  const handleZipSearch = () => {
    const trimmed = zipInput.trim();
    if (!ZIP_REGEX.test(trimmed)) {
      setZipError('Enter a valid 5-digit zip code');
      return;
    }
    setZipError(null);
    setActiveZip(trimmed);
  };

  const invite = () =>
    Share.share({ message: "I'm using Senior Pickleball Partners to find people to play with — join me!" }).catch(() => {});

  // ── Top controls ────────────────────────────────────────────────────────
  const locationText = me?.city
    ? `Near ${[me.city, me.state].filter(Boolean).join(', ')}`
    : userLocation
    ? 'Near your location'
    : null;

  const Controls = (
    <View>
      {/* Segmented control */}
      <View
        style={[styles.segment, { backgroundColor: colors.surfaceContainerHigh }]}
        onLayout={(e: LayoutChangeEvent) => setSegWidth(e.nativeEvent.layout.width)}
      >
        {pillW > 0 && (
          <Animated.View
            style={[styles.segPill, { width: pillW, backgroundColor: colors.surface, transform: [{ translateX: pillX }] }]}
          />
        )}
        {MODES.map(m => {
          const active = m.key === searchMode;
          return (
            <Pressable key={m.key} style={styles.segItem} onPress={() => setSearchMode(m.key)}>
              <Text
                style={[
                  typography.labelLarge,
                  { color: active ? colors.primary : colors.onSurfaceVariant, fontWeight: active ? '700' : '500' },
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Mode-specific control */}
      {searchMode === 'nearby' && (
        <View style={styles.block}>
          <View style={styles.locRow}>
            <MapPin size={16} color={colors.primary} />
            <Text style={[typography.bodyMedium, { color: colors.onSurface, marginLeft: 6, flex: 1 }]} numberOfLines={1}>
              {locationText || 'Location not set'}
            </Text>
            <TouchableOpacity
              onPress={refreshLocation}
              disabled={locating}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={[styles.locBtn, { backgroundColor: colors.primaryContainer }]}
              activeOpacity={0.8}
            >
              {locating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <LocateFixed size={14} color={colors.primary} />
                  <Text style={[typography.labelMedium, { color: colors.primary, marginLeft: 4, fontWeight: '600' }]}>
                    {userLocation ? 'Update' : 'Use my location'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          {userLocation && (
            <View style={styles.radiusRow}>
              {RADII_MI.map(r => {
                const active = r === radiusMi;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRadiusMi(r)}
                    style={[styles.radiusChip, { backgroundColor: active ? colors.primary : colors.surface }]}
                  >
                    <Text
                      style={[
                        typography.labelMedium,
                        { color: active ? colors.onPrimary : colors.onSurfaceVariant, fontWeight: active ? '700' : '500' },
                      ]}
                    >
                      {r} mi
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}

      {searchMode === 'state' && (
        <View style={styles.block}>
          <Dropdown placeholder="Select a state" options={US_STATES_FOR_SEARCH} value={selectedState} onSelect={setSelectedState} />
        </View>
      )}

      {searchMode === 'zip' && (
        <View style={styles.block}>
          <View style={styles.zipRow}>
            <Input
              placeholder="5-digit zip code"
              value={zipInput}
              onChangeText={t => {
                setZipInput(t);
                if (zipError) setZipError(null);
              }}
              keyboardType="number-pad"
              maxLength={5}
              containerStyle={{ flex: 1, marginBottom: 0 }}
              onSubmitEditing={handleZipSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleZipSearch} activeOpacity={0.8} style={[styles.zipBtn, { backgroundColor: colors.primary }]}>
              <Search size={20} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
          {zipError && <Text style={[typography.bodySmall, { color: colors.error, marginTop: spacing.xs }]}>{zipError}</Text>}
        </View>
      )}

      {/* Skill-level prompt */}
      {me && !me.skillLevel && (
        <Pressable
          onPress={() => navigation.navigate('EditProfile')}
          style={[styles.prompt, { backgroundColor: colors.brandGreenContainer }]}
        >
          <Sparkles size={16} color={colors.brandGreen} />
          <Text style={[typography.bodySmall, { color: colors.onBrandGreenContainer, flex: 1, marginLeft: spacing.sm }]}>
            Add your skill level for better matches
          </Text>
          <ChevronRight size={16} color={colors.brandGreen} />
        </Pressable>
      )}

      {/* Count + filter */}
      <View style={styles.countRow}>
        <Text style={[typography.titleSmall, { color: colors.onSurfaceVariant }]}>
          {showSkeleton ? 'Finding players…' : playerCount > 0 ? `${playerCount} player${playerCount === 1 ? '' : 's'}` : ' '}
        </Text>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: activeFilterCount ? colors.primary : colors.surface }]}
          activeOpacity={0.8}
          onPress={() => setShowFilter(true)}
        >
          <SlidersHorizontal size={15} color={activeFilterCount ? colors.onPrimary : colors.primary} />
          <Text
            style={[
              typography.labelMedium,
              { color: activeFilterCount ? colors.onPrimary : colors.primary, marginLeft: 5, fontWeight: '600' },
            ]}
          >
            Filter{activeFilterCount ? ` · ${activeFilterCount}` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Row renderer ────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Row }) => {
    if (item.kind === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={[typography.labelLarge, { color: colors.onSurface, fontWeight: '700' }]}>{item.title}</Text>
          {item.count != null && (
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginLeft: 6 }]}>{item.count}</Text>
          )}
        </View>
      );
    }
    if (item.kind === 'notice') {
      return (
        <View style={[styles.notice, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[typography.bodySmall, { color: colors.onPrimaryContainer }]}>{item.text}</Text>
        </View>
      );
    }
    return (
      <PlayerProfileCard
        player={item.player}
        me={me || undefined}
        onConnect={() => handleConnect(item.player)}
        onViewProfile={() => navigation.navigate('UserProfile', { userId: item.player.id })}
      />
    );
  };

  const ListEmpty = showSkeleton ? (
    <View>
      <SkeletonRow pulse={pulse} />
      <SkeletonRow pulse={pulse} />
      <SkeletonRow pulse={pulse} />
      <SkeletonRow pulse={pulse} />
    </View>
  ) : emptyKind === 'filtered' ? (
    <View style={styles.empty}>
      <SlidersHorizontal size={36} color={colors.onSurfaceVariant} />
      <Text style={[typography.titleSmall, { color: colors.onSurface, marginTop: spacing.md }]}>No players match these filters</Text>
      <TouchableOpacity onPress={() => setFilters(DEFAULT_FILTERS)} style={[styles.emptyBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
        <Text style={[typography.labelLarge, { color: colors.onPrimary, fontWeight: '700' }]}>Clear filters</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.empty}>
      <Users size={40} color={colors.primary} />
      <Text style={[typography.titleSmall, { color: colors.onSurface, marginTop: spacing.md, textAlign: 'center' }]}>
        You're one of our first players!
      </Text>
      <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: spacing.xs, textAlign: 'center' }]}>
        Invite a friend you play with, or post on Home so new players can find you.
      </Text>
      <TouchableOpacity onPress={invite} style={[styles.emptyBtn, { backgroundColor: colors.primary }]} activeOpacity={0.85}>
        <Text style={[typography.labelLarge, { color: colors.onPrimary, fontWeight: '700' }]}>Invite a friend</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper>
      <Header
        showLogo
        showNotificationBell
        notificationCount={unreadCount}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      <FlatList
        data={rows}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        ListHeaderComponent={Controls}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: spacing.lg }} color={colors.primary} /> : null}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        initialNumToRender={8}
        windowSize={7}
      />

      <FilterBottomSheet
        visible={showFilter}
        filters={filters}
        onApply={setFilters}
        onClose={() => setShowFilter(false)}
        mode={searchMode}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.xxl,
  },
  segment: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  block: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    height: 30,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  radiusChip: {
    flex: 1,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  zipBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  notice: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  skeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
