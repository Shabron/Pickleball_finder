/**
 * App.tsx — Root entry point
 *
 * Wraps the entire application in:
 *   1. SafeAreaProvider  — safe area insets for notched devices
 *   2. ThemeProvider     — global theme (light mode only)
 *   3. AuthProvider      — auth bootstrap & persistent session
 */
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initPushListeners } from './src/services/push';

function App() {
  useEffect(() => {
    // Sets up foreground/background/tap listeners once for the app's lifetime.
    return initPushListeners();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
