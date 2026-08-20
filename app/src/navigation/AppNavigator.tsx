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
import { navigationRef } from './navigationRef';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import TermsScreen from '../screens/auth/TermsScreen';
import PrivacyPolicyScreen from '../screens/auth/PrivacyPolicyScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

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
import SavedPostsScreen from '../screens/main/SavedPostsScreen';
import BlockedUsersScreen from '../screens/main/BlockedUsersScreen';
import VerifyEmailScreen from '../screens/profile/VerifyEmailScreen';

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
    <NavigationContainer ref={navigationRef}>
      {isLoading ? (
        // Show spinner inside the single container while bootstrapping
        <Stack.Navigator key="loading" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
        </Stack.Navigator>
      ) : !isAuthenticated ? (
        <Stack.Navigator
          key="guest"
          initialRouteName={pendingTerms ? "Terms" : "Welcome"}
          screenOptions={{ headerShown: false }}
        >
          {/* Guest screens (shown when NOT authenticated) */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen
            name="Terms"
            component={TermsScreen} 
            initialParams={pendingTerms ? { token: pendingTerms.token, userData: pendingTerms.userData } : undefined}
          />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator key="app" screenOptions={{ headerShown: false }}>
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
          <Stack.Screen name="SavedPosts" component={SavedPostsScreen} />
          <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          {/*
            NOTE: these MUST NOT reuse the guest stack's "Terms"/"PrivacyPolicy"
            route names. NavigationContainer preserves navigation state when the
            stack is swapped on auth change — a duplicate route name causes it to
            rehydrate onto that screen instead of starting at CreateProfile,
            which silently strands the user on Terms after "Accept & Join".
          */}
          <Stack.Screen name="TermsInfo" component={TermsScreen} />
          <Stack.Screen name="PrivacyPolicyInfo" component={PrivacyPolicyScreen} />
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
