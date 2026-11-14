// "Tarlalarım" sekmesinin ekranları: liste, detay (kâr panosu), tarla ekleme,
// sınır çizme, masraf ekleme, fiş tarama, sezon kapatma ve "Ne ekelim?".

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FieldListScreen from '../screens/fields/FieldListScreen';
import FieldDetailScreen from '../screens/fields/FieldDetailScreen';
import AddFieldScreen from '../screens/fields/AddFieldScreen';
import CloseSeasonScreen from '../screens/fields/CloseSeasonScreen';
import DrawFieldScreen from '../screens/map/DrawFieldScreen';
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen';
import ReceiptScanScreen from '../screens/expenses/ReceiptScanScreen';
import CropCompareScreen from '../screens/compare/CropCompareScreen';
import { stackScreenOptions } from './options';

const Stack = createNativeStackNavigator();

export default function FieldsStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="FieldList" component={FieldListScreen} options={{ title: 'Tarlalarım' }} />
      <Stack.Screen name="FieldDetail" component={FieldDetailScreen} options={{ title: 'Tarla' }} />
      <Stack.Screen name="AddField" component={AddFieldScreen} options={{ title: 'Tarla Ekle' }} />
      <Stack.Screen name="DrawField" component={DrawFieldScreen} options={{ title: 'Sınır Çiz' }} />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{ title: 'Masraf Ekle', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="ReceiptScan" component={ReceiptScanScreen} options={{ title: 'Fiş Tara' }} />
      <Stack.Screen name="CloseSeason" component={CloseSeasonScreen} options={{ title: 'Sezonu Kapat' }} />
      <Stack.Screen
        name="CropCompare"
        component={CropCompareScreen}
        options={{ title: 'Ne Ekelim?', animation: 'fade_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
