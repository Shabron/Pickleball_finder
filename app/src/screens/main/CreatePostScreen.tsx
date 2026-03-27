/**
 * CreatePostScreen — Create/edit partner search post
 *
 * Form with title, description, state, city, skill level, play style, preferred times.
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
import { Send } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Dropdown from '../../components/common/Dropdown';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';

const SKILL_OPTIONS = [
  { label: 'Beginner (1.0 - 2.5)', value: 'beginner' },
  { label: 'Intermediate (3.0 - 4.0)', value: 'intermediate' },
  { label: 'Advanced (4.5+)', value: 'advanced' },
  { label: 'Any Level', value: 'any' },
];

const PLAY_STYLE_OPTIONS = [
  { label: 'Singles', value: 'singles' },
  { label: 'Doubles', value: 'doubles' },
  { label: 'Mixed Doubles', value: 'mixed' },
  { label: 'Any', value: 'any' },
];

const US_STATES = [
  { label: 'Alabama', value: 'AL' }, { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' }, { label: 'California', value: 'CA' },
  { label: 'Colorado', value: 'CO' }, { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' }, { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' }, { label: 'Texas', value: 'TX' },
];

const TIME_SLOTS = [
  'Mon AM', 'Mon PM', 'Tue AM', 'Tue PM', 'Wed AM', 'Wed PM',
  'Thu AM', 'Thu PM', 'Fri AM', 'Fri PM', 'Sat AM', 'Sat PM',
  'Sun AM', 'Sun PM',
];

export default function CreatePostScreen({ navigation, route }: any) {
  const isEditing = !!route?.params?.postId;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    state: '',
    city: '',
    skillLevel: '',
    playStyle: '',
    preferredTimes: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const { colors, typography } = useTheme();

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTime = (slot: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredTimes: prev.preferredTimes.includes(slot)
        ? prev.preferredTimes.filter((s) => s !== slot)
        : [...prev.preferredTimes, slot],
    }));
  };

  const isValid = formData.title.trim() && formData.description.trim() && formData.state;

  const handleSubmit = () => {
    if (!isValid) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.goBack();
    }, 800);
  };

  return (
    <ScreenWrapper>
      <Header
        title={isEditing ? 'Edit Post' : 'Create Post'}
        showBack
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[typography.headlineSmall, { color: colors.onSurface, marginBottom: spacing.xl }]}>
            {isEditing ? 'Update Your Post' : 'Find a Partner'}
          </Text>

          <Input
            label="Post Title"
            placeholder="e.g., Looking for Doubles Partner"
            value={formData.title}
            onChangeText={(t) => updateField('title', t)}
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Input
            label="Description"
            placeholder="Describe what you're looking for, your availability, and preferred courts..."
            value={formData.description}
            onChangeText={(t) => updateField('description', t)}
            multiline
            numberOfLines={5}
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Dropdown
            label="State"
            placeholder="Select your state"
            options={US_STATES}
            value={formData.state}
            onSelect={(val) => updateField('state', val)}
            style={{ marginBottom: spacing.lg }}
          />

          <Input
            label="City"
            placeholder="Enter your city"
            value={formData.city}
            onChangeText={(t) => updateField('city', t)}
            containerStyle={{ marginBottom: spacing.lg }}
          />

          <Dropdown
            label="Desired Skill Level"
            placeholder="Select skill level"
            options={SKILL_OPTIONS}
            value={formData.skillLevel}
            onSelect={(val) => updateField('skillLevel', val)}
            style={{ marginBottom: spacing.lg }}
          />

          <Dropdown
            label="Play Style"
            placeholder="Select play style"
            options={PLAY_STYLE_OPTIONS}
            value={formData.playStyle}
            onSelect={(val) => updateField('playStyle', val)}
            style={{ marginBottom: spacing.xxl }}
          />

          {/* Preferred Times */}
          <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: spacing.md }]}>
            Preferred Times
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.lg }]}>
            When would you like to play?
          </Text>

          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((slot) => {
              const isSelected = formData.preferredTimes.includes(slot);
              return (
                <TouchableOpacity
                  key={slot}
                  onPress={() => toggleTime(slot)}
                  style={[
                    styles.timeSlot,
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

          <Button
            title={isEditing ? 'UPDATE POST' : 'PUBLISH POST'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!isValid}
            icon={<Send color={colors.surfaceContainerLowest} size={18} />}
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
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeSlot: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 80,
    alignItems: 'center',
  },
});
