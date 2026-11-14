// Tarla Karnesi: sezon sezon ürün, toplam masraf, kâr ve dönüm başı kazanç.
// "rows" dizisi utils/calculations.js içindeki buildReportCard çıktısıdır.
// Gerçekleşen (kapatılmış) sezonlar ile tahmini (devam eden) sezon ayrı
// etiketlenir; alıcı hangi rakamın kesin olduğunu görür.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatKg, formatTL } from '../utils/format';
import { card, colors, font, radius, spacing } from '../constants/theme';

function Line({ label, value, valueStyle = null }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={[styles.lineValue, valueStyle]}>{value}</Text>
    </View>
  );
}

function FieldReportCard({ rows, title = 'Tarla Karnesi' }) {
  const list = Array.isArray(rows) ? rows : [];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="ribbon-outline" size={24} color={colors.earthDark} />
        <Text style={styles.title}>{title}</Text>
      </View>

      {list.length === 0 ? (
        <Text style={styles.empty}>Bu tarla için kayıtlı sezon bilgisi yok.</Text>
      ) : (
        list.map((row, index) => {
          const loss = row.netProfit < 0;
          return (
            <View
              key={`${row.season}-${row.crop}-${index}`}
              style={[styles.season, index > 0 && styles.seasonBorder]}
            >
              <View style={styles.seasonHeader}>
                <Text style={styles.seasonTitle}>
                  {row.season} · {row.cropLabel}
                </Text>
                <View style={[styles.badge, row.isEstimate ? styles.badgeEstimate : styles.badgeReal]}>
                  <Text
                    style={[
                      styles.badgeText,
                      row.isEstimate ? styles.badgeTextEstimate : styles.badgeTextReal,
                    ]}
                  >
                    {row.isEstimate ? 'Tahmini' : 'Gerçekleşen'}
                  </Text>
                </View>
              </View>
              <Line label="Toplam masraf" value={formatTL(row.totalExpense)} />
              <Line
                label={row.isEstimate ? 'Tahmini hasat' : 'Hasat'}
                value={`${formatKg(row.harvestKg)} (${formatKg(row.yieldPerDonum)}/dönüm)`}
              />
              <Line
                label={row.isEstimate ? 'Tahmini net kâr' : 'Net kâr'}
                value={formatTL(row.netProfit)}
                valueStyle={loss ? styles.loss : styles.profit}
              />
              <Line
                label="Dönüm başı kazanç"
                value={formatTL(row.profitPerDonum)}
                valueStyle={loss ? styles.loss : styles.profit}
              />
            </View>
          );
        })
      )}

      <Text style={styles.footnote}>
        Rakamlar tarla sahibinin uygulamaya girdiği kayıtlara dayanır.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...card, marginBottom: spacing.lg, backgroundColor: colors.earthLight },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  title: { marginLeft: spacing.sm, fontSize: font.lg, fontWeight: '800', color: colors.earthDark },
  empty: { fontSize: font.md, color: colors.textMuted, marginVertical: spacing.sm },
  season: { paddingVertical: spacing.md },
  seasonBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  seasonTitle: { flex: 1, fontSize: font.md, fontWeight: '700', color: colors.text },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  badgeEstimate: { backgroundColor: colors.warningLight },
  badgeReal: { backgroundColor: colors.primaryLight },
  badgeText: { fontSize: font.xs, fontWeight: '700' },
  badgeTextEstimate: { color: colors.warning },
  badgeTextReal: { color: colors.primaryDark },
  line: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  lineLabel: { fontSize: font.sm, color: colors.textMuted, flex: 1 },
  lineValue: { fontSize: font.sm, fontWeight: '700', color: colors.text },
  profit: { color: colors.primary },
  loss: { color: colors.danger },
  footnote: { marginTop: spacing.sm, fontSize: font.xs, color: colors.textMuted, lineHeight: 16 },
});

export default React.memo(FieldReportCard);
