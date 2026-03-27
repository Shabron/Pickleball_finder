/**
 * TabNavigator — Bottom tab bar
 *
 * Themed tab bar using the global ThemeContext.
 * No top border per "No-Line Rule" — uses tonal shift instead.
 * 72px height for senior-friendly touch targets.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, PenSquare, Mail, User } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import MyPostsScreen from '../screens/main/MyPostsScreen';
import MessagesListScreen from '../screens/main/MessagesListScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { colors, typography, sizes } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarLabelStyle: {
          ...typography.labelSmall,
          marginTop: -2,
        },
        tabBarStyle: {
          // No top border per "No-Line Rule" — tonal shift instead
          borderTopWidth: 0,
          backgroundColor: colors.surfaceContainerLow,
          height: sizes.tabBarHeight,
          paddingBottom: 10,
          paddingTop: 8,
          // Ambient shadow
          shadowColor: '#2f3d00',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') return <Home color={color} size={size} />;
          if (route.name === 'Search') return <Search color={color} size={size} />;
          if (route.name === 'My Posts') return <PenSquare color={color} size={size} />;
          if (route.name === 'Messages') return <Mail color={color} size={size} />;
          if (route.name === 'Profile') return <User color={color} size={size} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="My Posts" component={MyPostsScreen} />
      <Tab.Screen name="Messages" component={MessagesListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
