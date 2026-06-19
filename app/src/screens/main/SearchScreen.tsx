/**
 * SearchScreen — MatchMaking (Redesigned)
 *
 * Features:
 *  - App header with logo + "Senior Pickleball" branding
 *  - Nearby players section with a live MapView of approximate locations
 *  - Vertical infinite-scroll FlatList of enlarged PlayerProfileCard components
 *  - onEndReached appends more mock players (simulated pagination)
 */
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MapView from 'react-native-maps';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import PlayerProfileCard, { PlayerProfileData } from '../../components/PlayerProfileCard';
import PlayerMapMarker from '../../components/PlayerMapMarker';
import FilterBottomSheet, { FilterState, DEFAULT_FILTERS } from '../../components/FilterBottomSheet';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { SlidersHorizontal, MapPin } from 'lucide-react-native';
import { matchmakingApi, messageApi, profileApi } from '../../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// TODO: replace with the signed-in user's real (or profile-derived) location
// once on-device location capture / profile geocoding is surfaced here too.
const CURRENT_USER_LOCATION = { latitude: 27.9606, longitude: -82.4572 };

// ─── Mock data ───────────────────────────────────────────────────────────────

const INITIAL_PLAYERS: PlayerProfileData[] = [
  {
    id: '1',
    name: 'Arthur S.',
    age: 67,
    level: '3.0',
    distance: '1.2 mi',
    matchScore: 92,
    playStyle: 'Doubles / Mixed',
    bio: 'Retired teacher who loves the game. Looking for a consistent doubles partner for weekend mornings at Riverside courts.',
    isOnline: true,
    avatarUri: 'https://randomuser.me/api/portraits/men/67.jpg',
  },
  {
    id: '2',
    name: 'Betty L.',
    age: 63,
    level: '3.5',
    distance: '2.5 mi',
    matchScore: 85,
    playStyle: 'Singles / Doubles',
    bio: 'Former tennis player transitioning to pickleball. I play 4× a week and love competitive but friendly matches!',
    isOnline: false,
    avatarUri: 'https://randomuser.me/api/portraits/women/52.jpg',
  },
  {
    id: '3',
    name: 'Clara M.',
    age: 71,
    level: '2.5',
    distance: '0.8 mi',
    matchScore: 78,
    playStyle: 'Doubles',
    bio: 'Just started playing 6 months ago. Looking for patient partners who enjoy the social side of the game.',
    isOnline: true,
    avatarUri: 'https://randomuser.me/api/portraits/women/71.jpg',
  },
  {
    id: '4',
    name: 'David K.',
    age: 59,
    level: '4.0',
    distance: '3.1 mi',
    matchScore: 65,
    playStyle: 'Singles',
    bio: 'Competitive player training for local tournaments. Looking for strong singles opponents to sharpen my game.',
    isOnline: false,
    avatarUri: 'https://randomuser.me/api/portraits/men/44.jpg',
  },
  {
    id: '5',
    name: 'Eleanor R.',
    age: 68,
    level: '3.0',
    distance: '1.8 mi',
    matchScore: 88,
    playStyle: 'Doubles / Any',
    bio: 'Love the camaraderie that comes with pickleball! Active in the senior community and always up for a match.',
    isOnline: true,
    avatarUri: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    id: '6',
    name: 'Frank T.',
    age: 74,
    level: '2.0',
    distance: '4.0 mi',
    matchScore: 72,
    playStyle: 'Doubles',
    bio: 'New to the sport but very enthusiastic. My grandchildren got me into it — best decision ever!',
    isOnline: false,
    avatarUri: 'https://randomuser.me/api/portraits/men/74.jpg',
  },
];

const MORE_PLAYERS: PlayerProfileData[] = [
  {
    id: '7',
    name: 'Grace P.',
    age: 61,
    level: '3.5',
    distance: '2.2 mi',
    matchScore: 90,
    playStyle: 'Doubles / Mixed',
    bio: 'Avid player competing in regional tournaments. Seeking a dependable doubles partner with a strong net game.',
    isOnline: true,
    avatarUri: 'https://randomuser.me/api/portraits/women/61.jpg',
  },
  {
    id: '8',
    name: 'Harold M.',
    age: 69,
    level: '3.0',
    distance: '1.5 mi',
    matchScore: 81,
    playStyle: 'Any',
    bio: 'I play for fun and fitness. Rain or shine, I am at the courts three times a week.',
    isOnline: false,
    avatarUri: 'https://randomuser.me/api/portraits/men/69.jpg',
  },
  {
    id: '9',
    name: 'Irene C.',
    age: 65,
    level: '3.5',
    distance: '3.3 mi',
    matchScore: 76,
    playStyle: 'Singles / Doubles',
    bio: 'Competitive spirit, friendly heart. I love working on strategy and improving every single session.',
    isOnline: true,
    avatarUri: 'https://randomuser.me/api/portraits/women/65.jpg',
  },
  {
    id: '10',
    name: 'James W.',
    age: 72,
    level: '2.5',
    distance: '2.9 mi',
    matchScore: 69,
    playStyle: 'Doubles',
    bio: 'Enjoying retirement one pickleball match at a time. Easy-going and love meeting new players.',
    isOnline: false,
    avatarUri: 'https://randomuser.me/api/portraits/men/72.jpg',
  },
];

// ─── Nearby players preview (used in map placeholder) ────────────────────────
// No real coordinate here — these are only a fallback for when the API
// hasn't returned data yet, so they're never plotted on the map.

const NEARBY_PREVIEW: PlayerProfileData[] = [
  { id: '1', name: 'Arthur S.', level: '3.0', distance: '1.2 mi', avatarUri: 'https://randomuser.me/api/portraits/men/67.jpg' },
  { id: '2', name: 'Betty L.', level: '3.5', distance: '2.5 mi', avatarUri: 'https://randomuser.me/api/portraits/women/52.jpg' },
  { id: '3', name: 'Clara M.', level: '2.5', distance: '0.8 mi', avatarUri: 'https://randomuser.me/api/portraits/women/71.jpg' },
  { id: '5', name: 'Eleanor R.', level: '3.0', distance: '1.8 mi', avatarUri: 'https://randomuser.me/api/portraits/women/68.jpg' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SearchScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const [allPlayers, setAllPlayers] = useState<PlayerProfileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const loadedExtra = useRef(false);

  useFocusEffect(
    useCallback(() => {
      fetchPlayers();
      const fetchUnreadCount = async () => {
        try {
          const res = await profileApi.getProfile();
          if (res.success) {
            setUnreadCount(res.unreadNotificationsCount || 0);
          }
        } catch (error) {
          console.error('Failed to fetch unread notifications count:', error);
        }
      };
      fetchUnreadCount();
    }, [])
  );

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const res = await matchmakingApi.getNearbyPlayers({
        lat: CURRENT_USER_LOCATION.latitude,
        lng: CURRENT_USER_LOCATION.longitude,
        radiusKm: 20,
        limit: 25,
      });

      if (res.success && res.data) {
        const mappedPlayers: PlayerProfileData[] = res.data.map((p: any) => {
          // GeoJSON stores coordinates as [longitude, latitude]
          const coords = p.location?.coordinates;
          const coordinate =
            Array.isArray(coords) && coords.length === 2
              ? { latitude: coords[1], longitude: coords[0] }
              : undefined;

          return {
            id: p.user?._id || p._id,
            name: p.user?.name || 'Unknown',
            level: p.skillLevel || 'N/A',
            distance: p.distanceKm != null ? `${(p.distanceKm * 0.621371).toFixed(1)} mi` : 'Unknown',
            avatarUri: p.user?.avatar || undefined,
            matchScore: Math.floor(Math.random() * 40) + 60,
            playStyle: p.playStyle || 'Any',
            bio: p.bio || '',
            isOnline: Math.random() > 0.5,
            age: p.age || undefined,
            connectionStatus: p.connectionStatus || 'none',
            conversationId: p.conversationId,
            coordinate,
          };
        });
        setAllPlayers(mappedPlayers);
      } else {
        setAllPlayers([]);
      }
    } catch (error) {
      console.error('Failed to fetch players:', error);
      setAllPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (player: PlayerProfileData) => {
    try {
      if (player.connectionStatus === 'accepted') {
        navigation.navigate('ChatThread', {
          conversationId: player.conversationId,
          userId: player.id,
          name: player.name,
        });
        return;
      }

      if (player.connectionStatus === 'pending_received' && player.conversationId) {
        const res = await messageApi.acceptRequest(player.conversationId);
        if (res.success) {
          setAllPlayers(prev => prev.map(p => 
            p.id === player.id ? { ...p, connectionStatus: 'accepted' } : p
          ));
          navigation.navigate('ChatThread', {
            conversationId: player.conversationId,
            userId: player.id,
            name: player.name,
          });
        }
        return;
      }

      if (player.connectionStatus === 'pending_sent') {
        return; // Already sent, do nothing
      }

      // Default: Send an automated intro message (creates pending request)
      const res = await messageApi.sendMessage(
        player.id,
        "Hi! I saw you on Pickleball Finder. Let's play!"
      );
      if (res.success) {
        setAllPlayers(prev => prev.map(p => 
          p.id === player.id ? { ...p, connectionStatus: 'pending_sent', conversationId: res.conversationId } : p
        ));
      } else {
        alert('Failed to send message: ' + res.message);
      }
    } catch (error: any) {
      console.error('Failed to connect:', error);
      alert('Failed to connect: ' + error.message);
    }
  };

  const nearbyPreview = allPlayers.length > 0 ? allPlayers.slice(0, 4) : NEARBY_PREVIEW;

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Active filter count for badge
  const activeFilterCount =
    filters.skillLevels.length +
    filters.playStyles.length +
    (filters.maxDistance !== 'Any' ? 1 : 0) +
    (filters.onlineOnly ? 1 : 0) +
    (filters.sortBy !== 'matchScore' ? 1 : 0);

  // Apply filters + sort
  const players = useMemo(() => {
    let list = [...allPlayers];
    if (filters.skillLevels.length > 0) {
      list = list.filter(p =>
        filters.skillLevels.some(sl =>
          sl === '4.5+' ? parseFloat(p.level) >= 4.5 : parseFloat(sl) === parseFloat(p.level)
        )
      );
    }
    if (filters.maxDistance !== 'Any') {
      const maxMi = parseFloat(filters.maxDistance.replace(/[^\d.]/g, ''));
      list = list.filter(p => parseFloat(p.distance.replace(' mi', '')) <= maxMi);
    }
    if (filters.playStyles.length > 0) {
      list = list.filter(p => {
        if (!p.playStyle) return false;
        if (filters.playStyles.includes('Any')) return true;
        return filters.playStyles.some(s => p.playStyle!.toLowerCase().includes(s.toLowerCase()));
      });
    }
    if (filters.onlineOnly) list = list.filter(p => p.isOnline);
    if (filters.sortBy === 'distance') {
      list.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    } else if (filters.sortBy === 'recent') {
      list.sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
    } else {
      list.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    }
    return list;
  }, [allPlayers, filters]);

  const handleApplyFilters = useCallback((f: FilterState) => setFilters(f), []);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || allLoaded || loadedExtra.current) return;
    loadedExtra.current = true;
    setLoadingMore(true);
    setTimeout(() => {
      setLoadingMore(false);
      setAllLoaded(true);
    }, 500);
  }, [loadingMore, allLoaded]);

  // ─── List Header ────────────────────────────────────────────────────
  const ListHeader = (
    <View>
      {/* ── Section title + filter button ── */}
      <View style={styles.sectionRow}>
        <View>
          <Text style={[typography.headlineSmall, { color: colors.onSurface, fontWeight: '800' }]}>
            Players Near You
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
            {players.length} match{players.length !== 1 ? 'es' : ''} found
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: activeFilterCount > 0 ? colors.primary : colors.primaryContainer }]}
          activeOpacity={0.7}
          onPress={() => setShowFilter(true)}
        >
          <SlidersHorizontal size={18} color={activeFilterCount > 0 ? colors.onPrimary : colors.primary} />
          <Text style={[typography.labelMedium, { color: activeFilterCount > 0 ? colors.onPrimary : colors.primary, marginLeft: 5, fontWeight: '600' }]}>
            Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Nearby players map ── */}
      <View
        style={[
          styles.mapPlaceholder,
          {
            backgroundColor: colors.surfaceContainerHigh,
            borderBottomWidth: 3,
            borderBottomColor: colors.brandGreen,
          },
        ]}
      >
        <MapView
          style={styles.map}
          initialRegion={{
            ...CURRENT_USER_LOCATION,
            latitudeDelta: 0.15,
            longitudeDelta: 0.15,
          }}
        >
          {/* "You" pin */}
          <PlayerMapMarker
            player={{ id: 'me', name: 'You', level: '', distance: '', coordinate: CURRENT_USER_LOCATION, isCurrentUser: true }}
          />

          {/* Player pins — only players with a known (approximate) location */}
          {nearbyPreview
            .filter(p => p.coordinate)
            .map(p => (
              <PlayerMapMarker
                key={p.id}
                player={{
                  id: p.id,
                  name: p.name,
                  level: p.level || '',
                  distance: p.distance,
                  coordinate: p.coordinate!,
                  avatarUri: p.avatarUri,
                }}
                onPress={() => navigation.navigate('UserProfile', { userId: p.id })}
              />
            ))}
        </MapView>

        {/* LIVE badge */}
        <View style={[styles.liveBadge, { backgroundColor: colors.surfaceContainerLowest }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
          <Text style={[typography.labelSmall, { color: colors.onSurface, fontWeight: '600' }]}>LIVE</Text>
        </View>

        {/* Player count pill */}
        <View style={[styles.countPill, { backgroundColor: colors.primary }]}>
          <MapPin size={12} color={colors.onPrimary} />
          <Text style={[typography.labelSmall, { color: colors.onPrimary, fontWeight: '700', marginLeft: 4 }]}>
            {nearbyPreview.length} players nearby
          </Text>
        </View>
      </View>

      {/* ── Matches heading ── */}
      <View style={styles.matchesHeading}>
        <Text style={[typography.titleLarge, { color: colors.onSurface, fontWeight: '800' }]}>
          Suggested Matches
        </Text>
        <View style={[styles.headingAccent, { backgroundColor: colors.brandGreen }]} />
      </View>
    </View>
  );

  // ─── Footer spinner / end message ──────────────────────────────────
  const ListFooter = loadingMore ? (
    <View style={styles.footerLoader}>
      <ActivityIndicator size="small" color={colors.primary} />
      <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}>
        Finding more players…
      </Text>
    </View>
  ) : allLoaded ? (
    <View style={styles.footerLoader}>
      <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
        🎉 You've seen all nearby players!
      </Text>
    </View>
  ) : null;

  return (
    <ScreenWrapper>
      {/* ── App header with logo ── */}
      <Header
        showLogo
        showNotificationBell
        notificationCount={unreadCount}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      <FlatList
        style={{ flex: 1 }}
        data={players}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PlayerProfileCard
            player={item}
            onConnect={() => handleConnect(item)}
            onViewProfile={() => navigation.navigate('UserProfile', { userId: item.id })}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListHeaderComponentStyle={styles.listHeader}
        ListFooterComponent={ListFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />

      {/* ── Filter Bottom Sheet ── */}
      <FilterBottomSheet
        visible={showFilter}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={() => setShowFilter(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flatListContent: {
    paddingBottom: 100,
  },
  listHeader: {
    paddingBottom: spacing.lg,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  // ── Map ──────────────────────────────────────────────────────────────
  mapPlaceholder: {
    height: SCREEN_HEIGHT * 0.34,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  liveBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  countPill: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    left: '50%',
    transform: [{ translateX: -72 }],
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  matchesHeading: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  headingAccent: {
    width: 36,
    height: 3,
    borderRadius: borderRadius.full,
    marginTop: 6,
  },
  footerLoader: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
});
