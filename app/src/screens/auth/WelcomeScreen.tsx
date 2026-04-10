import React from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/ThemeContext';
import Button from '../../components/common/Button';
import { sizes, spacing } from '../../theme/spacing';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<any, any>;
};

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { colors, typography } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#EAF4FC' }]}
      contentContainerStyle={[styles.contentContainer, { flexGrow: 1, justifyContent: 'space-between' }]}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topSection}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.imageWrapper}>
          <Image
            source={require('../../assets/images/bacground.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>
      </View>

      <View style={styles.mainSection}>
        <View style={styles.textSection}>
          <Text style={[typography.headlineMedium, styles.title, { color: '#0F2C4C' }]}>
            Senior Pickleball Login
          </Text>
          <Text style={[typography.bodyLarge, styles.subtitle, { color: '#1B1B1B' }]}>
            Connect with friends, find matches, and stay active.
          </Text>
        </View>

        <View style={styles.buttonSection}>
          <Button
            title="SIGN UP"
            onPress={() => navigation.navigate('Signup')}
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            textStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
          />
          <Button
            title="LOG IN"
            onPress={() => navigation.navigate('Login')}
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
            textStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[typography.bodyMedium, styles.tagline, { color: '#1B1B1B' }]}>
          Connecting Competitive Seniors{'\n'}On The Tournament Circuit
        </Text>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xxl,
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: -35, // Pulls the hero banner up to eliminate the massive intrinsic transparency gap
    zIndex: 10,
  },
  logo: {
    width: 380, // Scaled up width ensures it looks large
    height: 210,
  },
  imageWrapper: {
    width: '100%',
    height: 280,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    elevation: 3, // Add subtle shadow for clean look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  mainSection: {
    flex: 1,
    justifyContent: 'center',
  },
  textSection: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
  },
  buttonSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionButton: {
    height: sizes.touchTarget + 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  tagline: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  bottomLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  spacer: {
    width: spacing.xl,
  },
});
