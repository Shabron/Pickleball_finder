/**
 * EditProfileScreen — Edit existing profile
 *
 * Re-uses the same fields as CreateProfile but in a single scrollable form.
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
import { Save, MapPin } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Dropdown from '../../components/common/Dropdown';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

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

const US_STATES = [
  { label: 'Alabama', value: 'AL' }, { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' }, { label: 'California', value: 'CA' },
  { label: 'Colorado', value: 'CO' }, { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' }, { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' }, { label: 'Texas', value: 'TX' },
];

const AVAILABILITY_SLOTS = [
  'Mon AM', 'Mon PM', 'Tue AM', 'Tue PM', 'Wed AM', 'Wed PM',
  'Thu AM', 'Thu PM', 'Fri AM', 'Fri PM', 'Sat AM', 'Sat PM',
  'Sun AM', 'Sun PM',
];

export default function EditProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState({
    name: 'Arthur Smith',
    bio: 'Retired teacher, love playing pickleball at the courts near Riverside.',
    ageRange: '60-65',
    skillLevel: 'intermediate',
    playStyle: 'doubles',
    state: 'FL',
    city: 'Sarasota',
    zipCode: '34236',
    availability: ['Mon AM', 'Wed AM', 'Fri AM', 'Sat AM'],
  });
  const [loading, setLoading] = useState(false);
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

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.goBack();
    }, 800);
  };

  return (
    <ScreenWrapper>
      <Header title="Edit Profile" showBack onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <Avatar name={profile.name} size={sizes.avatarXLarge} />
            <TouchableOpacity
              style={[styles.changePhotoBtn, { backgroundColor: colors.secondaryContainer }]}
            >
              <Text style={[typography.labelLarge, { color: colors.onSecondaryContainer }]}>
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: spacing.lg }]}>
            About You
          </Text>

          <Input
            label="Full Name"
            value={profile.name}
            onChangeText={(t) => updateField('name', t)}
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Input
            label="Bio"
            placeholder="Tell others about yourself..."
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
            options={SKILL_OPTIONS}
            value={profile.skillLevel}
            onSelect={(val) => updateField('skillLevel', val)}
            style={{ marginBottom: spacing.lg }}
          />

          <Dropdown
            label="Play Style"
            options={PLAY_STYLE_OPTIONS}
            value={profile.playStyle}
            onSelect={(val) => updateField('playStyle', val)}
            style={{ marginBottom: spacing.xxl }}
          />

          {/* Location */}
          <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: spacing.lg }]}>
            Location
          </Text>

          <Dropdown
            label="State"
            options={US_STATES}
            value={profile.state}
            onSelect={(val) => updateField('state', val)}
            style={{ marginBottom: spacing.lg }}
          />

          <Input
            label="City"
            icon={<MapPin color={colors.onSurfaceVariant} size={sizes.iconSmall} />}
            value={profile.city}
            onChangeText={(t) => updateField('city', t)}
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Input
            label="Zip Code"
            value={profile.zipCode}
            onChangeText={(t) => updateField('zipCode', t)}
            keyboardType="number-pad"
            containerStyle={{ marginBottom: spacing.xxl }}
          />

          {/* Availability */}
          <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: spacing.md }]}>
            Availability
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.lg }]}>
            Tap slots to toggle
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
                      { color: isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant },
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save */}
          <Button
            title="SAVE CHANGES"
            onPress={handleSave}
            loading={loading}
            icon={<Save color={colors.surfaceContainerLowest} size={18} />}
            style={{ marginTop: spacing.xxl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.massive,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: spacing.xxl,
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
});
