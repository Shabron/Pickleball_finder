import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Settings, LogOut, Info, ChevronRight } from 'lucide-react-native';
import Header from '../../components/common/Header';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function ProfileScreen({ navigation }: any) {
  const handleLogout = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHeader}>
          <Avatar name="Arthur Smith" size={80} />
          <Text style={styles.name}>Arthur Smith</Text>
          <Text style={styles.email}>arthur.s@example.com</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Level 3.0</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>Florida</Text>
            </View>
          </View>
          
          <Button 
            title="Edit Profile" 
            onPress={() => {}} 
            variant="outline" 
            style={styles.editButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Settings color={colors.primary} size={20} />
            </View>
            <Text style={styles.menuText}>Account Settings</Text>
            <ChevronRight color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Info color={colors.primary} size={20} />
            </View>
            <Text style={styles.menuText}>About the App</Text>
            <ChevronRight color={colors.textSecondary} size={20} />
          </TouchableOpacity>
          
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              Senior Pickleball Partner Finder is designed to connect players of similar skill levels locally.
            </Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        <Button 
          title="LOGOUT" 
          onPress={handleLogout} 
          variant="ghost" 
          style={styles.logoutButton}
          textStyle={{ color: colors.error }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.m,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: spacing.xl,
    borderRadius: 20,
    marginBottom: spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.s,
  },
  email: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.m,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: spacing.m,
  },
  badge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginHorizontal: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#FFF',
  },
  editButton: {
    width: '100%',
    height: 40,
  },
  section: {
    marginBottom: spacing.l,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.s,
    marginLeft: spacing.s,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.s,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  menuText: {
    flex: 1,
    ...typography.body,
    fontWeight: '500',
    color: colors.text,
  },
  aboutCard: {
    backgroundColor: colors.primaryLight,
    padding: spacing.m,
    borderRadius: 12,
    marginTop: spacing.s,
  },
  aboutText: {
    ...typography.bodySmall,
    color: colors.text,
    lineHeight: 20,
  },
  versionText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.s,
    textAlign: 'right',
  },
  logoutButton: {
    marginTop: spacing.m,
  },
});
