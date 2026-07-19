import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { useThemeStore, hydrateThemeStore } from './src/store/useThemeStore';

export default function App() {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    hydrateThemeStore();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </SafeAreaProvider>
  );
}