// Hava özeti. İki kullanım:
//  - compact: tarla kartında tek satır (bugünün sıcaklığı, varsa don işareti)
//  - tam: tarla detayında 7 günlük şerit ve don uyarısı

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { describeWeather } from '../services/weatherService';
import { dayNameShort, isoToTR } from '../utils/format';
import { colors, font, radius, spacing } from '../constants/theme';

function formatTemp(value) {
  return typeof value === 'number' ? `${Math.round(value)}°` : '-';
}

function WeatherBadge({ weather, compact = false }) {
  const days = weather && Array.isArray(weather.days) ? weather.days : [];
  const frostDays = weather && Array.isArray(weather.frostDays) ? weather.frostDays : [];

  if (days.length === 0) {
    if (compact) return null;
    return (
      <View style={styles.box}>
        <Text style={styles.muted}>
          {weather && weather.loading
            ? 'Hava tahmini yükleniyor...'
            : (weather && weather.error) || 'Hava tahmini için tarlanın konumu gerekli.'}
        </Text>
      </View>
    );
  }

  const today = days[0];
  const todayInfo = describeWeather(today.code);
  const hasFrost = frostDays.length > 0;

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <Ionicons name={todayInfo.icon} size={18} color={colors.earthDark} />
        <Text style={styles.compactText}>
          {formatTemp(today.tMax)} / {formatTemp(today.tMin)}
        </Text>
        {hasFrost ? (
          <View style={styles.frostPill}>
            <Ionicons name="snow" size={14} color={colors.info} />
            <Text style={styles.frostPillText}>Don riski</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <Text style={styles.heading}>7 Günlük Hava</Text>
      {hasFrost ? (
        <View style={styles.frostBox} accessibilityRole="alert">
          <Ionicons name="snow" size={22} color={colors.info} />
          <Text style={styles.frostText}>
            Don uyarısı: {isoToTR(frostDays[0].date)} günü en düşük{' '}
            {Math.round(frostDays[0].tMin)}°C bekleniyor.
          </Text>
        </View>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {days.map((day) => {
          const info = describeWeather(day.code);
          const frost = typeof day.tMin === 'number' && day.tMin < 0;
          return (
            <View key={day.date} style={[styles.day, frost && styles.dayFrost]}>
              <Text style={styles.dayName}>{dayNameShort(day.date)}</Text>
              <Ionicons name={info.icon} size={26} color={colors.earthDark} />
              <Text style={styles.tMax}>{formatTemp(day.tMax)}</Text>
              <Text style={[styles.tMin, frost && styles.tMinFrost]}>{formatTemp(day.tMin)}</Text>
              <Text style={styles.rain}>
                {typeof day.precipitation === 'number' ? `${Math.round(day.precipitation)} mm` : '-'}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heading: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  muted: { fontSize: font.md, color: colors.textMuted },
  frostBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  frostText: { flex: 1, marginLeft: spacing.sm, fontSize: font.md, color: colors.text, fontWeight: '600' },
  day: {
    width: 68,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.earthLight,
  },
  dayFrost: { backgroundColor: colors.infoLight },
  dayName: { fontSize: font.sm, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  tMax: { fontSize: font.md, fontWeight: '700', color: colors.text, marginTop: spacing.xs },
  tMin: { fontSize: font.sm, color: colors.textMuted },
  tMinFrost: { color: colors.info, fontWeight: '700' },
  rain: { fontSize: font.xs, color: colors.textMuted, marginTop: spacing.xs },
  compactRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  compactText: { marginLeft: spacing.xs, fontSize: font.sm, color: colors.earthDark, fontWeight: '600' },
  frostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.infoLight,
  },
  frostPillText: { marginLeft: 4, fontSize: font.xs, color: colors.info, fontWeight: '700' },
});

export default React.memo(WeatherBadge);
