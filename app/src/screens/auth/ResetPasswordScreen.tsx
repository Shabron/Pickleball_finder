/**
 * ResetPasswordScreen — v2
 *
 * Step 2 of the reset flow: 6-digit code (digit boxes) + new password.
 * On success the backend returns a token, so the user is logged straight in.
 * Resend has a 30-second cool-down; errors are inline.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Check, Circle } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import AuthHeader from '../../components/common/AuthHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import CodeInput from '../../components/common/CodeInput';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MIN_PASSWORD = 6;
const COOLDOWN = 30;

export default function ResetPasswordScreen({ navigation, route }: any) {
  const email: string = route?.params?.email || '';
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(COOLDOWN); // a code was just sent
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const { colors, typography } = useTheme();
  const { login } = useAuth();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const longEnough = password.length >= MIN_PASSWORD;
  const matches = !!confirmPassword && password === confirmPassword;
  const isValid = code.length === 6 && longEnough && matches;

  const clearError = () => error && setError('');

  const handleReset = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await authApi.resetPassword(email, code, password);
      const token = response.data?.token || response.token;
      const userData = response.data;
      if (token && userData) {
        await login(token, {
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          profileComplete: userData.profileComplete,
        });
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (e: any) {
      setError(e?.message || 'That code is wrong or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setCooldown(COOLDOWN);
      setCode('');
      setResent(true);
    } catch (e: any) {
      setError(e?.message || "Couldn't send a new code. Please try again.");
    } finally {
      setResending(false);
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
            title="Reset password"
            subtitle={email ? `Enter the 6-digit code we sent to ${email}.` : 'Enter the 6-digit code we emailed you.'}
            onBack={() => navigation.goBack()}
          />

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[typography.titleSmall, { color: colors.onSurface, marginBottom: spacing.sm }]}>Code</Text>
            <CodeInput
              value={code}
              onChange={d => {
                setCode(d);
                clearError();
              }}
              autoFocus
              disabled={loading}
            />
            <View style={styles.resendRow}>
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>Didn't get it? </Text>
              <TouchableOpacity onPress={handleResend} disabled={cooldown > 0 || resending}>
                <Text
                  style={[
                    typography.bodyMedium,
                    { color: cooldown > 0 || resending ? colors.onSurfaceVariant : colors.primary, fontWeight: '700' },
                  ]}
                >
                  {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send a new code'}
                </Text>
              </TouchableOpacity>
            </View>
            {resent && cooldown > 0 && (
              <Text style={[typography.bodySmall, { color: colors.brandGreen, marginTop: 4 }]}>
                New code sent. Check your spam folder too.
              </Text>
            )}

            <Input
              label="New password"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={t => {
                setPassword(t);
                clearError();
              }}
              isPassword
              autoComplete="password-new"
              textContentType="newPassword"
              containerStyle={{ marginTop: spacing.xl, marginBottom: spacing.lg }}
            />
            <Input
              label="Confirm new password"
              placeholder="Type it again"
              value={confirmPassword}
              onChangeText={t => {
                setConfirmPassword(t);
                clearError();
              }}
              isPassword
              autoComplete="password-new"
              textContentType="newPassword"
              error={confirmPassword && !matches ? "Passwords don't match" : undefined}
            />

            {!!password && (
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
              title="Reset password"
              onPress={handleReset}
              loading={loading}
              disabled={!isValid || loading}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              textStyle={{ color: '#FFFFFF', fontWeight: '700' }}
            />
          </View>

          <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate('Login')}>
            <Text style={[typography.bodyLarge, { color: colors.primary, fontWeight: '700' }]}>Back to log in</Text>
          </TouchableOpacity>
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
  resendRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
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
  backLink: {
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
});
