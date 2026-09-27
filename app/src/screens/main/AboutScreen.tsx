/**
 * AboutScreen — v2
 *
 *  - Compact identity card with the real app logo (no banner, no 🏓 paddle)
 *  - Mission, About the creator, How it works, Pickleball by the numbers,
 *    Get in touch — all as white cards, same wording as v1
 *  - Readable version line
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity, Image } from 'react-native';
import { Heart, Users, MapPin, MessageSquare, Mail, ChevronRight, User } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';

const SUPPORT_EMAIL = 'shauryamspp@gmail.com';

export default function AboutScreen({ navigation }: any) {
  const { colors, typography } = useTheme();

  const howItWorks = [
    {
      icon: <Users size={20} color={colors.primary} />,
      title: 'Create your profile',
      description: 'Sign up and tell us about your skill level, location, and when you like to play.',
    },
    {
      icon: <MapPin size={20} color={colors.primary} />,
      title: 'Find local partners',
      description: 'Browse posts or get AI-matched with compatible players in your area.',
    },
    {
      icon: <MessageSquare size={20} color={colors.primary} />,
      title: 'Connect & play',
      description: 'Message your matches, schedule a game, and hit the court together!',
    },
  ];

  const stats = [
    { value: '36.5M', label: 'US players' },
    { value: '60%+', label: 'Seniors (55+)' },
    { value: '20%', label: 'Yearly growth' },
    { value: '50', label: 'States' },
  ];

  const SectionTitle = ({ icon, children }: { icon: React.ReactNode; children: string }) => (
    <View style={styles.sectionTitleRow}>
      {icon}
      <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700', marginLeft: spacing.sm }]}>
        {children}
      </Text>
    </View>
  );

  const body = [typography.bodyMedium, { color: colors.onSurfaceVariant, lineHeight: 22 }];

  return (
    <ScreenWrapper>
      <Header title="About" showBack onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ─── Identity ─── */}
        <View style={[styles.card, styles.identity, { backgroundColor: colors.surface }]}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={[typography.titleLarge, { color: colors.onSurface, fontWeight: '700' }]}>
              Senior Pickleball Partners
            </Text>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
              Find a partner on the court, near you.
            </Text>
          </View>
        </View>

        {/* ─── Mission ─── */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SectionTitle icon={<Heart size={18} color={colors.primary} />}>Our mission</SectionTitle>
          <Text style={body}>
            Pickleball is one of the fastest growing sports, yet one of its largest demographics — seniors — remains
            heavily underserved. This is the first app specifically designed for senior pickleball players (50+).
            {'\n\n'}
            Our goal is to provide a free, user-friendly platform that allows seniors to connect with other pickleball
            players in their geographic area — whether for local, state, or national tournaments, or simply for casual
            play!
            {'\n\n'}
            Pickleball promotes cardiovascular fitness, fosters meaningful social connections, and has cognitive
            benefits that reduce the risk of cognitive decline. We believe every senior deserves a partner on the court.
          </Text>
        </View>

        {/* ─── Creator ─── */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SectionTitle icon={<User size={18} color={colors.primary} />}>About the creator</SectionTitle>
          <Text style={body}>
            Hi! I'm Shaurya Madiraju, a senior in high school from New Jersey, personally inspired by my grandmother to
            build this app. I wanted it as a means to show support for those who once cared for us.
            {'\n\n'}
            I am consistently striving to promote both mental and physical fitness in seniors through volunteering
            efforts within my local community, and I'd love to scale this app nationally.
          </Text>
        </View>

        {/* ─── How it works ─── */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <SectionTitle icon={<MapPin size={18} color={colors.primary} />}>How it works</SectionTitle>
          {howItWorks.map((step, i) => (
            <View key={i} style={[styles.stepRow, i > 0 && { marginTop: spacing.md }]}>
              <View style={[styles.stepIcon, { backgroundColor: colors.primaryContainer }]}>{step.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyLarge, { color: colors.onSurface, fontWeight: '600' }]}>
                  {i + 1}. {step.title}
                </Text>
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                  {step.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── Numbers ─── */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[typography.titleMedium, { color: colors.onSurface, fontWeight: '700', marginBottom: spacing.sm }]}>
            Pickleball by the numbers
          </Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={[typography.headlineSmall, { color: colors.primary, fontWeight: '700' }]}>{stat.value}</Text>
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── Contact ─── */}
        <TouchableOpacity
          style={[styles.card, styles.contactRow, { backgroundColor: colors.surface }]}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          activeOpacity={0.7}
        >
          <View style={[styles.stepIcon, { backgroundColor: colors.primaryContainer }]}>
            <Mail size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.bodyLarge, { color: colors.onSurface, fontWeight: '600' }]}>Get in touch</Text>
            <Text style={[typography.bodyMedium, { color: colors.primary, marginTop: 2 }]}>{SUPPORT_EMAIL}</Text>
          </View>
          <ChevronRight size={18} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* ─── Footer ─── */}
        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.md }]}>
          Made with ❤️ for the senior pickleball community
        </Text>
        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.massive,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 64,
    height: 64,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
