/**
 * AppNavigator — Root navigation stack
 *
 * Auth-aware routing:
 *  - Shows a splash screen while the token bootstrap runs
 *  - Routes directly to MainTabs if a valid token exists
 *  - Routes to Welcome/Login/Signup if not authenticated
 *
 * All wrapped in NavigationContainer (ThemeProvider is in App.tsx).
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';

// Onboarding / Profile
import CreateProfileScreen from '../screens/profile/CreateProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';

// Main Tabs
import TabNavigator from './TabNavigator';

// Deep stack screens (no tabs)
import ChatThreadScreen from '../screens/messaging/ChatThreadScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import PostDetailScreen from '../screens/main/PostDetailScreen';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import AboutScreen from '../screens/main/AboutScreen';
import UserProfileScreen from '../screens/main/UserProfileScreen';
import PostRepliesScreen from '../screens/main/PostRepliesScreen';

// Auth context
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

/** Full-screen splash shown while the token bootstrap runs */
function SplashScreen() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color="#1D6FA4" />
    </View>
  );
}

export default function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  // Wait for the async bootstrap to finish before deciding which screen to show
  if (isLoading) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        // Key forces a full navigator remount when auth state changes,
        // ensuring no stale screens remain in the stack.
        key={isAuthenticated ? 'auth' : 'guest'}
        initialRouteName={isAuthenticated ? 'MainTabs' : 'Welcome'}
      >
        {/* Auth (only shown when NOT authenticated) */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />

        {/* Onboarding */}
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />

        {/* Main App (Tabs) — always registered so deep links work */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />

        {/* Deep stack screens */}
        <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="PostDetail" component={PostDetailScreen} />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
        <Stack.Screen name="PostReplies" component={PostRepliesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EAF4FC',
  },
});
