// "Harita" sekmesi: tüm tarlaların haritada görünümü.

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from '../screens/map/MapScreen';
import { stackScreenOptions } from './options';

const Stack = createNativeStackNavigator();

export default function MapStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Harita' }} />
    </Stack.Navigator>
  );
}
