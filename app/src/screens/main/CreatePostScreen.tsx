/**
 * CreatePostScreen — v2 (create + edit)
 *
 *  - Plain-language form: what you're looking for, details, where, who
 *  - Skill level + play style as tap chips (no dropdowns)
 *  - Location: one-tap "Use my location" or state + city
 *  - Inline validation, character hints, real error messages
 *  - Edit mode warns before leaving with unsaved changes
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Dropdown from '../../components/common/Dropdown';
import LocationAutofillButton, { LocatedResult } from '../../components/common/LocationAutofillButton';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { postApi, profileApi } from '../../services/api';
import { US_STATES } from '../../constants/states';

const SKILL_OPTIONS = [
  { label: 'Any level', hint: 'All welcome', value: '' },
  { label: 'Beginner', hint: '1.0 – 2.5', value: 'beginner' },
  { label: 'Low Intermediate', hint: '3.0 – 3.5', value: 'lowIntermediate' },
  { label: 'High Intermediate', hint: '3.5 – 4.0', value: 'highIntermediate' },
  { label: 'Advanced', hint: '4.0 – 5.0', value: 'advanced' },
  { label: 'Professional', hint: '5.0+', value: 'professional' },
];

const PLAY_STYLE_OPTIONS = [
  { label: 'Doubles', value: 'doubles' },
  { label: 'Mixed', value: 'mixed' },
  { label: 'Singles', value: 'singles' },
  { label: 'Any', value: 'any' },
];

// Short tile label → full title it fills in
const TITLE_IDEAS = [
  { short: 'Doubles partner', full: 'Looking for a doubles partner' },
  { short: 'Weekday mornings', full: 'Weekday morning games' },
  { short: 'New in town', full: 'New to the area — who plays?' },
];

const TITLE_MAX = 80;

/** Older posts stored the full state name ("Florida"); the picker uses codes. */
function toStateCode(v?: string): string {
  if (!v) return '';
  const hit = US_STATES.find(s => s.value === v || s.label.toLowerCase() === v.toLowerCase());
  return hit ? hit.value : v;
}
const DESC_MAX = 500;

export default function CreatePostScreen({ navigation, route }: any) {
  const { colors, typography } = useTheme();
  const post = route?.params?.post;
  const isEditing = !!post;

  const initial = useMemo(
    () => ({
      title: post?.title || '',
      description: post?.description || '',
      state: toStateCode(post?.state),
      city: post?.city || '',
      skillLevel: post?.skillLevel || '',
      playStyle: post?.playStyle || '',
      latitude: undefined as number | undefined,
      longitude: undefined as number | undefined,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saved = useRef(false);

  // New post: prefill location + level from the user's profile.
  useEffect(() => {
    if (isEditing) return;
    profileApi
      .getProfile()
      .then((res: any) => {
        const p = res?.data;
        if (!p) return;
        setForm(f => ({
          ...f,
          state: f.state || toStateCode(p.state),
          city: f.city || p.city || '',
          skillLevel: f.skillLevel || p.skillLevel || '',
          playStyle: f.playStyle || p.playStyle || '',
        }));
      })
      .catch(() => {});
  }, [isEditing]);

  const set = (field: keyof typeof form, value: any) => setForm(f => ({ ...f, [field]: value }));

  const handleLocated = (r: LocatedResult) =>
    setForm(f => ({ ...f, latitude: r.latitude, longitude: r.longitude, state: r.state || f.state, city: r.city || f.city }));

  const errors = {
    title: !form.title.trim() ? 'Add a short title' : undefined,
    description: !form.description.trim() ? 'Add a few details for other players' : undefined,
    state: !form.state ? 'Choose your state' : undefined,
  };
  const isValid = !errors.title && !errors.description && !errors.state;

  const dirty = isEditing
    ? form.title !== initial.title ||
      form.description !== initial.description ||
      form.state !== initial.state ||
      form.city !== initial.city ||
      form.skillLevel !== initial.skillLevel ||
      form.playStyle !== initial.playStyle
    : !!(form.title.trim() || form.description.trim()); // prefilled fields don't count

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (saved.current || !dirty || saving) return;
      e.preventDefault();
      Alert.alert('Discard changes?', 'Your changes will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsub;
  }, [navigation, dirty, saving]);

  const handleSubmit = async () => {
    setTriedSubmit(true);
    setError(null);
    if (!isValid) return;
    setSaving(true);
    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      skillLevel: form.skillLevel || undefined,
      playStyle: form.playStyle || undefined,
    };
    try {
      const res = isEditing ? await postApi.updatePost(post._id, payload) : await postApi.createPost(payload);
      if (res && res.success === false) throw new Error(res.message);
      saved.current = true;
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.message || '';
      setError(
        /network|fetch|timeout/i.test(msg)
          ? "Couldn't reach the server. It may be waking up — please try again in a few seconds."
          : msg || 'Something went wrong. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ── UI helpers ──────────────────────────────────────────────────────────
  // Field labels use the same style as the Input/Dropdown labels (State, City).
  const label = (text: string, optional?: boolean) => (
    <Text style={[typography.titleSmall, styles.label, { color: colors.onSurface }]}>
      {text}
      {optional ? <Text style={{ color: colors.onSurfaceVariant }}>  · optional</Text> : null}
    </Text>
  );

  const heading = (text: string) => (
    <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700' }]}>{text}</Text>
  );

  /** Equal-width grid tile: label on top, optional hint below, centred. */
  const tile = (key: string, text: string, selected: boolean, onPress: () => void, hint?: string, basis = '48%') => (
    <TouchableOpacity
      key={key}
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.tile,
        { flexBasis: basis as any, backgroundColor: selected ? colors.primary : colors.surfaceContainer },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Text
        numberOfLines={1}
        style={[typography.bodyLarge, { color: selected ? colors.onPrimary : colors.onSurface, fontWeight: selected ? '700' : '500' }]}
      >
        {text}
      </Text>
      {!!hint && (
        <Text style={[typography.bodySmall, { color: selected ? 'rgba(255,255,255,0.85)' : colors.onSurfaceVariant, marginTop: 2 }]}>
          {hint}
        </Text>
      )}
    </TouchableOpacity>
  );

  const counter = (n: number, max: number) => (
    <Text style={[typography.labelSmall, { color: n > max * 0.9 ? colors.tertiary : colors.onSurfaceVariant, alignSelf: 'flex-end', marginTop: 4 }]}>
      {n}/{max}
    </Text>
  );

  return (
    <ScreenWrapper>
      <Header title={isEditing ? 'Edit post' : 'New post'} showBack onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* What */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {heading('What are you looking for?')}
            <View style={{ height: spacing.md }} />
            <Input
              placeholder="e.g. Looking for a doubles partner"
              value={form.title}
              onChangeText={t => set('title', t.slice(0, TITLE_MAX))}
              error={triedSubmit ? errors.title : undefined}
              maxLength={TITLE_MAX}
            />
            {!form.title && (
              <>
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: spacing.sm, marginBottom: spacing.xs }]}>
                  Or tap an idea:
                </Text>
                <View style={styles.ideaRow}>
                  {TITLE_IDEAS.map(t => (
                    <TouchableOpacity
                      key={t.short}
                      onPress={() => set('title', t.full)}
                      style={[styles.idea, { backgroundColor: colors.primaryContainer }]}
                      activeOpacity={0.8}
                    >
                      <Text numberOfLines={1} style={[typography.labelLarge, { color: colors.primary }]}>
                        {t.short}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {label('Details')}
            <Input
              placeholder="When do you like to play? Which courts? Anything partners should know?"
              value={form.description}
              onChangeText={t => set('description', t.slice(0, DESC_MAX))}
              multiline
              numberOfLines={4}
              maxLength={DESC_MAX}
              error={triedSubmit ? errors.description : undefined}
            />
            {counter(form.description.length, DESC_MAX)}
          </View>

          {/* Where */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {heading('Where')}
            <LocationAutofillButton onLocated={handleLocated} style={{ marginTop: spacing.md, marginBottom: spacing.md }} />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Dropdown label="State" placeholder="State" options={US_STATES} value={form.state} onSelect={v => set('state', v)} />
                {triedSubmit && errors.state && (
                  <Text style={[typography.labelSmall, { color: colors.error, marginTop: 4 }]}>{errors.state}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Input label="City" placeholder="City" value={form.city} onChangeText={t => set('city', t)} />
              </View>
            </View>
          </View>

          {/* Who */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {heading("Who you'd like to play with")}
            {label('Skill level')}
            <View style={styles.grid}>
              {SKILL_OPTIONS.map(o =>
                tile(o.value || 'any', o.label, form.skillLevel === o.value, () => set('skillLevel', o.value), o.hint)
              )}
            </View>
            {label('Play style', true)}
            <View style={[styles.segment, { backgroundColor: colors.surfaceContainer }]}>
              {PLAY_STYLE_OPTIONS.map(o => {
                const selected = form.playStyle === o.value;
                return (
                  <TouchableOpacity
                    key={o.value}
                    onPress={() => set('playStyle', selected ? '' : o.value)}
                    activeOpacity={0.8}
                    style={[styles.segmentItem, selected && { backgroundColor: colors.primary }]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[typography.bodyLarge, { color: selected ? colors.onPrimary : colors.onSurface, fontWeight: selected ? '700' : '500' }]}
                    >
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: colors.errorContainer }]}>
              <Text style={[typography.bodyMedium, { color: colors.onErrorContainer }]}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Fixed submit bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.85}
            style={[styles.submit, { backgroundColor: isValid ? colors.primary : colors.surfaceContainerHigh }]}
          >
            {saving ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[typography.labelLarge, { color: isValid ? colors.onPrimary : colors.onSurfaceVariant, fontWeight: '700', fontSize: 16 }]}>
                {isEditing ? 'Save changes' : 'Publish post'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  ideaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  idea: {
    flex: 1,
    height: 40,
    paddingHorizontal: 6,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  tile: {
    flexGrow: 0,
    height: 60,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row2: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  // bottom bar: flat white, no shadow slab
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  submit: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
