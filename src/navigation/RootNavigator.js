// Uygulamanın en üst gezinme katmanı.
//  - Firebase oturumunu dinler ve Redux'a yazar.
//  - Oturum varsa sekmeleri, yoksa giriş ekranlarını gösterir.
//  - Oturum açıkken çevrimdışı masraf kuyruğunu belirli anlarda eşitler.

import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import { auth } from '../firebase/config';
import { setUser, toPlainUser } from '../store/authSlice';
import { syncOfflineExpenses } from '../store/expensesSlice';
import { initNotifications } from '../services/notificationService';
import Loading from '../components/Loading';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { navigationTheme } from './options';

const SYNC_INTERVAL_MS = 60 * 1000;

export default function RootNavigator() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const initializing = useSelector((state) => state.auth.initializing);
  const uid = user ? user.uid : null;

  // Oturum dinleyicisi: uygulama açıldığında kayıtlı oturum varsa kullanıcı
  // tekrar giriş yapmadan içeri alınır (oturum kalıcılığı).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      dispatch(setUser(toPlainUser(firebaseUser)));
    });
    return unsubscribe;
  }, [dispatch]);

  // Çevrimdışı kuyruk eşitlemesi: girişte, uygulama öne geldiğinde ve
  // dakikada bir. Kuyruk boşsa işlem hemen biter, ağ isteği atılmaz.
  useEffect(() => {
    if (!uid) return undefined;

    initNotifications();
    dispatch(syncOfflineExpenses());

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') dispatch(syncOfflineExpenses());
    });
    const timer = setInterval(() => dispatch(syncOfflineExpenses()), SYNC_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [dispatch, uid]);

  if (initializing) {
    return <Loading fullScreen message="TarlaGöz açılıyor..." />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
