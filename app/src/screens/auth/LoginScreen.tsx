/**
 * LoginScreen — v2
 *
 *  - Compact header (back, "Log in", small logo) — no repeated hero or tabs
 *  - Email keyboard, no auto-capitalise; password show/hide kept
 *  - Errors shown inline under the form instead of pop-ups
 *  - Forgot password, "Create an account", Contact support / Privacy links
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
import ScreenWrapper from '../../components/common/ScreenWrapper';
import AuthHeader from '../../components/common/AuthHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SUPPORT_EMAIL = 'shauryamspp@gmail.com';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { colors, typography } = useTheme();
  const { login } = useAuth();

  const canSubmit = !!email.trim() && !!password && !loading;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const response = await authApi.login(email.trim(), password);
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
      setError(e?.message || 'Could not log in. Please check your details and try again.');
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
            title="Log in"
            subtitle="Welcome back! Good to see you on the court."
            onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
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
              returnKeyType="next"
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={t => {
                setPassword(t);
                if (error) setError('');
              }}
              isPassword
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity
              style={styles.forgot}
              onPress={() => navigation.navigate('ForgotPassword')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[typography.bodyMedium, { color: colors.primary, fontWeight: '600' }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            {!!error && (
              <View style={[styles.errorBox, { backgroundColor: colors.errorContainer }]}>
                <Text style={[typography.bodyMedium, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <Button
              title="Log in"
              onPress={handleLogin}
              loading={loading}
              disabled={!canSubmit}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              textStyle={{ color: '#FFFFFF', fontWeight: '700' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant }]}>New here? </Text>
            <TouchableOpacity onPress={() => navigation.replace('Signup')}>
              <Text style={[typography.bodyLarge, { color: colors.primary, fontWeight: '700' }]}>Create an account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerLinks}>
            <Text
              style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}
            >
              Contact support
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.outline }]}>·</Text>
            <Text
              style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              Privacy policy
            </Text>
          </View>
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
  forgot: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  errorBox: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    height: 52,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.xl,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
