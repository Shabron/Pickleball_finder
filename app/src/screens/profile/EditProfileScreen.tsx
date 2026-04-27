/**
 * EditProfileScreen — Edit existing profile
 *
 * Re-uses the same fields as CreateProfile but in a single scrollable form.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Save, MapPin, Check } from 'lucide-react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { API_BASE_URL } from '@env';
import { profileApi } from '../../services/api';
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
const BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export default function EditProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    ageRange: '',
    skillLevel: '',
    playStyle: '',
    state: '',
    city: '',
    zipCode: '',
    availability: {} as Record<string, { start: string; end: string }>,
  });
  const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const { colors, typography } = useTheme();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileApi.getProfile();
        const data = res.data;
        setProfile({
          name: data?.user?.name || '',
          bio: data?.bio || '',
          ageRange: data?.ageRange || '',
          skillLevel: data?.skillLevel || '',
          playStyle: data?.playStyle || '',
          state: data?.state || '',
          city: data?.city || '',
          zipCode: data?.zipCode || '',
          availability: data?.availability || {},
        });
        if (data?.avatar) {
          setAvatarUri(`${BASE_URL}${data.avatar}`);
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, []);

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

  const processImageResult = async (result: any) => {
    if (result.didCancel || !result.assets || result.assets.length === 0) {
      return;
    }
    const asset = result.assets[0];
    if (asset.uri) {
      try {
        setLoading(true);
        const res = await profileApi.uploadAvatar(
          asset.uri,
          asset.type || 'image/jpeg',
          asset.fileName || 'avatar.jpg'
        );
        setAvatarUri(`${BASE_URL}${res.avatar}`);
        Alert.alert('Success', 'Profile photo updated successfully!');
      } catch (err) {
        console.error('Failed to upload', err);
        Alert.alert('Error', 'Failed to upload photo');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePickImage = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await launchCamera({
              mediaType: 'photo',
              quality: 0.8,
            });
            processImageResult(result);
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const result = await launchImageLibrary({
              mediaType: 'photo',
              quality: 0.8,
            });
            processImageResult(result);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await profileApi.updateProfile(profile);
      navigation.goBack();
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header title="Edit Profile" showBack onBack={() => navigation.goBack()} />

      {fetching ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
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
            <Avatar name={profile.name} uri={avatarUri} size={sizes.avatarXLarge} />
            <TouchableOpacity
              style={[styles.changePhotoBtn, { backgroundColor: colors.secondaryContainer }]}
              onPress={handlePickImage}
              disabled={loading}
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
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xl }]}>
            Choose a quick preset or customize your schedule
          </Text>

          {/* ─── Quick Presets ─── */}
          <Text style={[typography.titleSmall, { color: colors.onSurface, marginBottom: spacing.sm }]}>
            Quick Select
          </Text>
          <View style={styles.presetGrid}>
            <TouchableOpacity style={[styles.presetChip, { backgroundColor: colors.secondaryContainer }]} onPress={() => applyPreset('weekdays_evening')}>
              <Text style={[typography.labelMedium, { color: colors.onSecondaryContainer }]}>Weekday Evenings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.presetChip, { backgroundColor: colors.secondaryContainer }]} onPress={() => applyPreset('weekends')}>
              <Text style={[typography.labelMedium, { color: colors.onSecondaryContainer }]}>Weekends</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.presetChip, { backgroundColor: colors.secondaryContainer }]} onPress={() => applyPreset('any')}>
              <Text style={[typography.labelMedium, { color: colors.onSecondaryContainer }]}>Any Time</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.presetChip, { backgroundColor: colors.surfaceContainerHigh }]} onPress={() => applyPreset('clear')}>
              <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]}>Clear All</Text>
            </TouchableOpacity>
          </View>

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
      )}
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
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
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
});
