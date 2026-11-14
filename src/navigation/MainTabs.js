// Oturum açıkken gösterilen alt sekmeler. Her sekmenin kendi yığını (stack) var.
// Seçili sekmenin ikonu yumuşak yeşil bir "hap" arka plan üzerinde gösterilir.

import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FieldsStack from './FieldsStack';
import MapStack from './MapStack';
import DiagnosisStack from './DiagnosisStack';
import MarketStack from './MarketStack';
import ProfileStack from './ProfileStack';
import { prefersReducedMotion } from '../utils/motion';
import { colors, font, radius, shadows } from '../constants/theme';

const Tab = createBottomTabNavigator();

const ICONS = {
  FieldsTab: 'leaf',
  MapTab: 'map',
  DiagnosisTab: 'scan',
  MarketTab: 'pricetags',
  ProfileTab: 'person',
};

function TabIcon({ name, focused, color }) {
  // Sekme seçildiğinde ikon kısa bir zıplama yapar.
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!focused || prefersReducedMotion()) return undefined;
    const animation = Animated.sequence([
      Animated.timing(scale, { toValue: 1.22, duration: 110, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 14 }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [focused, scale]);

  return (
    <Animated.View
      style={[styles.iconWrap, focused && styles.iconWrapActive, { transform: [{ scale }] }]}
    >
      <Ionicons name={focused ? name : `${name}-outline`} size={22} color={color} />
    </Animated.View>
  );
}

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  // Alt çubuk yüksekliği: güvenli alan (iPhone alt çizgisi / Android gezinme çubuğu) dahil
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 10);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // başlığı her sekmenin kendi yığını gösteriyor
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: font.xs, fontWeight: '700', marginTop: 2 },
        tabBarHideOnKeyboard: true,
        tabBarStyle: [styles.tabBar, { height: 64 + bottomPad, paddingBottom: bottomPad }],
        tabBarIcon: ({ color, focused }) => (
          <TabIcon name={ICONS[route.name]} focused={focused} color={color} />
        ),
      })}
    >
      <Tab.Screen name="FieldsTab" component={FieldsStack} options={{ title: 'Tarlalarım' }} />
      <Tab.Screen name="MapTab" component={MapStack} options={{ title: 'Harita' }} />
      <Tab.Screen name="DiagnosisTab" component={DiagnosisStack} options={{ title: 'Teşhis' }} />
      <Tab.Screen name="MarketTab" component={MarketStack} options={{ title: 'Pazar' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    paddingTop: 8,
    ...shadows.lg,
  },
  iconWrap: {
    width: 52,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.primaryLight },
});
