import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { Check, ShieldAlert, ShieldCheck, UserCheck, Eye, ArrowRight, X } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';
import { useAuth } from '../../context/AuthContext';

export default function TermsScreen({ route, navigation }: any) {
  const { token, userData } = route.params || {};
  const { colors, typography } = useTheme();
  const { login } = useAuth();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    if (!accepted || !token || !userData) return;
    try {
      await login(token, {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        profileComplete: userData.profileComplete,
      }, true);
    } catch (error) {
      console.error('Failed to login after accepting terms', error);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ScreenWrapper backgroundColor="#EAF4FC">
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Header Area */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[typography.headlineMedium, styles.title, { color: '#0F2C4C' }]}>
              Community Standards
            </Text>
            <Text style={[typography.bodyMedium, styles.subtitle]}>
              Please review and accept our guidelines to join.
            </Text>
          </View>

          {/* Guidelines Card */}
          <Card style={styles.card}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Harassment Policy Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ShieldAlert size={24} color={colors.primary} style={styles.icon} />
                  <Text style={[typography.titleLarge, styles.sectionTitle, { color: colors.onSurface }]}>
                    Zero Harassment Policy
                  </Text>
                </View>
                <Text style={[typography.bodyLarge, styles.sectionText]}>
                  We enforce a strict, zero-tolerance policy for harassment, hate speech, bullying, discrimination, or abusive behavior of any kind. 
                  {'\n\n'}
                  <Text style={{ fontWeight: '700' }}>
                    Violators will be permanently and immediately banned from the Pickleball Finder community without warning.
                  </Text>
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Moderate Behavior Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <UserCheck size={24} color={colors.primary} style={styles.icon} />
                  <Text style={[typography.titleLarge, styles.sectionTitle, { color: colors.onSurface }]}>
                    Moderate & Respectful Behavior
                  </Text>
                </View>
                <Text style={[typography.bodyLarge, styles.sectionText]}>
                  Pickleball is a friendly, active, and social sport. We expect all competitive and casual seniors on our platform to treat others with kindness, respect, and fair play both on the forums and on the courts.
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Privacy and Trust Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Eye size={24} color={colors.primary} style={styles.icon} />
                  <Text style={[typography.titleLarge, styles.sectionTitle, { color: colors.onSurface }]}>
                    Privacy & Trust
                  </Text>
                </View>
                <Text style={[typography.bodyLarge, styles.sectionText]}>
                  Respect the privacy of other members. Do not share personal information, coordinates, phone numbers, or private communications of others without their explicit consent.
                </Text>
              </View>
            </ScrollView>

            {/* Checkbox Section */}
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setAccepted(!accepted)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: accepted ? colors.primary : '#D1D5DB' },
                  accepted && { backgroundColor: colors.primary }
                ]}
              >
                {accepted && <Check color="white" size={14} />}
              </View>
              <Text style={[typography.bodyMedium, styles.checkboxLabel]}>
                I agree to the Community Guidelines, Terms of Service, and Privacy Policy.
              </Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                title="CANCEL"
                onPress={handleCancel}
                variant="outline"
                style={styles.cancelButton}
                textStyle={{ fontWeight: 'bold' }}
              />
              <Button
                title="ACCEPT & JOIN"
                onPress={handleAccept}
                disabled={!accepted}
                style={styles.acceptButton}
                textStyle={{ fontWeight: 'bold' }}
              />
            </View>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 1.5,
  },
});
