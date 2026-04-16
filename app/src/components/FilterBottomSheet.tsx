/**
 * FilterBottomSheet — Matchmaking filter panel
 *
 * Slides up from the bottom with filter options:
 *  - Skill Level (multi-select chips)
 *  - Max Distance (single-select)
 *  - Play Style (multi-select chips)
 *  - Status (Online Now / All)
 *  - Sort By
 *
 * Calls onApply with the selected filters, and onClose to dismiss.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { X, RotateCcw, Check } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme/spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.82;

export interface FilterState {
  skillLevels: string[];    // e.g. ['2.5', '3.0']
  maxDistance: string;      // e.g. '5 mi'
  playStyles: string[];     // e.g. ['Doubles', 'Mixed']
  onlineOnly: boolean;
  sortBy: string;           // 'matchScore' | 'distance' | 'recent'
}

export const DEFAULT_FILTERS: FilterState = {
  skillLevels: [],
  maxDistance: 'Any',
  playStyles: [],
  onlineOnly: false,
  sortBy: 'matchScore',
};

interface FilterBottomSheetProps {
  visible: boolean;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
}

// ─── Option sets ─────────────────────────────────────────────────────────────

const SKILL_LEVELS = ['2.0', '2.5', '3.0', '3.5', '4.0', '4.5+'];
const DISTANCES = ['≤ 1 mi', '≤ 3 mi', '≤ 5 mi', '≤ 10 mi', 'Any'];
const PLAY_STYLES = ['Singles', 'Doubles', 'Mixed', 'Any'];
const SORT_OPTIONS = [
  { key: 'matchScore', label: '⚡ Match Score' },
  { key: 'distance', label: '📍 Distance' },
  { key: 'recent', label: '🕐 Recently Active' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ label, colors, typography }: any) {
  return (
    <Text style={[typography.titleSmall, { color: colors.onSurface, fontWeight: '700', marginBottom: spacing.sm, marginTop: spacing.lg }]}>
      {label}
    </Text>
  );
}

function ChipGroup({
  options,
  selected,
  multi = true,
  onToggle,
  colors,
  typography,
}: {
  options: string[];
  selected: string[];
  multi?: boolean;
  onToggle: (val: string) => void;
  colors: any;
  typography: any;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onToggle(opt)}
            activeOpacity={0.75}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.surfaceContainerHigh,
                borderColor: active ? colors.primary : colors.outline,
              },
            ]}
          >
            {active && <Check size={12} color={colors.onPrimary} style={{ marginRight: 4 }} />}
            <Text
              style={[
                typography.labelMedium,
                { color: active ? colors.onPrimary : colors.onSurfaceVariant, fontWeight: active ? '700' : '500' },
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FilterBottomSheet({
  visible,
  filters,
  onApply,
  onClose,
}: FilterBottomSheetProps) {
  const { colors, typography } = useTheme();

  // Local state — committed only on "Apply"
  const [local, setLocal] = useState<FilterState>({ ...filters });

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setLocal({ ...filters }); // sync from parent each open
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 280, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const toggleMulti = (field: 'skillLevels' | 'playStyles', val: string) => {
    setLocal(prev => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val],
      };
    });
  };

  const setSingle = (field: keyof FilterState, val: string | boolean) => {
    setLocal(prev => ({ ...prev, [field]: val }));
  };

  const activeCount =
    local.skillLevels.length +
    local.playStyles.length +
    (local.maxDistance !== 'Any' ? 1 : 0) +
    (local.onlineOnly ? 1 : 0) +
    (local.sortBy !== 'matchScore' ? 1 : 0);

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    setLocal({ ...DEFAULT_FILTERS });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.outline }]} />

        {/* Header */}
        <View style={[styles.sheetHeader, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
            <RotateCcw size={16} color={colors.onSurfaceVariant} />
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginLeft: 4 }]}>
              Reset
            </Text>
          </TouchableOpacity>

          <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700' }]}>
            Filters {activeCount > 0 ? `(${activeCount})` : ''}
          </Text>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Scrollable content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Skill Level ── */}
          <SectionLabel label="🏓 Skill Level" colors={colors} typography={typography} />
          <ChipGroup
            options={SKILL_LEVELS}
            selected={local.skillLevels}
            onToggle={val => toggleMulti('skillLevels', val)}
            colors={colors}
            typography={typography}
          />

          {/* ── Max Distance ── */}
          <SectionLabel label="📍 Max Distance" colors={colors} typography={typography} />
          <ChipGroup
            options={DISTANCES}
            selected={[local.maxDistance]}
            multi={false}
            onToggle={val => setSingle('maxDistance', val)}
            colors={colors}
            typography={typography}
          />

          {/* ── Play Style ── */}
          <SectionLabel label="🎯 Play Style" colors={colors} typography={typography} />
          <ChipGroup
            options={PLAY_STYLES}
            selected={local.playStyles}
            onToggle={val => toggleMulti('playStyles', val)}
            colors={colors}
            typography={typography}
          />

          {/* ── Online Status ── */}
          <SectionLabel label="🟢 Availability" colors={colors} typography={typography} />
          <View style={styles.chipRow}>
            {[
              { label: 'All Players', val: false },
              { label: 'Online Now', val: true },
            ].map(opt => {
              const active = local.onlineOnly === opt.val;
              return (
                <TouchableOpacity
                  key={String(opt.val)}
                  onPress={() => setSingle('onlineOnly', opt.val)}
                  activeOpacity={0.75}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.success : colors.surfaceContainerHigh,
                      borderColor: active ? colors.success : colors.outline,
                    },
                  ]}
                >
                  {active && <Check size={12} color="#fff" style={{ marginRight: 4 }} />}
                  <Text style={[typography.labelMedium, { color: active ? '#fff' : colors.onSurfaceVariant, fontWeight: active ? '700' : '500' }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Sort By ── */}
          <SectionLabel label="↕ Sort By" colors={colors} typography={typography} />
          <View style={styles.sortList}>
            {SORT_OPTIONS.map(opt => {
              const active = local.sortBy === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSingle('sortBy', opt.key)}
                  activeOpacity={0.75}
                  style={[
                    styles.sortRow,
                    {
                      backgroundColor: active ? colors.primaryContainer : colors.surfaceContainerHigh,
                      borderColor: active ? colors.primary : colors.outlineVariant,
                    },
                  ]}
                >
                  <Text style={[typography.bodyMedium, { color: active ? colors.onPrimaryContainer : colors.onSurface, fontWeight: '500', flex: 1 }]}>
                    {opt.label}
                  </Text>
                  {active && (
                    <View style={[styles.sortCheck, { backgroundColor: colors.primary }]}>
                      <Check size={12} color={colors.onPrimary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Apply button */}
        <View style={[styles.footer, { borderTopColor: colors.outlineVariant, backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: colors.primary }]}
            onPress={handleApply}
            activeOpacity={0.85}
          >
            <Text style={[typography.labelLarge, { color: colors.onPrimary, fontWeight: '800', fontSize: 16 }]}>
              Show {activeCount > 0 ? 'Filtered' : 'All'} Matches
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  sortList: {
    gap: spacing.sm,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  sortCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 32 : spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  applyBtn: {
    height: 54,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1D628B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
