import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function Header({ title }: { title?: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* We would use the actual logo here, using a placeholder text or circle for now */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>SPF</Text>
        </View>
        {title && <Text style={styles.title}>{title}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingTop: spacing.m,
    paddingBottom: spacing.s,
    paddingHorizontal: spacing.m,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  logoText: {
    ...typography.h3,
    color: colors.primary,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
});
