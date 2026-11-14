// "Pazar" sekmesi: satılık tarla ilanları, ilan detayı ve ilan oluşturma.

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListingListScreen from '../screens/market/ListingListScreen';
import ListingDetailScreen from '../screens/market/ListingDetailScreen';
import CreateListingScreen from '../screens/market/CreateListingScreen';
import { stackScreenOptions } from './options';

const Stack = createNativeStackNavigator();

export default function MarketStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ListingList" component={ListingListScreen} options={{ title: 'Tarla Pazarı' }} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: 'İlan' }} />
      <Stack.Screen name="CreateListing" component={CreateListingScreen} options={{ title: 'İlan Ver' }} />
    </Stack.Navigator>
  );
}
