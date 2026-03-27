/**
 * App.tsx — Root entry point
 *
 * Wraps the entire application in ThemeProvider for global theme access.
 * SafeAreaProvider handles safe area insets for notched devices.
 */
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="system">
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
