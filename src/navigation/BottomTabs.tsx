// Navbar inferior com 5 abas: Home (dashboard), Templates, Arquivos,
// Ferramentas, Configurações. As duas últimas são placeholders por
// enquanto — vão ganhar telas próprias nas próximas etapas.

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, FileText, Folder, Wrench, Settings } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import { colors } from '../constants/theme';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondary,
        tabBarStyle: { borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Templates"
        component={TemplatesScreen}
        options={{ title: 'Templates', tabBarIcon: ({ color, size }) => <FileText color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Files"
        options={{ title: 'Arquivos', tabBarIcon: ({ color, size }) => <Folder color={color} size={size} /> }}
      >
        {() => <PlaceholderScreen title="Arquivos" />}
      </Tab.Screen>
      <Tab.Screen
        name="Tools"
        options={{ title: 'Ferramentas', tabBarIcon: ({ color, size }) => <Wrench color={color} size={size} /> }}
      >
        {() => <PlaceholderScreen title="Ferramentas" />}
      </Tab.Screen>
      <Tab.Screen
        name="SettingsTab"
        options={{ title: 'Configurações', tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }}
      >
        {() => <PlaceholderScreen title="Configurações" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}