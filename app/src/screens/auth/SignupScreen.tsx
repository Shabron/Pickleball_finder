/**
 * SignupScreen — v2
 *
 *  - Compact header (back, "Create account", small logo) — no repeated hero or tabs
 *  - Name, email, password, confirm; email format checked after leaving the field
 *  - Live password rules (6+ characters, matches) — server minimum is 6
 *  - No checkbox here: agreement happens once, on the next (Terms) screen
 *  - Errors inline instead of pop-ups
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
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Check, Circle } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import AuthHeader from '../../components/common/AuthHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { authApi } from '../../services/api';

const SUPPORT_EMAIL = 'shauryamspp@gmail.com';
const MIN_PASSWORD = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignupScreen({ navigation }: any) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { colors, typography } = useTheme();

  const update = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const emailOk = EMAIL_RE.test(form.email.trim());
  const longEnough = form.password.length >= MIN_PASSWORD;
  const matches = !!form.confirmPassword && form.password === form.confirmPassword;
  const isValid = !!form.name.trim() && emailOk && longEnough && matches;

  const handleSignup = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await authApi.signup(form.name.trim(), form.email.trim(), form.password);
      const token = response.data?.token || response.token;
      const userData = response.data;
      if (token && userData) {
        await AsyncStorage.setItem('@pending_terms', JSON.stringify({ token, userData }));
        navigation.navigate('Terms', { token, userData });
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (e: any) {
      setError(e?.message || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Rule = ({ ok, label }: { ok: boolean; label: string }) => (
    <View style={styles.ruleRow}>
      {ok ? (
        <Check size={16} color={colors.brandGreen} />
      ) : (
        <Circle size={14} color={colors.outline} style={{ marginHorizontal: 1 }} />
      )}
      <Text
        style={[typography.bodySmall, { color: ok ? colors.brandGreen : colors.onSurfaceVariant, marginLeft: spacing.xs }]}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader
            title="Create account"
            subtitle="Free to join. Takes about a minute."
            onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
          />

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Input
              label="Your name"
              placeholder="e.g. Mary Johnson"
              value={form.name}
              onChangeText={t => update('name', t)}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Email"
              placeholder="you@example.com"
              value={form.email}
              onChangeText={t => update('email', t)}
              onBlur={() => setEmailTouched(true)}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              autoCorrect={false}
              error={emailTouched && form.email.trim() && !emailOk ? 'Please enter a valid email address' : undefined}
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Create a password"
              placeholder="At least 6 characters"
              value={form.password}
              onChangeText={t => update('password', t)}
              isPassword
              autoComplete="password-new"
              textContentType="newPassword"
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Confirm password"
              placeholder="Type it again"
              value={form.confirmPassword}
              onChangeText={t => update('confirmPassword', t)}
              isPassword
              autoComplete="password-new"
              textContentType="newPassword"
              error={form.confirmPassword && !matches ? "Passwords don't match" : undefined}
            />

            {!!form.password && (
              <View style={styles.rules}>
                <Rule ok={longEnough} label={`At least ${MIN_PASSWORD} characters`} />
                <Rule ok={matches} label="Both passwords match" />
              </View>
            )}

            {!!error && (
              <View style={[styles.errorBox, { backgroundColor: colors.errorContainer }]}>
                <Text style={[typography.bodyMedium, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <Button
              title="Continue"
              onPress={handleSignup}
              loading={loading}
              disabled={!isValid || loading}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              textStyle={{ color: '#FFFFFF', fontWeight: '700' }}
            />
            <Text
              style={[typography.bodySmall, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.sm }]}
            >
              Next, you'll review our community guidelines.
            </Text>
          </View>

          <View style={styles.switchRow}>
            <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant }]}>Already a member? </Text>
            <TouchableOpacity onPress={() => navigation.replace('Login')}>
              <Text style={[typography.bodyLarge, { color: colors.primary, fontWeight: '700' }]}>Log in</Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xl }]}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}
          >
            Need help? Contact support
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  rules: {
    marginTop: spacing.md,
    gap: 6,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBox: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    height: 52,
    marginTop: spacing.xl,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.xl,
  },
});
