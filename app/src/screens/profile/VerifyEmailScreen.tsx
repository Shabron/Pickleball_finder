/**
 * VerifyEmailScreen — v2
 *
 *  - "We sent a 6-digit code to p***@gmail.com"
 *  - Six digit boxes backed by one hidden input (paste + SMS autofill work)
 *  - Auto-verifies when the 6th digit is entered; inline error, not a popup
 *  - Resend with a 30-second cool-down
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MailCheck } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CodeInput from '../../components/common/CodeInput';

const LEN = 6;
const COOLDOWN = 30;

/** pankaj@gmail.com → p*****@gmail.com */
function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return 'your email';
  const [name, domain] = email.split('@');
  return `${name[0]}${'*'.repeat(Math.max(name.length - 1, 2))}@${domain}`;
}

export default function VerifyEmailScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const { user } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (value: string) => {
    if (value.length !== LEN || loading) return;
    setLoading(true);
    setError('');
    try {
      await authApi.confirmEmailVerification(value);
      Alert.alert('Email verified', 'Thanks! Your email is now verified.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      setError(e?.message || 'That code is wrong or has expired.');
      setCode('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const onChange = (digits: string) => {
    setCode(digits);
    if (error) setError('');
    if (digits.length === LEN) verify(digits);
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await authApi.sendEmailVerification();
      setCooldown(COOLDOWN);
      setCode('');
    } catch (e: any) {
      setError(e?.message || "Couldn't send a new code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header title="Verify Email" showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.icon, { backgroundColor: colors.primaryContainer }]}>
              <MailCheck size={26} color={colors.primary} />
            </View>
            <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700', textAlign: 'center' }]}>
              Check your email
            </Text>
            <Text
              style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }]}
            >
              We sent a 6-digit code to{'\n'}
              <Text style={{ color: colors.onSurface, fontWeight: '600' }}>{maskEmail(user?.email)}</Text>
            </Text>

            <View style={{ marginTop: spacing.lg }}>
              <CodeInput ref={inputRef} value={code} onChange={onChange} error={!!error} disabled={loading} autoFocus />
            </View>

            {loading ? (
              <View style={styles.statusLine}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginLeft: spacing.sm }]}>
                  Checking…
                </Text>
              </View>
            ) : error ? (
              <Text style={[typography.bodyMedium, styles.statusLine, { color: colors.error, textAlign: 'center' }]}>
                {error}
              </Text>
            ) : (
              <Text
                style={[typography.bodySmall, styles.statusLine, { color: colors.onSurfaceVariant, textAlign: 'center' }]}
              >
                The code verifies automatically once all 6 digits are in.
              </Text>
            )}
          </View>

          <View style={styles.resendRow}>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>Didn't get it? </Text>
            <TouchableOpacity onPress={handleResend} disabled={cooldown > 0 || resending} activeOpacity={0.7}>
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
          {cooldown > 0 && (
            <Text style={[typography.bodySmall, { color: colors.brandGreen, textAlign: 'center', marginTop: 4 }]}>
              New code sent. Check your spam folder too.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusLine: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    minHeight: 22,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
});
