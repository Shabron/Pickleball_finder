/**
 * ResetPasswordScreen — Step 2 of the forgot-password flow
 *
 * User enters the 6-digit code emailed to them plus a new password.
 * On success the backend returns a fresh auth token, so we log the
 * user straight in (same pattern as Login/Signup).
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ResetPasswordScreen({ navigation, route }: any) {
  const email: string = route?.params?.email || '';
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { colors, typography } = useTheme();
  const { login } = useAuth();

  const isValid =
    code.trim().length === 6 &&
    password.trim().length >= 6 &&
    password === confirmPassword;

  const handleReset = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const response = await authApi.resetPassword(email, code.trim(), password);
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
        Alert.alert('Reset Failed', 'Unexpected response from server.');
      }
    } catch (error: any) {
      Alert.alert('Reset Failed', error.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.forgotPassword(email);
      Alert.alert('Code Sent', 'A new reset code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Something went wrong', error.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.welcomeSection}>
            <Text style={[typography.headlineMedium, styles.title]}>
              Enter Reset Code
            </Text>
            <Text style={[typography.bodyLarge, styles.subtitle]}>
              We sent a 6-digit code to {email}. Enter it below along with your new password.
            </Text>
          </View>

          <View style={styles.card}>
            <Input
              label="6-Digit Code"
              placeholder="123456"
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Input
              label="New Password"
              placeholder="New Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Confirm New Password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              error={
                confirmPassword && password !== confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
              containerStyle={{ marginBottom: spacing.xl }}
            />

            <Button
              title="RESET PASSWORD"
              onPress={handleReset}
              loading={loading}
              disabled={!isValid}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              textStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
            />

            <TouchableOpacity
              style={styles.footerLink}
              onPress={handleResend}
              disabled={resending}
            >
              <Text style={[styles.supportText, { color: colors.brandGreen }]}>
                {resending ? 'Resending...' : "Didn't get a code? Resend"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={[styles.supportText, { color: colors.brandGreen }]}>Back to Log In</Text>
            </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  logo: {
    width: 160,
    height: 160,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: '#0F2C4C',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#1B1B1B',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  actionButton: {
    height: 52,
    marginTop: spacing.xs,
  },
  footerLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  supportText: {
    textDecorationLine: 'underline',
    color: '#111827',
    fontSize: 15,
  },
});
