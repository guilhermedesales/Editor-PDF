import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, FileText, Folder, Wrench, Settings } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import FilesScreen from '../screens/FileScreen';
import ToolsScreen from '../screens/ToolsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useThemeStore } from '../store/useThemeStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../constants/theme';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 58 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, spacing.xs),
          paddingTop: spacing.xs,
        },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tab.Screen name="Templates" component={TemplatesScreen} options={{ title: 'Templates', tabBarIcon: ({ color, size }) => <FileText color={color} size={size} /> }} />
      <Tab.Screen name="Files" component={FilesScreen} options={{ title: 'Arquivos', tabBarIcon: ({ color, size }) => <Folder color={color} size={size} /> }} />
      <Tab.Screen name="Tools" component={ToolsScreen} options={{ title: 'Ferramentas', tabBarIcon: ({ color, size }) => <Wrench color={color} size={size} /> }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: 'Configurações', tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}