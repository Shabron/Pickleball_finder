/**
 * VerifyEmailScreen — Confirm the emailed 6-digit verification code
 *
 * Reuses the same code-entry pattern as ResetPasswordScreen. A code is
 * already sent automatically on signup; this screen also offers a resend.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { authApi } from '../../services/api';

export default function VerifyEmailScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const isValid = code.trim().length === 6;

  const handleConfirm = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await authApi.confirmEmailVerification(code.trim());
      Alert.alert('Email Verified', 'Your email has been verified.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.sendEmailVerification();
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Something went wrong', error.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header title="Verify Email" showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, marginBottom: spacing.xl }]}>
            Enter the 6-digit code we emailed you to verify your account.
          </Text>

          <Input
            label="6-Digit Code"
            placeholder="123456"
            value={code}
            onChangeText={(t: string) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            containerStyle={{ marginBottom: spacing.xl }}
          />

          <Button
            title="VERIFY"
            onPress={handleConfirm}
            loading={loading}
            disabled={!isValid}
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            textStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
          />

          <TouchableOpacity style={styles.footerLink} onPress={handleResend} disabled={resending}>
            <Text style={[typography.bodyMedium, { color: colors.primary, textDecorationLine: 'underline' }]}>
              {resending ? 'Resending…' : "Didn't get a code? Resend"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  actionButton: {
    height: 52,
  },
  footerLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
});
