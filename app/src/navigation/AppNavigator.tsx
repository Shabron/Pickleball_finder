import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import TabNavigator from './TabNavigator';
import ChatThreadScreen from '../screens/messaging/ChatThreadScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        
        {/* Main App (Tabs) */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        
        {/* Deep stack screens without tabs */}
        <Stack.Screen name="ChatThread" component={ChatThreadScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
