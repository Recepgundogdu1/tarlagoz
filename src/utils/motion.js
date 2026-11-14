// Hareket (animasyon) yardımcıları. Tüm animasyonlu bileşenler bu dosyadaki
// kancaları (hook) kullanır.
//
// Erişilebilirlik: Kullanıcı telefonunda "hareketi azalt" ayarını açtıysa
// animasyonlar atlanır ve içerik doğrudan son haliyle gösterilir.

import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';

let reduceMotion = false;

try {
  AccessibilityInfo.isReduceMotionEnabled()
    .then((enabled) => {
      reduceMotion = Boolean(enabled);
    })
    .catch(() => {});
  AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
    reduceMotion = Boolean(enabled);
  });
} catch (error) {
  // Bazı ortamlarda bu API bulunmayabilir; animasyonlar açık kalır.
}

export function prefersReducedMotion() {
  return reduceMotion;
}

// Giriş animasyonu: bileşen ekrana gelirken aşağıdan yukarı kayarak belirir.
// Dönen değer doğrudan bir Animated.View'in style özelliğine verilir.
export function useEntrance({ delay = 0, distance = 18, duration = 420 } = {}) {
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return undefined;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true, // animasyon arayüz iş parçacığında çalışır, takılmaz
    });
    animation.start();
    return () => animation.stop();
  }, [progress, delay, duration]);

  return {
    opacity: progress,
    transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
    ],
  };
}

// Sayıyı hedef değere doğru sayarak artırır (ör. 0 -> 150.000).
// Hedef değişirse o anki değerden yeni hedefe doğru devam eder.
export function useCountUp(target, { duration = 900 } = {}) {
  const numeric = Number(target);
  const safeTarget = Number.isFinite(numeric) ? numeric : 0;
  const [value, setValue] = useState(reduceMotion ? safeTarget : 0);
  const currentRef = useRef(reduceMotion ? safeTarget : 0);

  useEffect(() => {
    if (reduceMotion) {
      currentRef.current = safeTarget;
      setValue(safeTarget);
      return undefined;
    }
    const from = currentRef.current;
    const startedAt = Date.now();
    let frame = null;

    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // sona doğru yavaşlar
      const current = t >= 1 ? safeTarget : from + (safeTarget - from) * eased;
      currentRef.current = current;
      setValue(current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [safeTarget, duration]);

  return value;
}

// 0 -> 1 -> 0 arasında sürekli gidip gelen değer (süzülme, nefes alma efektleri).
export function useLoop(duration = 3000) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return undefined;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [value, duration]);

  return value;
}

// 0 -> 1 arasında durmadan tekrar eden değer (yayılan halka, parıltı efektleri).
export function useRepeat(duration = 2000, delay = 0) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return undefined;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [value, duration, delay]);

  return value;
}

// Dokunsal geri bildirim (hafif titreşim). Desteklemeyen cihazda sessizce geçilir.
export function hapticTap() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch (error) {
    // yok sayılır
  }
}

export function hapticSuccess() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch (error) {
    // yok sayılır
  }
}

export function hapticWarning() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  } catch (error) {
    // yok sayılır
  }
}
