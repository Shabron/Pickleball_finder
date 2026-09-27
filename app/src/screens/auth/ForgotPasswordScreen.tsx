/**
 * ForgotPasswordScreen — v2
 *
 * Step 1 of the reset flow: enter email → backend emails a 6-digit code →
 * ResetPasswordScreen. Compact header, inline error, normal-case button.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import AuthHeader from '../../components/common/AuthHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { authApi } from '../../services/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { colors, typography } = useTheme();

  const valid = EMAIL_RE.test(email.trim());

  const handleSendCode = async () => {
    if (!valid || loading) return;
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email.trim());
      navigation.navigate('ResetPassword', { email: email.trim() });
    } catch (e: any) {
      setError(e?.message || "Couldn't send the code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader
            title="Forgot password?"
            subtitle="Enter your email and we'll send you a 6-digit code to reset it."
            onBack={() => navigation.goBack()}
          />

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={t => {
                setEmail(t);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              autoCorrect={false}
              autoFocus
              returnKeyType="send"
              onSubmitEditing={handleSendCode}
            />

            {!!error && (
              <View style={[styles.errorBox, { backgroundColor: colors.errorContainer }]}>
                <Text style={[typography.bodyMedium, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <Button
              title="Send code"
              onPress={handleSendCode}
              loading={loading}
              disabled={!valid || loading}
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
