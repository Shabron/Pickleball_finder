/**
 * AboutScreen — About Senior Pickleball
 *
 * Matches Stitch "About Senior Pickleball (Perfected)" design:
 * - Hero header with mission
 * - How-it-works steps
 * - Stats section
 * - Contact info
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { Heart, Users, MapPin, MessageSquare, Shield, Mail, ExternalLink } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import Card from '../../components/common/Card';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius, sizes } from '../../theme/spacing';

export default function AboutScreen({ navigation }: any) {
  const { colors, typography } = useTheme();

  const howItWorks = [
    {
      icon: <Users size={28} color={colors.primary} />,
      title: 'Create Your Profile',
      description: 'Sign up and tell us about your skill level, location, and when you like to play.',
    },
    {
      icon: <MapPin size={28} color={colors.secondary} />,
      title: 'Find Local Partners',
      description: 'Browse posts or get AI-matched with compatible players in your area.',
    },
    {
      icon: <MessageSquare size={28} color={colors.tertiary} />,
      title: 'Connect & Play',
      description: 'Message your matches, schedule a game, and hit the court together!',
    },
  ];

  const stats = [
    { value: '36.5M', label: 'US Players' },
    { value: '60%+', label: 'Seniors (55+)' },
    { value: '20%', label: 'YoY Growth' },
    { value: '50', label: 'States' },
  ];

  return (
    <ScreenWrapper>
      <Header title="About" showBack onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero ─── */}
        <View style={[styles.hero, { backgroundColor: colors.primaryContainer }]}>
          <Text style={{ fontSize: 48 }}>🏓</Text>
          <Text style={[typography.headlineLarge, { color: colors.primary, marginTop: spacing.lg }]}>
            Senior Pickleball
          </Text>
          <Text style={[typography.headlineSmall, { color: colors.onPrimaryContainer, marginTop: spacing.xs }]}>
            Partner Finder
          </Text>
        </View>

        {/* ─── Mission ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={22} color={colors.tertiary} />
            <Text style={[typography.titleLarge, { color: colors.onSurface, marginLeft: spacing.sm }]}>
              Our Mission
            </Text>
          </View>
          <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, lineHeight: 26 }]}>
            Pickleball is the fastest-growing sport in America, with a massive senior community.
            We built this app to solve a simple problem: finding the right playing partner shouldn't
            be hard.{'\n\n'}
            Whether you're a beginner looking for patient partners or an advanced player seeking
            competitive matches, Senior Pickleball Partner Finder connects you with compatible
            players near you.
          </Text>
        </View>

        {/* ─── How It Works ─── */}
        <View style={styles.section}>
          <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: spacing.xl }]}>
            How It Works
          </Text>

          {howItWorks.map((step, i) => (
            <Card key={i} elevation={1}>
              <View style={styles.stepRow}>
                <View
                  style={[styles.stepIcon, { backgroundColor: colors.surfaceContainerHigh }]}
                >
                  {step.icon}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                    {i + 1}. {step.title}
                  </Text>
                  <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: spacing.xs }]}>
                    {step.description}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* ─── Stats ─── */}
        <View style={[styles.statsSection, { backgroundColor: colors.surfaceContainerLow }]}>
          <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: spacing.xl, textAlign: 'center' }]}>
            Pickleball by the Numbers
          </Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={[typography.headlineMedium, { color: colors.primary }]}>
                  {stat.value}
                </Text>
                <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Contact ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mail size={22} color={colors.secondary} />
            <Text style={[typography.titleLarge, { color: colors.onSurface, marginLeft: spacing.sm }]}>
              Get in Touch
            </Text>
          </View>
          <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant }]}>
            Have a question, suggestion, or just want to say hi?
          </Text>
          <TouchableOpacity
            style={[styles.contactLink, { backgroundColor: colors.secondaryContainer }]}
            onPress={() => Linking.openURL('mailto:support@seniorpickleball.app')}
          >
            <Text style={[typography.titleSmall, { color: colors.onSecondaryContainer }]}>
              support@seniorpickleball.app
            </Text>
            <ExternalLink size={16} color={colors.onSecondaryContainer} />
          </TouchableOpacity>
        </View>

        {/* ─── Footer ─── */}
        <View style={styles.footer}>
          <Shield size={16} color={colors.onSurfaceVariant} />
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginLeft: spacing.xs }]}>
            Made with ❤️ for the senior pickleball community
          </Text>
        </View>
        <Text style={[typography.labelSmall, { color: colors.outlineVariant, textAlign: 'center', marginTop: spacing.sm }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.massive,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.giant,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    marginBottom: spacing.xxl,
  },
  section: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  stepContent: {
    flex: 1,
  },
  statsSection: {
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.xxl,
    marginHorizontal: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  contactLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xxl,
  },
});
