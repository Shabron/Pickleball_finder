import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { Check, ShieldAlert, ShieldCheck, UserCheck, Eye, ArrowRight, X } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import AccordionItem, { PolicyText } from '../../components/common/AccordionItem';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '@env';

export default function TermsScreen({ route, navigation }: any) {
  const { token, userData } = route.params || {};
  const { colors, typography } = useTheme();
  const { login, clearPendingTerms } = useAuth();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    if (!accepted) {
      Alert.alert('One more step', 'Please tick the box to agree to the guidelines and Privacy Policy.');
      return;
    }
    if (!token || !userData) {
      Alert.alert('Session expired', 'Please sign up again.');
      return;
    }
    try {
      await login(token, {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        profileComplete: userData.profileComplete,
      }, true);
    } catch (error: any) {
      Alert.alert("Couldn't finish joining", error.message || 'Please try again.');
      console.error('Failed to login after accepting terms', error);
    }
  };

  const handleCancel = async () => {
    try {
      await clearPendingTerms();
    } catch (error) {
      console.error(error);
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const isStandaloneView = !token || !userData;

  return (
    <ScreenWrapper>
      {isStandaloneView && (
        <Header title="Terms & Conditions" showBack onBack={() => navigation.goBack()} />
      )}
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Header Area */}
          <View style={[styles.header, isStandaloneView && styles.headerStandalone]}>
            {!isStandaloneView && (
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            )}
            {!isStandaloneView && (
              <Text style={[typography.titleLarge, styles.title, { color: colors.onSurface }]}>
                Community Standards
              </Text>
            )}
            <Text style={[typography.bodyMedium, styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {isStandaloneView
                ? 'The rules every member agrees to when joining.'
                : 'Please review and accept our guidelines to join.'}
            </Text>
          </View>

          {/* Guidelines — tap-to-open sections */}
          <Card style={StyleSheet.flatten([styles.card, { backgroundColor: colors.surface }])}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <AccordionItem
                title="Zero harassment policy"
                icon={<ShieldAlert size={18} color={colors.primary} />}
                initiallyOpen
              >
                <PolicyText>
                  We enforce a strict, zero-tolerance policy for harassment, hate speech, bullying, discrimination, or abusive behavior of any kind.
                  {'\n\n'}
                  <Text style={{ fontWeight: '700' }}>
                    Violators will be permanently and immediately banned from the Senior Pickleball Partners community without warning.
                  </Text>
                </PolicyText>
              </AccordionItem>

              <AccordionItem
                title="Moderate & respectful behavior"
                icon={<UserCheck size={18} color={colors.primary} />}
              >
                <PolicyText>
                  Pickleball is a friendly, active, and social sport. We expect all competitive and casual seniors on our platform to treat others with kindness, respect, and fair play both on the forums and on the courts.
                </PolicyText>
              </AccordionItem>

              <AccordionItem
                title="Privacy & trust"
                icon={<Eye size={18} color={colors.primary} />}
                showDivider={false}
              >
                <PolicyText>
                  Respect the privacy of other members. Do not share personal information, coordinates, phone numbers, or private communications of others without their explicit consent.
                </PolicyText>
              </AccordionItem>
            </ScrollView>

            {/* Checkbox Section */}
            {token && userData && (
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setAccepted(!accepted)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: accepted ? colors.primary : colors.outline },
                    accepted && { backgroundColor: colors.primary }
                  ]}
                >
                  {accepted && <Check color="white" size={14} />}
                </View>
                <Text style={[typography.bodyMedium, styles.checkboxLabel]}>
                  I agree to these community guidelines, the Terms of Service and the{' '}
                  <Text 
                    style={[styles.linkText, { color: colors.primary }]}
                    onPress={() => navigation.navigate('PrivacyPolicy')}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </TouchableOpacity>
            )}

            {/* Action Buttons */}
            {!isStandaloneView && (
              <View style={styles.buttonContainer}>
                <Button
                  title="Cancel"
                  onPress={handleCancel}
                  variant="outline"
                  style={styles.cancelButton}
                  textStyle={{ fontWeight: 'bold' }}
                />
                <Button
                  title="Accept & join"
                  onPress={handleAccept}
                  disabled={!accepted}
                  style={styles.acceptButton}
                  textStyle={{ fontWeight: 'bold' }}
                />
              </View>
            )}
          </Card>
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  headerStandalone: {
    alignItems: 'flex-start',
  },
  logo: {
    width: 130,
    height: 130,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 0,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  sectionText: {
    color: '#4B5563',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: spacing.md,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 1.5,
  },
});
