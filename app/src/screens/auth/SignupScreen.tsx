import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Mail, Lock, User } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Dropdown from '../../components/common/Dropdown';

export default function SignupScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    skillLevel: '',
    playType: '',
    location: '',
  });

  const skillOptions = [
    { label: 'Beginner (1.0 - 2.5)', value: 'beginner' },
    { label: 'Intermediate (3.0 - 4.0)', value: 'intermediate' },
    { label: 'Advanced (4.5+)', value: 'advanced' },
  ];

  const playTypeOptions = [
    { label: 'Singles', value: 'singles' },
    { label: 'Doubles', value: 'doubles' },
    { label: 'Mixed Doubles', value: 'mixed' },
    { label: 'Any', value: 'any' },
  ];

  const handleSignup = () => {
    // Navigate to Main Tabs for now
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>CREATE YOUR ACCOUNT</Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            placeholder="Full Name"
            icon={<User color={colors.textSecondary} size={20} />}
            value={formData.name}
            onChangeText={(t) => setFormData({ ...formData, name: t })}
            style={styles.input}
          />

          <Input
            placeholder="Email Address"
            icon={<Mail color={colors.textSecondary} size={20} />}
            value={formData.email}
            onChangeText={(t) => setFormData({ ...formData, email: t })}
            keyboardType="email-address"
            style={styles.input}
          />

          <Input
            placeholder="Password"
            icon={<Lock color={colors.textSecondary} size={20} />}
            value={formData.password}
            onChangeText={(t) => setFormData({ ...formData, password: t })}
            isPassword
            style={styles.input}
          />

          <Input
            placeholder="Confirm Password"
            icon={<Lock color={colors.textSecondary} size={20} />}
            value={formData.confirmPassword}
            onChangeText={(t) => setFormData({ ...formData, confirmPassword: t })}
            isPassword
            style={styles.input}
          />

          <Text style={styles.sectionTitle}>Profile Details (Optional)</Text>

          <View style={styles.detailsCard}>
            <Dropdown
              label="Skill Level (1.0-5.0)"
              placeholder="[Select Level]"
              options={skillOptions}
              value={formData.skillLevel}
              onSelect={(val) => setFormData({ ...formData, skillLevel: val })}
            />

            <Dropdown
              label="Favorite Play Type"
              placeholder="[Select Type, e.g., Doubles, Singles]"
              options={playTypeOptions}
              value={formData.playType}
              onSelect={(val) => setFormData({ ...formData, playType: val })}
            />

            <Input
              placeholder="City & State (e.g. Florida, Sarasota)"
              value={formData.location}
              onChangeText={(t) => setFormData({ ...formData, location: t })}
              style={{ marginBottom: 0 }}
            />
          </View>

          <Button 
            title="SUBMIT APPLICATION" 
            onPress={handleSignup} 
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    flexGrow: 1,
    paddingHorizontal: spacing.l,
    paddingTop: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    letterSpacing: 0.5,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.m,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.m,
    marginBottom: spacing.s,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    marginTop: spacing.s,
    marginBottom: spacing.m,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.s,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  linkText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
});
