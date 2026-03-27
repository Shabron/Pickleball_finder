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
} from 'react-native';
import { ArrowRight, ArrowLeft, User, MapPin } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Dropdown from '../../components/common/Dropdown';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

const SKILL_OPTIONS = [
  { label: 'Beginner (1.0 - 2.5)', value: 'beginner' },
  { label: 'Intermediate (3.0 - 4.0)', value: 'intermediate' },
  { label: 'Advanced (4.5+)', value: 'advanced' },
];

const PLAY_STYLE_OPTIONS = [
  { label: 'Singles', value: 'singles' },
  { label: 'Doubles', value: 'doubles' },
  { label: 'Mixed Doubles', value: 'mixed' },
  { label: 'Any / All Types', value: 'any' },
];

const US_STATES = [
  { label: 'Alabama', value: 'AL' }, { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' }, { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' }, { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' }, { label: 'Delaware', value: 'DE' },
  { label: 'Florida', value: 'FL' }, { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' }, { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' }, { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' }, { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' }, { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' }, { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' }, { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' }, { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' }, { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' }, { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' }, { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' }, { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' }, { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' }, { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' }, { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' }, { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' }, { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' }, { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' }, { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' }, { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' }, { label: 'Wyoming', value: 'WY' },
  { label: 'District of Columbia', value: 'DC' },
];

const AVAILABILITY_SLOTS = [
  'Mon AM', 'Mon PM', 'Tue AM', 'Tue PM', 'Wed AM', 'Wed PM',
  'Thu AM', 'Thu PM', 'Fri AM', 'Fri PM', 'Sat AM', 'Sat PM',
  'Sun AM', 'Sun PM',
];

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
    availability: [] as string[],
  });
  const { colors, typography } = useTheme();

  const updateField = (field: string, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAvailability = (slot: string) => {
    setProfile((prev) => ({
      ...prev,
      availability: prev.availability.includes(slot)
        ? prev.availability.filter((s) => s !== slot)
        : [...prev.availability, slot],
    }));
  };

  const handleComplete = () => {
    navigation.replace('MainTabs');
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
                Tap the time slots when you're typically free to play
              </Text>

              <View style={styles.availGrid}>
                {AVAILABILITY_SLOTS.map((slot) => {
                  const isSelected = profile.availability.includes(slot);
                  return (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => toggleAvailability(slot)}
                      style={[
                        styles.availSlot,
                        {
                          backgroundColor: isSelected
                            ? colors.primaryContainer
                            : colors.surfaceContainerHigh,
                          borderColor: isSelected ? colors.primary : colors.transparent,
                          borderWidth: isSelected ? 1.5 : 0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.labelMedium,
                          {
                            color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                          },
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {profile.availability.length > 0 && (
                <Text
                  style={[
                    typography.bodyMedium,
                    { color: colors.primary, marginTop: spacing.lg },
                  ]}
                >
                  {profile.availability.length} slots selected
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
            icon={
              step < TOTAL_STEPS ? (
                <ArrowRight color={colors.surfaceContainerLowest} size={18} />
              ) : undefined
            }
            style={{ flex: step > 1 ? 1 : undefined }}
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
  availGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  availSlot: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  navButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
  },
});
