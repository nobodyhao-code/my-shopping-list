import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { OffersScreen } from '../screens/OffersScreen';
import { LoyaltyScreen } from '../screens/LoyaltyScreen';
import { StoresScreen } from '../screens/StoresScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { colors } from '../theme/colors';
import { useUser } from '../context/UserContext';

const Tab = createBottomTabNavigator();

function iconFor(routeName) {
  switch (routeName) {
    case 'Home':
      return '🏠';
    case 'Offers':
      return '🏷️';
    case 'Card':
      return '💳';
    case 'Stores':
      return '📍';
    case 'Profile':
      return '👤';
    default:
      return '•';
  }
}

export function AppNavigator() {
  const { isAuthenticated } = useUser();

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.dark,
        headerTitleStyle: { fontWeight: '900' },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { height: 66, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>{iconFor(route.name)}</Text>
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Offers" component={OffersScreen} />
      <Tab.Screen name="Card" component={LoyaltyScreen} options={{ title: 'Loyalty Card' }} />
      <Tab.Screen name="Stores" component={StoresScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
