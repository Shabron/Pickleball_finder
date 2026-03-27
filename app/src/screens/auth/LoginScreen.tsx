/**
 * LoginScreen — Pixel-perfect auth entry
 *
 * Matches Stitch "Login / Signup" design:
 * - App logo with gradient hero area
 * - Themed inputs with icons
 * - Large CTAs (56px touch targets)
 * - Social login buttons (visual only)
 * - Responsive layout for all device sizes
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors, typography } = useTheme();

  const handleLogin = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      navigation.replace('MainTabs');
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
          {/* ─── Hero Section ─── */}
          <View
            style={[
              styles.heroSection,
              { backgroundColor: colors.primaryContainer },
            ]}
          >
            {/* Logo circle */}
            <View
              style={[
                styles.logoCircle,
                { backgroundColor: colors.surfaceContainerLowest },
              ]}
            >
              <Text style={[typography.headlineLarge, { color: colors.primary }]}>
                🏓
              </Text>
            </View>

            <Text style={[typography.headlineLarge, { color: colors.primary, marginTop: spacing.lg }]}>
              Senior Pickleball
            </Text>
            <Text style={[typography.titleSmall, { color: colors.onPrimaryContainer, marginTop: spacing.xs }]}>
              Find Your Perfect Partner
            </Text>
          </View>

          {/* ─── Form Section ─── */}
          <View style={styles.formSection}>
            <Text
              style={[
                typography.headlineSmall,
                { color: colors.onSurface, marginBottom: spacing.xxl },
              ]}
            >
              Welcome Back
            </Text>

            <Input
              label="Email"
              placeholder="Enter your email address"
              icon={<Mail color={colors.onSurfaceVariant} size={sizes.iconSmall} />}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              icon={<Lock color={colors.onSurfaceVariant} size={sizes.iconSmall} />}
              value={password}
              onChangeText={setPassword}
              isPassword
              containerStyle={{ marginBottom: spacing.sm }}
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[typography.labelLarge, { color: colors.secondary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <Button
              title="LOGIN"
              onPress={handleLogin}
              loading={loading}
              disabled={!email.trim() || !password.trim()}
              icon={<ArrowRight color={colors.surfaceContainerLowest} size={20} />}
              style={{ marginTop: spacing.xxl }}
            />

            {/* ─── Divider ─── */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.outlineVariant }]} />
              <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginHorizontal: spacing.md }]}>
                OR
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.outlineVariant }]} />
            </View>

            {/* ─── Social Login (Visual Only) ─── */}
            <Button
              title="Continue with Google"
              onPress={() => {}}
              variant="outline"
              style={{ marginBottom: spacing.md }}
            />

            {/* ─── Footer ─── */}
            <View style={styles.footer}>
              <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={[typography.titleSmall, { color: colors.secondary }]}>
                  Sign Up
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
    paddingTop: spacing.giant,
    paddingBottom: spacing.xxxl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2f3d00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  formSection: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.massive,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
});
