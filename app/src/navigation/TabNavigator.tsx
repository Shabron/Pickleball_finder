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
import { Home, Search, PenSquare, Mail, User } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

import HomeScreen from '../screens/main/HomeScreen';
import SearchScreen from '../screens/main/SearchScreen';
import MyPostsScreen from '../screens/main/MyPostsScreen';
import MessagesListScreen from '../screens/main/MessagesListScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();

const AnimatedTabIcon = ({ focused, routeName, colors, typography }) => {
  let IconComponent;
  let label;
  if (routeName === 'Home') { IconComponent = Home; label = 'Home'; }
  else if (routeName === 'Search') { IconComponent = Search; label = 'Search'; }
  else if (routeName === 'My Posts') { IconComponent = PenSquare; label = 'My Posts'; }
  else if (routeName === 'Messages') { IconComponent = Mail; label = 'Messages'; }
  else if (routeName === 'Profile') { IconComponent = User; label = 'Profile'; }

  if (!IconComponent) return null;

  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 60,
    }).start();
  }, [focused, anim]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1]
  });
  
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3]
  });

  const dotOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const dotScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1]
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 64, height: 50 }}>
      <Animated.View style={{ 
          transform: [{ scale }, { translateY }], 
          alignItems: 'center', 
          justifyContent: 'center',
        }}>
        <IconComponent
          color={focused ? colors.primary : colors.onSurfaceVariant}
          size={24}
          strokeWidth={focused ? 2.5 : 2}
        />
        <Text
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
      </Animated.View>
      
      {/* Animated Dot Indicator */}
      <Animated.View 
        style={{
          position: 'absolute',
          bottom: 0,
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: colors.primary,
          opacity: dotOpacity,
          transform: [{ scale: dotScale }]
        }}
      />
    </View>
  );
};

export default function TabNavigator() {
  const { colors, typography, sizes } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.surfaceVariant,
          backgroundColor: colors.surfaceContainerLow,
          height: sizes.tabBarHeight,
          paddingBottom: 8,
          paddingTop: 8,
          // Ambient shadow
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 8,
        },
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
