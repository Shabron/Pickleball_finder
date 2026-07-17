/**
 * ForgotPasswordScreen — Request a password reset code
 *
 * Step 1 of the forgot-password flow: user enters their email,
 * we ask the backend to email a 6-digit reset code, then hand off
 * to ResetPasswordScreen to enter the code + new password.
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

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors, typography } = useTheme();

  const handleSendCode = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      navigation.navigate('ResetPassword', { email: email.trim() });
    } catch (error: any) {
      Alert.alert('Something went wrong', error.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
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
              Forgot Password?
            </Text>
            <Text style={[typography.bodyLarge, styles.subtitle]}>
              Enter your email and we'll send you a code to reset your password.
            </Text>
          </View>

          <View style={styles.card}>
            <Input
              label="Email Address"
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              containerStyle={{ marginBottom: spacing.xl }}
            />

            <Button
              title="SEND RESET CODE"
              onPress={handleSendCode}
              loading={loading}
              disabled={!email.trim()}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              textStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
            />

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
