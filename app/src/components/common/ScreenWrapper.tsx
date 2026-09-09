/**
 * ScreenWrapper — Standard screen container
 *
 * Wraps every screen with SafeAreaView, StatusBar, and themed background.
 * Follows Single Responsibility: manages only the screen shell.
 */
import React, { ReactNode } from 'react';
import { StatusBar, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

interface ScreenWrapperProps {
  children: ReactNode;
  style?: ViewStyle;
  /** Override background color (defaults to theme surface) */
  backgroundColor?: string;
}

export default function ScreenWrapper({ children, style, backgroundColor }: ScreenWrapperProps) {
  const { colors } = useTheme();
  const bg = backgroundColor || colors.screenBackground;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }, style]}>
      {/* No backgroundColor prop: it maps to the deprecated
          Window.setStatusBarColor and is a no-op under edge-to-edge. The bar
          area takes its colour from this SafeAreaView's background instead. */}
      <StatusBar barStyle="dark-content" />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
