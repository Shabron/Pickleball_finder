/**
 * SearchScreen — MatchMaking (Redesigned)
 *
 * Features:
 *  - App header with logo + "Senior Pickleball Partners" branding
 *  - Nearby / By State / By Zip search modes
 *  - Vertical infinite-scroll FlatList of PlayerProfileCard components
 *  - onEndReached fetches the next page of nearby players from the API
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Dropdown from '../../components/common/Dropdown';
import Input from '../../components/common/Input';
import PlayerProfileCard, { PlayerProfileData } from '../../components/PlayerProfileCard';
import FilterBottomSheet, { FilterState, DEFAULT_FILTERS } from '../../components/FilterBottomSheet';
import LocationAutofillButton from '../../components/common/LocationAutofillButton';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';
import { SlidersHorizontal, MapPin, Search } from 'lucide-react-native';
import { matchmakingApi, messageApi, profileApi } from '../../services/api';
import { US_STATES_FOR_SEARCH } from '../../constants/states';
import { API_BASE_URL } from '@env';

const AVATAR_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

type SearchMode = 'nearby' | 'state' | 'zip';
const ZIP_REGEX = /^\d{5}$/;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SearchScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const [allPlayers, setAllPlayers] = useState<PlayerProfileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [locationMissing, setLocationMissing] = useState(false);

  // ── Search mode (Nearby / By State / By Zip) ──────────────────────────
  const [searchMode, setSearchMode] = useState<SearchMode>('nearby');
  const [selectedState, setSelectedState] = useState('ALL');
  const [zipInput, setZipInput] = useState('');
  const [zipError, setZipError] = useState<string | null>(null);
  const [activeZip, setActiveZip] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        setInitializing(true);
        try {
          const res = await profileApi.getProfile();
          if (res.success && res.data) {
            setUnreadCount(res.unreadNotificationsCount || 0);
            const coords = res.data.location?.coordinates;
            if (Array.isArray(coords) && coords.length === 2) {
              // GeoJSON stores coordinates as [longitude, latitude]
              setUserLocation({ latitude: coords[1], longitude: coords[0] });
              setLocationMissing(false);
            } else {
              setUserLocation(null);
              setLocationMissing(true);
            }
          } else {
            setUserLocation(null);
            setLocationMissing(true);
          }
        } catch (error) {
          console.error('Failed to load profile/location:', error);
          setUserLocation(null);
          setLocationMissing(true);
        } finally {
          setInitializing(false);
        }
      };
      init();
    }, [])
  );

  // Re-runs the search whenever the active mode or its params change
  // (state/zip searches don't need GPS; nearby needs userLocation).
  useEffect(() => {
    if (initializing) return;
    setAllPlayers([]);
    setHasMore(true);
    if (searchMode === 'nearby') {
      if (userLocation) fetchPlayers(0);
    } else if (searchMode === 'state') {
      fetchPlayers(0);
    } else if (searchMode === 'zip') {
      if (activeZip) fetchPlayers(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initializing, searchMode, userLocation, selectedState, activeZip]);

  const fetchPlayers = async (offset = 0) => {
    try {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);

      let res;
      if (searchMode === 'nearby') {
        if (!userLocation) return;
        res = await matchmakingApi.getNearbyPlayers({
          mode: 'nearby',
          lat: userLocation.latitude,
          lng: userLocation.longitude,
          radiusKm: 20,
          limit: 25,
          offset,
        });
      } else if (searchMode === 'state') {
        res = await matchmakingApi.getNearbyPlayers({
          mode: 'state',
          state: selectedState,
          limit: 25,
          offset,
        });
      } else {
        if (!activeZip) return;
        res = await matchmakingApi.getNearbyPlayers({
          mode: 'zip',
          zipCode: activeZip,
          limit: 25,
          offset,
        });
      }

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
            city: p.city || undefined,
            state: p.state || undefined,
            // avatar lives on the Profile document, not the populated user
            // sub-object, and is stored as a relative "/uploads/..." path.
            avatarUri: p.avatar ? `${AVATAR_BASE_URL}${p.avatar}` : undefined,
            matchScore: p.matchScore,
            playStyle: p.playStyle || 'Any',
            age: p.age || undefined,
            connectionStatus: p.connectionStatus || 'none',
            conversationId: p.conversationId,
            coordinate,
            avgRating: p.avgRating,
            ratingCount: p.ratingCount,
            emailVerified: p.user?.emailVerified,
          };
        });
        setAllPlayers(prev => (offset === 0 ? mappedPlayers : [...prev, ...mappedPlayers]));
        setHasMore(Boolean(res.hasMore));
      } else if (offset === 0) {
        setAllPlayers([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('SearchScreen: Failed to fetch players error:', error);
      if (offset === 0) setAllPlayers([]);
    } finally {
      if (offset === 0) setLoading(false);
      else setLoadingMore(false);
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
        "Hi! I saw you on Senior Pickleball Partners. Let's play!"
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

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Active filter count for badge
  const activeFilterCount =
    filters.skillLevels.length +
    filters.playStyles.length +
    (searchMode === 'nearby' && filters.maxDistance !== 'Any' ? 1 : 0) +
    (searchMode === 'nearby' && filters.sortBy !== 'matchScore' ? 1 : 0);

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
    if (searchMode === 'nearby' && filters.maxDistance !== 'Any') {
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
    if (searchMode === 'nearby' && filters.sortBy === 'distance') {
      list.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    } else {
      list.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    }
    return list;
  }, [allPlayers, filters, searchMode]);

  const handleApplyFilters = useCallback((f: FilterState) => setFilters(f), []);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return;
    if (searchMode === 'nearby' && !userLocation) return;
    if (searchMode === 'zip' && !activeZip) return;
    fetchPlayers(allPlayers.length);
  }, [loadingMore, loading, hasMore, userLocation, allPlayers.length, searchMode, activeZip, selectedState]);

  const handleZipSearch = () => {
    const trimmed = zipInput.trim();
    if (!ZIP_REGEX.test(trimmed)) {
      setZipError('Enter a valid 5-digit zip code');
      return;
    }
    setZipError(null);
    setActiveZip(trimmed);
  };

  const selectedStateLabel = US_STATES_FOR_SEARCH.find(s => s.value === selectedState)?.label || 'All States (Nationwide)';

  // ─── Search mode toggle (Nearby / By State / By Zip) ─────────────────
  const SEARCH_MODES: { key: SearchMode; label: string }[] = [
    { key: 'nearby', label: 'Nearby' },
    { key: 'state', label: 'By State' },
    { key: 'zip', label: 'By Zip' },
  ];

  const ModeToggle = (
    <View style={styles.modeToggleRow}>
      {SEARCH_MODES.map(m => {
        const active = searchMode === m.key;
        return (
          <TouchableOpacity
            key={m.key}
            onPress={() => setSearchMode(m.key)}
            activeOpacity={0.8}
            style={[
              styles.modeBtn,
              { backgroundColor: active ? colors.primary : colors.surfaceContainerHigh },
            ]}
          >
            <Text
              style={[
                typography.labelMedium,
                { color: active ? colors.onPrimary : colors.onSurfaceVariant, fontWeight: '700' },
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const ModeControl =
    searchMode === 'state' ? (
      <View style={styles.modeControl}>
        <View style={styles.controlHeadingRow}>
          <MapPin size={18} color={colors.primary} />
          <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '800', marginLeft: 6 }]}>
            Search by State
          </Text>
        </View>
        <Dropdown
          placeholder="Select a state"
          options={US_STATES_FOR_SEARCH}
          value={selectedState}
          onSelect={setSelectedState}
        />
      </View>
    ) : searchMode === 'zip' ? (
      <View style={styles.modeControl}>
        <View style={styles.controlHeadingRow}>
          <MapPin size={18} color={colors.primary} />
          <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '800', marginLeft: 6 }]}>
            Search by Zip Code
          </Text>
        </View>
        <View style={styles.zipRow}>
          <Input
            placeholder="Enter a 5-digit zip code"
            value={zipInput}
            onChangeText={(t) => {
              setZipInput(t);
              if (zipError) setZipError(null);
            }}
            keyboardType="number-pad"
            maxLength={5}
            containerStyle={{ flex: 1 }}
            onSubmitEditing={handleZipSearch}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={handleZipSearch}
            activeOpacity={0.8}
            style={[styles.zipSearchBtn, { backgroundColor: colors.primary }]}
          >
            <Search size={22} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
        {zipError && (
          <Text style={[typography.bodySmall, { color: colors.error, marginTop: spacing.xs }]}>
            {zipError}
          </Text>
        )}
      </View>
    ) : null;

  // Live location refresh for Nearby mode — same reusable component used in
  // onboarding/profile edit. Anchors the mode=nearby query to a fresh GPS
  // fix instead of whatever was last saved on the profile.
  const NearbyLocationRefresh =
    searchMode === 'nearby' ? (
      <View style={styles.modeControl}>
        <LocationAutofillButton
          label="📍 Update My Location"
          onLocated={(result) => {
            setUserLocation({ latitude: result.latitude, longitude: result.longitude });
            setLocationMissing(false);
          }}
        />
      </View>
    ) : null;

  // ─── Top controls (mode toggle, mode-specific control) ────────────────
  const TopControls = (
    <View>
      {ModeToggle}
      {ModeControl}
      {NearbyLocationRefresh}

      {/* ── Match count + filter button ── */}
      <View style={styles.sectionRow}>
        <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '800' }]}>
          {players.length} match{players.length !== 1 ? 'es' : ''} found
        </Text>
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
  ) : !hasMore && allPlayers.length > 0 ? (
    <View style={styles.footerLoader}>
      <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
        🎉 You've seen all the matches!
      </Text>
    </View>
  ) : null;

  // ─── Empty state (varies by mode) ─────────────────────────────────────
  const ListEmpty = loading ? null : (
    <View style={styles.emptyState}>
      <MapPin size={40} color={colors.onSurfaceVariant} />
      <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.md, textAlign: 'center' }]}>
        {searchMode === 'zip' && !activeZip
          ? 'Enter a zip code above and tap Search to find players.'
          : searchMode === 'state'
          ? `No players found ${selectedState === 'ALL' ? 'nationwide' : `in ${selectedStateLabel}`} yet.`
          : searchMode === 'zip'
          ? `No players found near zip ${activeZip}.`
          : 'No players found nearby yet.'}
      </Text>
    </View>
  );

  if (initializing) {
    return (
      <ScreenWrapper>
        <Header showLogo showNotificationBell notificationCount={unreadCount} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (searchMode === 'nearby' && locationMissing) {
    return (
      <ScreenWrapper>
        <Header showLogo showNotificationBell notificationCount={unreadCount} />
        {ModeToggle}
        <View style={styles.centerState}>
          <MapPin size={48} color={colors.primary} />
          <Text style={[typography.titleLarge, { color: colors.onSurface, fontWeight: '800', marginTop: spacing.lg, textAlign: 'center' }]}>
            Add your location
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.sm, textAlign: 'center' }]}>
            We need your city, state, or zip code to show you pickleball players nearby — or switch to "By State" or "By Zip" above.
          </Text>
          <TouchableOpacity
            style={[styles.completeProfileBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={[typography.labelMedium, { color: colors.onPrimary, fontWeight: '700' }]}>
              Complete Profile
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* ── App header with logo ── */}
      <Header
        showLogo
        showNotificationBell
        notificationCount={unreadCount}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      {TopControls}

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
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
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
        mode={searchMode}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flatListContent: {
    paddingBottom: 100,
  },
  modeToggleRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  modeControl: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  controlHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  zipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  zipSearchBtn: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.massive,
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
  footerLoader: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  completeProfileBtn: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
});
