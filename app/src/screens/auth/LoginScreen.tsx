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
  Alert,
} from 'react-native';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';
import { authApi, setToken } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors, typography } = useTheme();
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      const token = response.data?.token || response.token;
      const userData = response.data;

      if (token && userData) {
        // login() persists the token and updates isAuthenticated
        await login(token, {
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          profileComplete: userData.profileComplete,
        });
      } else {
        Alert.alert('Login Failed', 'Unexpected response from server.');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred during login.');
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
              <View style={[styles.tabButton, styles.activeTabWhite]}>
                <Text style={[styles.tabText, styles.activeTabTextDark]}>LOG IN</Text>
              </View>
              <TouchableOpacity
                style={styles.tabButton}
                onPress={() => navigation.navigate('Signup')}
              >
                <Text style={styles.tabText}>SIGN UP</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Email Address"
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              containerStyle={{ marginBottom: spacing.lg }}
            />

            <Input
              label="Password"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              containerStyle={{ marginBottom: spacing.sm }}
            />

            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={() => { /* Navigate to forgot password */ }}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.brandGreen }]}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              title="ENTER THE COURT"
              onPress={handleLogin}
              loading={loading}
              disabled={!email.trim() || !password.trim()}
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  forgotPasswordText: {
    color: '#3876AB',
    fontWeight: '600',
    fontSize: 14,
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
