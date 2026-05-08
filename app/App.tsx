/**
 * App.tsx — Root entry point
 *
 * Wraps the entire application in:
 *   1. SafeAreaProvider  — safe area insets for notched devices
 *   2. ThemeProvider     — global theme (light/dark/system)
 *   3. AuthProvider      — auth bootstrap & persistent session
 */
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="system">
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
