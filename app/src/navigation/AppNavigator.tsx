/**
 * AppNavigator — Root navigation stack
 *
 * Auth-aware routing:
 *  - Shows a splash screen while the token bootstrap runs
 *  - Routes directly to MainTabs if a valid token exists
 *  - Routes to Welcome/Login/Signup if not authenticated
 *
 * Uses a SINGLE NavigationContainer to avoid remount issues
 * when auth state changes after login.
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import TermsScreen from '../screens/auth/TermsScreen';
import PrivacyPolicyScreen from '../screens/auth/PrivacyPolicyScreen';

// Onboarding / Profile
import CreateProfileScreen from '../screens/profile/CreateProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';

// Main Tabs
import TabNavigator from './TabNavigator';

// Deep stack screens (no tabs)
import ChatThreadScreen from '../screens/messaging/ChatThreadScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import NotificationSettingsScreen from '../screens/main/NotificationSettingsScreen';
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
  const { isLoading, isAuthenticated, isNewSignup, pendingTerms } = useAuth();

  return (
    <NavigationContainer>
      {isLoading ? (
        // Show spinner inside the single container while bootstrapping
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      ) : !isAuthenticated ? (
        <Stack.Navigator 
          initialRouteName={pendingTerms ? "Terms" : "Welcome"}
          screenOptions={{ headerShown: false }}
        >
          {/* Guest screens (shown when NOT authenticated) */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen 
            name="Terms" 
            component={TermsScreen} 
            initialParams={pendingTerms ? { token: pendingTerms.token, userData: pendingTerms.userData } : undefined}
          />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isNewSignup ? (
            <>
              {/* Onboarding first */}
              <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
              <Stack.Screen name="MainTabs" component={TabNavigator} />
            </>
          ) : (
            <>
              {/* Main App (Tabs) first */}
              <Stack.Screen name="MainTabs" component={TabNavigator} />
              <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
            </>
          )}

          {/* Deep stack screens */}
          <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
          <Stack.Screen name="PostDetail" component={PostDetailScreen} />
          <Stack.Screen name="CreatePost" component={CreatePostScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="PostReplies" component={PostRepliesScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        </Stack.Navigator>
      )}
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
