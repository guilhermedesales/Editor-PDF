import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabs from './BottomTabs';
import TemplateEditorScreen from '../screens/TemplateEditorScreen';
import TemplateFillScreen from '../screens/TemplateFillScreen';
import PdfViewerScreen from '../screens/PdfViewerScreen';
import MergePdfScreen from '../screens/MergePdfScreen';
import ConvertToPdfScreen from '../screens/ConvertToPdfScreen';
import SplitPdfScreen from '../screens/SplitPdfScreen';
import CompressPdfScreen from '../screens/CompressPdfScreen';
import { colors } from '../constants/theme';

export type RootStackParamList = {
  MainTabs: undefined;
  TemplateEditor: { templateId?: string };
  TemplateFill: { templateId: string };
  PdfViewer: { uri: string; name: string };
  MergePdf: undefined;
  ConvertToPdf: undefined;
  SplitPdf: undefined;
  CompressPdf: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTintColor: colors.primary, headerTitleStyle: { fontWeight: '600' } }}>
        <Stack.Screen name="MainTabs" component={BottomTabs} options={{ headerShown: false }} />
        <Stack.Screen name="TemplateEditor" component={TemplateEditorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TemplateFill" component={TemplateFillScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PdfViewer" component={PdfViewerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MergePdf" component={MergePdfScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ConvertToPdf" component={ConvertToPdfScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SplitPdf" component={SplitPdfScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CompressPdf" component={CompressPdfScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}