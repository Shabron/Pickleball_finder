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
  Image,
  Alert,
  Linking,
} from 'react-native';
import { Mail, Lock, User, Phone, ArrowRight, Check } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Dropdown from '../../components/common/Dropdown';
import Card from '../../components/common/Card';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';
import { authApi, setToken } from '../../services/api';
import { API_BASE_URL } from '@env';



export default function SignupScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colors, typography } = useTheme();

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isValid =
    formData.name.trim() &&
    formData.email.trim() &&
    formData.password.trim() &&
    formData.password === formData.confirmPassword &&
    acceptedPrivacy;

  const handleSignup = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const response = await authApi.signup(formData.name, formData.email, formData.password);
      const token = response.data?.token || response.token;
      const userData = response.data;

      if (token && userData) {
        // Navigate to the Terms acceptance screen instead of logging in directly
        navigation.navigate('Terms', { token, userData });
      }
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message || 'An error occurred during sign up.');
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
          {/* ─── Header Logo ─── */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* ─── Welcome Header ─── */}
          <View style={styles.welcomeSection}>
            <Text style={[typography.headlineMedium, styles.title]}>
              Welcome to the Court
            </Text>
            <Text style={[typography.bodyLarge, styles.subtitle]}>
              Connect with friends and stay active.
            </Text>
          </View>

          {/* ─── Card Form Section ─── */}
          <View style={styles.card}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.tabText}>LOG IN</Text>
              </TouchableOpacity>
              <View style={[styles.tabButton, styles.activeTabWhite]}>
                <Text style={[styles.tabText, styles.activeTabTextDark]}>SIGN UP</Text>
              </View>
            </View>

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
              placeholder="Email Address"
              value={formData.email}
              onChangeText={(t) => updateField('email', t)}
              keyboardType="email-address"
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Create Password"
              placeholder="Create Password"
              value={formData.password}
              onChangeText={(t) => updateField('password', t)}
              isPassword
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(t) => updateField('confirmPassword', t)}
              isPassword
              error={
                formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? 'Passwords do not match'
                  : undefined
              }
              containerStyle={{ marginBottom: spacing.xl }}
            />



            {/* Checkbox Section */}
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: acceptedPrivacy ? colors.primary : '#D1D5DB' },
                  acceptedPrivacy && { backgroundColor: colors.primary }
                ]}
              >
                {acceptedPrivacy && <Check color="white" size={14} />}
              </View>
              <Text style={[typography.bodyMedium, styles.checkboxLabel]}>
                I agree to the{' '}
                <Text 
                  style={[styles.linkText, { color: colors.primary }]}
                  onPress={() => navigation.navigate('PrivacyPolicy')}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            {/* ─── Submit ─── */}
            <Button
              title="JOIN THE COMMUNITY"
              onPress={handleSignup}
              loading={loading}
              disabled={!isValid}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              textStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
            />

            {/* ─── Footer ─── */}
            <TouchableOpacity style={styles.footerLink}>
              <Text style={[styles.supportText, { color: colors.brandGreen }]}>Contact Senior Support</Text>
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
  },
  title: {
    color: '#0F2C4C',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#1B1B1B',
    marginTop: spacing.xs,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: spacing.xxl,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabWhite: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  tabText: {
    fontWeight: 'bold',
    color: '#6B7280',
    fontSize: 14,
  },
  activeTabTextDark: {
    color: '#111827',
  },
  actionButton: {
    height: 52,
    marginTop: spacing.md,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    flex: 1,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 18,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
});
