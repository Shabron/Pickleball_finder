/**
 * SignupScreen — Account creation with optional profile details
 *
 * Matches Stitch "Login / Signup" design:
 * - Step-indicator-style form with clear sections
 * - All inputs use themed components
 * - State dropdown for location
 * - Responsive for all device sizes
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
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Dropdown from '../../components/common/Dropdown';
import Card from '../../components/common/Card';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

const SKILL_OPTIONS = [
  { label: 'Beginner (1.0 - 2.5)', value: 'beginner' },
  { label: 'Intermediate (3.0 - 4.0)', value: 'intermediate' },
  { label: 'Advanced (4.5+)', value: 'advanced' },
];

const PLAY_TYPE_OPTIONS = [
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

export default function SignupScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    skillLevel: '',
    playType: '',
    state: '',
    city: '',
  });
  const [loading, setLoading] = useState(false);
  const { colors, typography } = useTheme();

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isValid =
    formData.name.trim() &&
    formData.email.trim() &&
    formData.password.trim() &&
    formData.password === formData.confirmPassword;

  const handleSignup = () => {
    if (!isValid) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('CreateProfile');
    }, 800);
  };

  return (
    <ScreenWrapper backgroundColor={colors.surface}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Hero Header ─── */}
          <View
            style={[
              styles.heroSection,
              { backgroundColor: colors.primaryContainer },
            ]}
          >
            <Text style={[typography.headlineLarge, { color: colors.primary }]}>
              Join the Court
            </Text>
            <Text
              style={[
                typography.bodyLarge,
                { color: colors.onPrimaryContainer, marginTop: spacing.xs, textAlign: 'center' },
              ]}
            >
              Create your account and find your perfect pickleball partner
            </Text>
          </View>

          {/* ─── Account Info ─── */}
          <View style={styles.formSection}>
            <Text
              style={[
                typography.titleLarge,
                { color: colors.onSurface, marginBottom: spacing.xl },
              ]}
            >
              Account Information
            </Text>

            <Input
              label="Full Name"
              placeholder="Enter your full name"
              icon={<User color={colors.onSurfaceVariant} size={sizes.iconSmall} />}
              value={formData.name}
              onChangeText={(t) => updateField('name', t)}
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Email Address"
              placeholder="Enter your email"
              icon={<Mail color={colors.onSurfaceVariant} size={sizes.iconSmall} />}
              value={formData.email}
              onChangeText={(t) => updateField('email', t)}
              keyboardType="email-address"
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Phone (Optional)"
              placeholder="Enter your phone number"
              icon={<Phone color={colors.onSurfaceVariant} size={sizes.iconSmall} />}
              value={formData.phone}
              onChangeText={(t) => updateField('phone', t)}
              keyboardType="phone-pad"
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Password"
              placeholder="Create a password"
              icon={<Lock color={colors.onSurfaceVariant} size={sizes.iconSmall} />}
              value={formData.password}
              onChangeText={(t) => updateField('password', t)}
              isPassword
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              icon={<Lock color={colors.onSurfaceVariant} size={sizes.iconSmall} />}
              value={formData.confirmPassword}
              onChangeText={(t) => updateField('confirmPassword', t)}
              isPassword
              error={
                formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
              containerStyle={{ marginBottom: spacing.xxl }}
            />

            {/* ─── Profile Details (Optional) ─── */}
            <Text
              style={[
                typography.titleLarge,
                { color: colors.onSurface, marginBottom: spacing.lg },
              ]}
            >
              Profile Details
            </Text>
            <Text
              style={[
                typography.bodyMedium,
                { color: colors.onSurfaceVariant, marginBottom: spacing.xl },
              ]}
            >
              Optional — you can complete this later
            </Text>

            <Card elevation={1} padding={spacing.xl}>
              <Dropdown
                label="Skill Level"
                placeholder="Select your level"
                options={SKILL_OPTIONS}
                value={formData.skillLevel}
                onSelect={(val) => updateField('skillLevel', val)}
                style={{ marginBottom: spacing.lg }}
              />

              <Dropdown
                label="Favorite Play Type"
                placeholder="Select play style"
                options={PLAY_TYPE_OPTIONS}
                value={formData.playType}
                onSelect={(val) => updateField('playType', val)}
                style={{ marginBottom: spacing.lg }}
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
              />
            </Card>

            {/* ─── Submit ─── */}
            <Button
              title="CREATE ACCOUNT"
              onPress={handleSignup}
              loading={loading}
              disabled={!isValid}
              icon={<ArrowRight color={colors.surfaceContainerLowest} size={20} />}
              style={{ marginTop: spacing.lg }}
            />

            {/* ─── Footer ─── */}
            <View style={styles.footer}>
              <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[typography.titleSmall, { color: colors.secondary }]}>
                  Log In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing.massive,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  formSection: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.massive,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
});
