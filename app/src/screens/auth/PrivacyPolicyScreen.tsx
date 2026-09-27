/**
 * PrivacyPolicyScreen — v2
 *
 *  - Normal-size title + "Last updated" line (no oversized hero)
 *  - Each section is a tap-to-open row inside one white card
 *  - Contact email is tappable (opens mail app)
 *  Policy wording is unchanged from v1.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { Shield, Eye, Database, Lock, Users, Mail } from 'lucide-react-native';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Header from '../../components/common/Header';
import AccordionItem, { PolicyText, PolicyBullet } from '../../components/common/AccordionItem';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';

const SUPPORT_EMAIL = 'shauryamspp@gmail.com';

export default function PrivacyPolicyScreen({ navigation }: any) {
  const { colors, typography } = useTheme();
  const ic = (Icon: any) => <Icon size={18} color={colors.primary} />;

  return (
    <ScreenWrapper>
      <Header title="Privacy Policy" showBack onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.md }]}>
          How we collect, use and protect your information. Last updated June 22, 2026.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <AccordionItem title="Introduction" icon={ic(Shield)} initiallyOpen>
            <PolicyText>
              Welcome to <Text style={{ fontWeight: '700' }}>Senior Pickleball Partners</Text>. We are committed to
              protecting your privacy and ensuring you have a safe and positive experience when using our mobile
              application.
              {'\n\n'}
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use
              our mobile application and related backend services.
            </PolicyText>
          </AccordionItem>

          <AccordionItem title="Information we collect" icon={ic(Database)}>
            <PolicyText>
              We collect personal information that you voluntarily provide to us when registering or updating your
              profile. This includes:
            </PolicyText>
            <PolicyBullet>
              <Text style={{ fontWeight: '600' }}>Personal Data:</Text> Your name, email address, optional phone
              number, and account password.
            </PolicyBullet>
            <PolicyBullet>
              <Text style={{ fontWeight: '600' }}>Profile Details:</Text> Skill level, location state, play style
              preferences, profile image, and availability.
            </PolicyBullet>
            <PolicyBullet>
              <Text style={{ fontWeight: '600' }}>Activity Data:</Text> Matchmaking requests, forum posts, replies,
              and messages.
            </PolicyBullet>
          </AccordionItem>

          <AccordionItem title="How we use information" icon={ic(Eye)}>
            <PolicyText>
              We use the information we collect to provide, personalize, and improve your matchmaking experience:
            </PolicyText>
            <PolicyBullet>Match you with nearby players of similar skill level.</PolicyBullet>
            <PolicyBullet>Enable chat messaging and posts on the activity feed.</PolicyBullet>
            <PolicyBullet>Send push notifications for chat replies and game requests.</PolicyBullet>
          </AccordionItem>

          <AccordionItem title="Storage & security" icon={ic(Lock)}>
            <PolicyText>
              We use industry-standard security measures to encrypt passwords and secure network transfers. Your data
              is stored safely on cloud databases. While we do our best to protect your personal details, no internet
              transmission is 100% secure.
            </PolicyText>
          </AccordionItem>

          <AccordionItem title="Sharing information" icon={ic(Users)}>
            <PolicyText>
              We do not sell, rent, or trade your personal information with third parties. Your display name, skill
              level, bio, and general location are visible to other logged-in community members to enable partner
              search and matchmaking features.
            </PolicyText>
          </AccordionItem>

          <AccordionItem title="Contact us" icon={ic(Mail)} showDivider={false}>
            <PolicyText>
              If you have questions, feedback, or concerns regarding this policy, please contact support at:
            </PolicyText>
            <Text
              style={[typography.bodyLarge, { color: colors.primary, fontWeight: '700', marginTop: spacing.sm }]}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            >
              {SUPPORT_EMAIL}
            </Text>
          </AccordionItem>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.massive,
  },
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
});
