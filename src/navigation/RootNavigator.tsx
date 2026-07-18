import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import TemplateEditorScreen from '../screens/TemplateEditorScreen';
import { colors } from '../constants/theme';

export type RootStackParamList = {
  Home: undefined;
  TemplateEditor: { templateId?: string };
  TemplateFill: { templateId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="TemplateEditor"
          component={TemplateEditorScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}