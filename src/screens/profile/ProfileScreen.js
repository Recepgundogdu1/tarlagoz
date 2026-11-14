// Profil: hesap bilgisi, genel özet, çevrimdışı eşitleme durumu, bildirim
// testi ve çıkış.

import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import PrimaryButton from '../../components/PrimaryButton';
import { logoutUser } from '../../store/authSlice';
import { selectPendingCount, syncOfflineExpenses } from '../../store/expensesSlice';
import { sendTestNotification } from '../../services/notificationService';
import { isAiConfigured } from '../../services/aiService';
import { sumExpenses } from '../../utils/calculations';
import { formatDonum, formatTL } from '../../utils/format';
import { card, colors, font, spacing } from '../../constants/theme';

function Row({ icon, label, value }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={22} color={colors.earthDark} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const fields = useSelector((state) => state.fields.items);
  const expenses = useSelector((state) => state.expenses.items);
  const pendingCount = useSelector(selectPendingCount);
  const syncing = useSelector((state) => state.expenses.syncing);
  const [loggingOut, setLoggingOut] = useState(false);
  const [testing, setTesting] = useState(false);

  const totalArea = useMemo(
    () => Math.round(fields.reduce((sum, f) => sum + (Number(f.area) || 0), 0) * 10) / 10,
    [fields]
  );
  const totalExpense = useMemo(() => sumExpenses(expenses), [expenses]);

  const handleSync = useCallback(async () => {
    try {
      const result = await dispatch(syncOfflineExpenses()).unwrap();
      if (result.remaining > 0) {
        Alert.alert(
          'Eşitleme tamamlanamadı',
          `${result.remaining} masraf hâlâ bekliyor. İnternet bağlantınızı kontrol edip tekrar deneyin.`
        );
      } else {
        Alert.alert('Eşitleme tamam', 'Bekleyen masraf kalmadı.');
      }
    } catch (error) {
      // Başka bir eşitleme sürüyorsa thunk çalışmaz; kullanıcıya sade bir bilgi verilir.
      Alert.alert('Eşitleme', 'Eşitleme zaten sürüyor. Biraz sonra tekrar deneyin.');
    }
  }, [dispatch]);

  const handleTestNotification = useCallback(async () => {
    setTesting(true);
    try {
      const sent = await sendTestNotification();
      if (!sent) {
        Alert.alert(
          'Bildirim izni yok',
          'Don uyarılarını alabilmek için telefonun Ayarlar bölümünden TarlaGöz bildirimlerine izin verin.'
        );
      }
    } catch (error) {
      Alert.alert('Bildirim gönderilemedi', 'Bu cihazda bildirim gönderilemedi.');
    } finally {
      setTesting(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    const message =
      pendingCount > 0
        ? `${pendingCount} masraf henüz gönderilmedi. Çıkış yaparsanız bu masraflar telefonda kalır ve tekrar giriş yaptığınızda gönderilir. Çıkmak istiyor musunuz?`
        : 'Hesabınızdan çıkmak istiyor musunuz?';
    Alert.alert('Çıkış', message, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await dispatch(logoutUser()).unwrap();
          } catch (errorMessage) {
            setLoggingOut(false);
            Alert.alert('Çıkış yapılamadı', String(errorMessage));
          }
        },
      },
    ]);
  }, [dispatch, pendingCount]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={colors.white} />
        </View>
        <Text style={styles.name}>{(user && user.name) || 'Çiftçi'}</Text>
        <Text style={styles.email}>{user ? user.email : ''}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Özet</Text>
        <Row icon="leaf-outline" label="Tarla sayısı" value={String(fields.length)} />
        <Row icon="resize-outline" label="Toplam alan" value={formatDonum(totalArea)} />
        <Row icon="cash-outline" label="Kayıtlı toplam masraf" value={formatTL(totalExpense)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Eşitleme</Text>
        <Text style={styles.text}>
          {pendingCount > 0
            ? `${pendingCount} masraf telefonda bekliyor. İnternet gelince kendiliğinden gönderilir.`
            : 'Tüm masraflarınız sunucuya kaydedilmiş.'}
        </Text>
        {pendingCount > 0 ? (
          <PrimaryButton
            title="Şimdi Gönder"
            icon="cloud-upload-outline"
            onPress={handleSync}
            loading={syncing}
            style={styles.cardButton}
          />
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bildirimler</Text>
        <Text style={styles.text}>
          Tarlalarınızdan birinde don bekleniyorsa telefonunuza uyarı gelir.
        </Text>
        <PrimaryButton
          title="Test Bildirimi Gönder"
          icon="notifications-outline"
          variant="outline"
          onPress={handleTestNotification}
          loading={testing}
          style={styles.cardButton}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Yapay zekâ servisi</Text>
        <Text style={styles.text}>
          {isAiConfigured
            ? 'Hastalık tespiti ve fiş okuma etkin.'
            : 'Demo modunda: hastalık tespiti ve fiş okuma örnek sonuç gösterir.'}
        </Text>
      </View>

      <PrimaryButton
        title="Çıkış Yap"
        icon="log-out-outline"
        variant="danger"
        onPress={handleLogout}
        loading={loggingOut}
      />
      <Text style={styles.version}>TarlaGöz 1.0.0 · AlpoTech</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: font.xl, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  email: { fontSize: font.md, color: colors.textMuted, marginTop: 2 },
  card: { ...card, marginBottom: spacing.lg },
  cardTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  cardButton: { marginTop: spacing.md },
  text: { fontSize: font.md, color: colors.text, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  rowLabel: { flex: 1, marginLeft: spacing.md, fontSize: font.md, color: colors.text },
  rowValue: { fontSize: font.md, fontWeight: '700', color: colors.text },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: font.sm, marginTop: spacing.xl },
});
