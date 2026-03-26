import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Navigate to Main Tabs for now
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoAndTitleContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>SPF</Text>
          </View>
          <Text style={styles.title}>LOGIN</Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            placeholder="Email Address"
            icon={<Mail color={colors.textSecondary} size={20} />}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
          />

          <Input
            placeholder="Password"
            icon={<Lock color={colors.textSecondary} size={20} />}
            value={password}
            onChangeText={setPassword}
            isPassword
            style={styles.input}
          />

          <Button 
            title="LOGIN" 
            onPress={handleLogin} 
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoAndTitleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  logoText: {
    ...typography.h1,
    color: colors.primary,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    letterSpacing: 1,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.m,
  },
  button: {
    marginTop: spacing.l,
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
  forgotPassword: {
    alignItems: 'center',
    marginTop: spacing.s,
  },
});
