// "Teşhis" sekmesi: fotoğraftan hastalık tespiti ve sonuç ekranı.

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DiagnosisScreen from '../screens/diagnosis/DiagnosisScreen';
import DiagnosisResultScreen from '../screens/diagnosis/DiagnosisResultScreen';
import { stackScreenOptions } from './options';

const Stack = createNativeStackNavigator();

export default function DiagnosisStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Diagnosis" component={DiagnosisScreen} options={{ title: 'Hastalık Tespiti' }} />
      <Stack.Screen
        name="DiagnosisResult"
        component={DiagnosisResultScreen}
        options={{ title: 'Teşhis Sonucu' }}
      />
    </Stack.Navigator>
  );
}
