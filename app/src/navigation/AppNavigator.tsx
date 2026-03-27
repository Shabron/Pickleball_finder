/**
 * AppNavigator — Root navigation stack
 *
 * Contains all routes: Auth, Onboarding, Tabs, and deep-linked screens.
 * All wrapped in NavigationContainer (ThemeProvider is in App.tsx).
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

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

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />

        {/* Onboarding */}
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />

        {/* Main App (Tabs) */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />

        {/* Deep stack screens */}
        <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="PostDetail" component={PostDetailScreen} />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
