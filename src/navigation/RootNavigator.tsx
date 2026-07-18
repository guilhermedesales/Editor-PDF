import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabs from './BottomTabs';
import TemplateEditorScreen from '../screens/TemplateEditorScreen';
import TemplateFillScreen from '../screens/TemplateFillScreen';
import { colors } from '../constants/theme';

export type RootStackParamList = {
  MainTabs: undefined;
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
        <Stack.Screen name="MainTabs" component={BottomTabs} options={{ headerShown: false }} />
        <Stack.Screen name="TemplateEditor" component={TemplateEditorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TemplateFill" component={TemplateFillScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}