/**
 * PrivacyPolicyScreen — Native in-app viewer for Privacy Policy
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { Shield, Eye, Database, Lock, Users, Mail, FileText } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

export default function PrivacyPolicyScreen({ navigation }: any) {
  const { colors, typography } = useTheme();

  return (
    <ScreenWrapper>
      <Header title="Privacy Policy" showBack onBack={() => navigation.goBack()} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
        >
          {/* Hero Section */}
          <View style={styles.hero}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryContainer }]}>
              <Shield size={36} color={colors.primary} />
            </View>
            <Text style={[typography.headlineMedium, styles.title, { color: '#0F2C4C' }]}>
              Your Privacy Matters
            </Text>
            <Text style={[typography.bodyMedium, styles.subtitle]}>
              Last updated: June 22, 2026
            </Text>
          </View>

          {/* Guidelines Cards */}
          <Card style={styles.card}>
            {/* 1. Introduction */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Shield size={22} color={colors.primary} style={styles.icon} />
                <Text style={[typography.titleLarge, styles.sectionTitle, { color: colors.onSurface }]}>
                  1. Introduction
                </Text>
              </View>
              <Text style={[typography.bodyLarge, styles.sectionText]}>
                Welcome to <Text style={{ fontWeight: '700' }}>Pickleball Finder</Text>. We are committed to protecting your privacy and ensuring you have a safe and positive experience when using our mobile application.
                {'\n\n'}
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related backend services.
              </Text>
            </View>

            <View style={styles.divider} />

            {/* 2. Information We Collect */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Database size={22} color={colors.primary} style={styles.icon} />
                <Text style={[typography.titleLarge, styles.sectionTitle, { color: colors.onSurface }]}>
                  2. Information We Collect
                </Text>
              </View>
              <Text style={[typography.bodyLarge, styles.sectionText]}>
                We collect personal information that you voluntarily provide to us when registering or updating your profile. This includes:
              </Text>
              <View style={styles.bulletList}>
                <Text style={[typography.bodyLarge, styles.bulletItem]}>• <Text style={{ fontWeight: '600' }}>Personal Data:</Text> Your name, email address, optional phone number, and account password.</Text>
                <Text style={[typography.bodyLarge, styles.bulletItem]}>• <Text style={{ fontWeight: '600' }}>Profile Details:</Text> Skill level, location state, play style preferences, profile image, and availability.</Text>
                <Text style={[typography.bodyLarge, styles.bulletItem]}>• <Text style={{ fontWeight: '600' }}>Activity Data:</Text> Matchmaking requests, forum posts, replies, and messages.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* 3. How We Use Information */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Eye size={22} color={colors.primary} style={styles.icon} />
                <Text style={[typography.titleLarge, styles.sectionTitle, { color: colors.onSurface }]}>
                  3. How We Use Information
                </Text>
              </View>
              <Text style={[typography.bodyLarge, styles.sectionText]}>
                We use the information we collect to provide, personalize, and improve your matchmaking experience:
              </Text>
              <View style={styles.bulletList}>
                <Text style={[typography.bodyLarge, styles.bulletItem]}>• Match you with nearby players of similar skill level.</Text>
                <Text style={[typography.bodyLarge, styles.bulletItem]}>• Enable chat messaging and posts on the activity feed.</Text>
                <Text style={[typography.bodyLarge, styles.bulletItem]}>• Send push notifications for chat replies and game requests.</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* 4. Security & Storage */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Lock size={22} color={colors.primary} style={styles.icon} />
                <Text style={[typography.titleLarge, styles.sectionTitle, { color: colors.onSurface }]}>
                  4. Storage & Security
                </Text>
              </View>
              <Text style={[typography.bodyLarge, styles.sectionText]}>
                We use industry-standard security measures to encrypt passwords and secure network transfers. Your data is stored safely on cloud databases. While we do our best to protect your personal details, no internet transmission is 100% secure.
              </Text>
            </View>

            <View style={styles.divider} />

            {/* 5. Sharing Information */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Users size={22} color={colors.primary} style={styles.icon} />
                <Text style={[typography.titleLarge, styles.sectionTitle, { color: colors.onSurface }]}>
                  5. Sharing Information
                </Text>
              </View>
              <Text style={[typography.bodyLarge, styles.sectionText]}>
                We do not sell, rent, or trade your personal information with third parties. Your display name, skill level, bio, and general location are visible to other logged-in community members to enable partner search and matchmaking features.
              </Text>
            </View>

            <View style={styles.divider} />

            {/* 6. Contact */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Mail size={22} color={colors.primary} style={styles.icon} />
                <Text style={[typography.titleLarge, styles.sectionTitle, { color: colors.onSurface }]}>
                  6. Contact Us
                </Text>
              </View>
              <Text style={[typography.bodyLarge, styles.sectionText]}>
                If you have questions, feedback, or concerns regarding this policy, please contact support at:
                {'\n\n'}
                <Text style={{ fontWeight: 'bold', color: colors.primary }}>shauryamspp@gmail.com</Text>
              </Text>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.massive,
  },
  hero: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  card: {
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
  section: {
    marginBottom: spacing.sm,
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
  bulletList: {
    marginTop: spacing.sm,
    paddingLeft: spacing.sm,
  },
  bulletItem: {
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: spacing.md,
  },
});
