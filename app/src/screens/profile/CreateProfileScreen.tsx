/**
 * CreateProfileScreen — Multi-step profile creation
 *
 * Matches Stitch "Create Profile" design:
 * - Multi-step form: bio, skill level, location, availability, play style
 * - Progress indicator
 * - Responsive layout
 * - Themed components
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { ArrowRight, ArrowLeft, User, MapPin, Check } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Dropdown from '../../components/common/Dropdown';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';
import { profileApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { US_STATES } from '../../constants/states';
import { DAYPART_PRESETS } from '../../constants/availability';

const SKILL_OPTIONS = [
  { label: 'Beginner (1.0 - 2.5)', value: 'beginner' },
  { label: 'Low Intermediate (3.0 - 3.5)', value: 'lowIntermediate' },
  { label: 'High Intermediate (3.5 - 4.0)', value: 'highIntermediate' },
  { label: 'Advanced (4.0 - 5.0)', value: 'advanced' },
  { label: 'Professional (5.0+)', value: 'professional' }
];

const PLAY_STYLE_OPTIONS = [
  { label: 'Singles', value: 'singles' },
  { label: 'Doubles', value: 'doubles' },
  { label: 'Mixed Doubles', value: 'mixed' },
  { label: 'Any / All Types', value: 'any' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const generateTimeOptions = () => {
  const options = [];
  for (let i = 6; i <= 23; i++) {
    const hour = i > 12 ? i - 12 : i === 0 ? 12 : i;
    const ampm = i >= 12 ? 'PM' : 'AM';
    options.push({ label: `${hour}:00 ${ampm}`, value: `${hour}:00 ${ampm}` });
    options.push({ label: `${hour}:30 ${ampm}`, value: `${hour}:30 ${ampm}` });
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const TOTAL_STEPS = 3;

export default function CreateProfileScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    bio: '',
    ageRange: '',
    skillLevel: '',
    playStyle: '',
    state: '',
    city: '',
    zipCode: '',
    availability: {} as Record<string, { start: string; end: string }>,
  });
  const [loading, setLoading] = useState(false);
  const { colors, typography } = useTheme();
  const { updateUser, clearNewSignup } = useAuth();

  const updateField = (field: string, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    setProfile((prev) => {
      const newAvail = { ...prev.availability };
      if (newAvail[day]) {
        delete newAvail[day];
      } else {
        newAvail[day] = { start: '5:00 PM', end: '8:00 PM' };
      }
      return { ...prev, availability: newAvail };
    });
  };

  const updateDayTime = (day: string, field: 'start' | 'end', value: string) => {
    setProfile((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value,
        },
      },
    }));
  };

  // Merges the preset's days/times into the existing schedule instead of
  // replacing it, so multiple dayparts (e.g. Weekday Morning + Weekend Evening)
  // can be combined on top of each other and on top of manual edits below.
  const applyDaypartPreset = (presetKey: string) => {
    const preset = DAYPART_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;
    setProfile((prev) => {
      const avail = { ...prev.availability };
      preset.days.forEach((d) => {
        avail[d] = { start: preset.start, end: preset.end };
      });
      return { ...prev, availability: avail };
    });
  };

  const applyPreset = (preset: string) => {
    if (preset === 'weekdays_evening') {
      const avail: Record<string, { start: string; end: string }> = {};
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(d => {
        avail[d] = { start: '5:00 PM', end: '9:00 PM' };
      });
      setProfile((prev) => ({ ...prev, availability: avail }));
    } else if (preset === 'weekends') {
      const avail: Record<string, { start: string; end: string }> = {};
      ['Sat', 'Sun'].forEach(d => {
        avail[d] = { start: '9:00 AM', end: '5:00 PM' };
      });
      setProfile((prev) => ({ ...prev, availability: avail }));
    } else if (preset === 'any') {
      const avail: Record<string, { start: string; end: string }> = {};
      DAYS.forEach(d => {
        avail[d] = { start: '9:00 AM', end: '9:00 PM' };
      });
      setProfile((prev) => ({ ...prev, availability: avail }));
    } else if (preset === 'clear') {
      setProfile((prev) => ({ ...prev, availability: {} }));
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await profileApi.updateProfile(profile);
      updateUser({ profileComplete: true });
      clearNewSignup();
      navigation.replace('MainTabs');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ─── Progress Header ─── */}
        <View style={styles.progressHeader}>
          <Text style={[typography.titleLarge, { color: colors.onSurface }]}>
            Create Your Profile
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.xs }]}>
            Step {step} of {TOTAL_STEPS}
          </Text>
          <View style={styles.progressBar}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: i < step ? colors.primary : colors.outlineVariant + '40',
                    flex: 1,
                    marginHorizontal: 2,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Step 1: About You ─── */}
          {step === 1 && (
            <View>
              <Text style={[typography.headlineSmall, { color: colors.onSurface, marginBottom: spacing.xl }]}>
                Tell Us About Yourself
              </Text>

              {/* Avatar placeholder */}
              <View style={styles.avatarSection}>
                <Avatar name="You" size={sizes.avatarXLarge} />
                <TouchableOpacity
                  style={[styles.changePhotoBtn, { backgroundColor: colors.secondaryContainer }]}
                >
                  <Text style={[typography.labelLarge, { color: colors.onSecondaryContainer }]}>
                    Add Photo
                  </Text>
                </TouchableOpacity>
              </View>

              <Input
                label="Bio"
                placeholder="Tell others about yourself and what you enjoy about pickleball..."
                value={profile.bio}
                onChangeText={(t) => updateField('bio', t)}
                multiline
                numberOfLines={4}
                containerStyle={{ marginBottom: spacing.lg }}
              />

              <Input
                label="Age Range"
                placeholder="e.g., 60-65"
                value={profile.ageRange}
                onChangeText={(t) => updateField('ageRange', t)}
                containerStyle={{ marginBottom: spacing.lg }}
              />

              <Dropdown
                label="Skill Level"
                placeholder="Select your skill level"
                options={SKILL_OPTIONS}
                value={profile.skillLevel}
                onSelect={(val) => updateField('skillLevel', val)}
                style={{ marginBottom: spacing.lg }}
              />

              <Dropdown
                label="Play Style"
                placeholder="Select your preferred play style"
                options={PLAY_STYLE_OPTIONS}
                value={profile.playStyle}
                onSelect={(val) => updateField('playStyle', val)}
              />
            </View>
          )}

          {/* ─── Step 2: Location ─── */}
          {step === 2 && (
            <View>
              <Text style={[typography.headlineSmall, { color: colors.onSurface, marginBottom: spacing.xl }]}>
                Where Do You Play?
              </Text>

              <Dropdown
                label="State"
                placeholder="Select your state"
                options={US_STATES}
                value={profile.state}
                onSelect={(val) => updateField('state', val)}
                style={{ marginBottom: spacing.lg }}
              />

              <Input
                label="City"
                placeholder="Enter your city"
                icon={<MapPin color={colors.onSurfaceVariant} size={sizes.iconSmall} />}
                value={profile.city}
                onChangeText={(t) => updateField('city', t)}
                containerStyle={{ marginBottom: spacing.lg }}
              />

              <Input
                label="Zip Code (Optional)"
                placeholder="Enter your zip code"
                value={profile.zipCode}
                onChangeText={(t) => updateField('zipCode', t)}
                keyboardType="number-pad"
              />
            </View>
          )}

          {/* ─── Step 3: Availability ─── */}
          {step === 3 && (
            <View>
              <Text style={[typography.headlineSmall, { color: colors.onSurface, marginBottom: spacing.sm }]}>
                When Are You Available?
              </Text>
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xl }]}>
                Choose a quick preset or customize your schedule
              </Text>

              {/* ─── Quick Presets ─── */}
              <Text style={[typography.titleSmall, { color: colors.onSurface, marginBottom: spacing.sm }]}>
                Presets
              </Text>
              <View style={styles.presetGrid}>
                <TouchableOpacity style={[styles.presetChip, { backgroundColor: colors.primary }]} onPress={() => applyPreset('weekdays_evening')}>
                  <Text style={[typography.labelMedium, { color: colors.onPrimary, fontWeight: '700' }]}>Weekday Evenings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.presetChip, { backgroundColor: colors.primary }]} onPress={() => applyPreset('weekends')}>
                  <Text style={[typography.labelMedium, { color: colors.onPrimary, fontWeight: '700' }]}>Weekends</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.presetChip, { backgroundColor: colors.primary }]} onPress={() => applyPreset('any')}>
                  <Text style={[typography.labelMedium, { color: colors.onPrimary, fontWeight: '700' }]}>Any Time</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetChip, styles.presetChipOutline, { backgroundColor: colors.surface, borderColor: colors.outline }]}
                  onPress={() => applyPreset('clear')}
                >
                  <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, fontWeight: '600' }]}>Clear All</Text>
                </TouchableOpacity>
              </View>

              <Text style={[typography.titleSmall, { color: colors.onSurface, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
                By Time of Day
              </Text>
              {(['Weekday', 'Weekend'] as const).map((group) => (
                <View key={group} style={{ marginBottom: spacing.md }}>
                  <Text style={[typography.labelLarge, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
                    {group}
                  </Text>
                  <View style={styles.presetGrid}>
                    {DAYPART_PRESETS.filter((p) => p.group === group).map((preset) => (
                      <TouchableOpacity
                        key={preset.key}
                        style={[styles.presetChip, { backgroundColor: colors.secondary }]}
                        onPress={() => applyDaypartPreset(preset.key)}
                      >
                        <Text style={[typography.labelMedium, { color: colors.onSecondary, fontWeight: '700' }]}>
                          {preset.shortLabel}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              <View style={{ height: 1, backgroundColor: colors.outlineVariant, marginVertical: spacing.xl, opacity: 0.3 }} />

              {/* ─── Custom Schedule ─── */}
              <Text style={[typography.titleSmall, { color: colors.onSurface, marginBottom: spacing.lg }]}>
                Custom Schedule
              </Text>

              {DAYS.map((day) => {
                const isSelected = !!profile.availability[day];
                return (
                  <View key={day} style={styles.dayRow}>
                    <TouchableOpacity
                      onPress={() => toggleDay(day)}
                      style={{ flexDirection: 'row', alignItems: 'center', width: 80 }}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                      >
                        {isSelected && <Check color="white" size={14} />}
                      </View>
                      <Text style={[typography.bodyMedium, { color: colors.onSurface, fontWeight: '600' }]}>
                        {day}
                      </Text>
                    </TouchableOpacity>

                    {isSelected ? (
                      <View style={styles.timeSelectRow}>
                        <Dropdown
                          options={TIME_OPTIONS}
                          value={profile.availability[day].start}
                          onSelect={(val) => updateDayTime(day, 'start', val)}
                          style={{ flex: 1 }}
                          triggerStyle={{ minHeight: 40, paddingHorizontal: spacing.sm }}
                        />
                        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginHorizontal: spacing.sm }]}>
                          to
                        </Text>
                        <Dropdown
                          options={TIME_OPTIONS}
                          value={profile.availability[day].end}
                          onSelect={(val) => updateDayTime(day, 'end', val)}
                          style={{ flex: 1 }}
                          triggerStyle={{ minHeight: 40, paddingHorizontal: spacing.sm }}
                        />
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={{ flex: 1, paddingVertical: 10 }}
                        onPress={() => toggleDay(day)}
                      >
                        <Text style={[typography.bodyMedium, { color: colors.outline, textAlign: 'center' }]}>
                          Tap to set availability
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              {Object.keys(profile.availability).length > 0 && (
                <Text
                  style={[
                    typography.bodyMedium,
                    { color: colors.primary, marginTop: spacing.xl, textAlign: 'center', fontWeight: '500' },
                  ]}
                >
                  {Object.keys(profile.availability).length} days selected
                </Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* ─── Navigation Buttons ─── */}
        <View style={styles.navButtons}>
          {step > 1 && (
            <Button
              title="Back"
              onPress={() => setStep(step - 1)}
              variant="outline"
              icon={<ArrowLeft color={colors.primary} size={18} />}
              style={{ flex: 1, marginRight: spacing.sm }}
            />
          )}
          <Button
            title={step === TOTAL_STEPS ? 'COMPLETE PROFILE' : 'NEXT'}
            onPress={step === TOTAL_STEPS ? handleComplete : () => setStep(step + 1)}
            loading={step === TOTAL_STEPS && loading}
            icon={
              step < TOTAL_STEPS ? (
                <ArrowRight color={colors.surfaceContainerLowest} size={18} />
              ) : undefined
            }
            style={{ 
              flex: step === TOTAL_STEPS ? 1.5 : (step > 1 ? 1 : undefined),
              paddingHorizontal: step === TOTAL_STEPS ? 12 : 24
            }}
            textStyle={step === TOTAL_STEPS ? { fontSize: 13, textAlign: 'center' } : undefined}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  progressHeader: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  progressBar: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    height: 4,
  },
  progressDot: {
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  changePhotoBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  presetChipOutline: {
    borderWidth: 1.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSelectRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
  },
});
