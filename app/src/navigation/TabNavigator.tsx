/**
 * TabNavigator — Bottom tab bar
 *
 * Themed tab bar using the global ThemeContext.
 * No top border per "No-Line Rule" — uses tonal shift instead.
 * 72px height for senior-friendly touch targets.
 */
import React, { useRef, useEffect } from 'react';
import { View, Animated, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, PenSquare, Mail, User } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import MyPostsScreen from '../screens/main/MyPostsScreen';
import MessagesListScreen from '../screens/main/MessagesListScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();

const AnimatedTabIcon = ({ focused, routeName, colors, typography }: any) => {
  let IconComponent;
  let label;
  if (routeName === 'Home') { IconComponent = Home; label = 'Home'; }
  else if (routeName === 'Search') { IconComponent = Search; label = 'Search'; }
  else if (routeName === 'My Posts') { IconComponent = PenSquare; label = 'My Posts'; }
  else if (routeName === 'Messages') { IconComponent = Mail; label = 'Messages'; }
  else if (routeName === 'Profile') { IconComponent = User; label = 'Profile'; }

  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start();
  }, [focused, anim]);

  if (!IconComponent) return null;

  // Pill grows horizontally from the centre behind the active icon
  const pillScaleX = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <View style={tabStyles.item}>
      <View style={tabStyles.iconSlot}>
        <Animated.View
          style={[
            tabStyles.pill,
            { backgroundColor: colors.primaryContainer, opacity: anim, transform: [{ scaleX: pillScaleX }] },
          ]}
        />
        <IconComponent
          color={focused ? colors.primary : colors.onSurfaceVariant}
          size={22}
          strokeWidth={focused ? 2.4 : 2}
        />
      </View>
      <Text
        numberOfLines={1}
        style={{
          ...typography.labelSmall,
          color: focused ? colors.primary : colors.onSurfaceVariant,
          fontWeight: focused ? '700' : '500',
          marginTop: 4,
          fontSize: 11,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  item: { alignItems: 'center', justifyContent: 'center', width: 72 },
  iconSlot: { width: 56, height: 30, alignItems: 'center', justifyContent: 'center' },
  pill: { ...StyleSheet.absoluteFillObject, borderRadius: 15 },
});

export default function TabNavigator() {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: colors.surface,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 0,
          // Soft upward shadow instead of a hairline border
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 12,
        },
        tabBarItemStyle: { height: 64, justifyContent: 'center', alignItems: 'center' },
        tabBarIconStyle: { width: 72, height: 52, marginTop: 0 },
        tabBarIcon: ({ focused }) => (
          <AnimatedTabIcon 
            focused={focused} 
            routeName={route.name} 
            colors={colors} 
            typography={typography} 
          />
        ),
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
