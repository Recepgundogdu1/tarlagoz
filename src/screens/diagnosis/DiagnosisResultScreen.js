// Teşhis sonucu: hastalık adı, güven oranı ve öneri.
// Kayıtlı bir teşhisse silinebilir.

import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import FadeInView from '../../components/motion/FadeInView';
import { ProgressRing } from '../../components/motion/RingChart';
import { deleteDiagnosis } from '../../services/diagnosisService';
import { isOnline, withTimeout } from '../../services/offlineQueue';
import { getErrorMessage, OFFLINE_MESSAGE } from '../../utils/errors';
import { formatDateTime, formatPercent } from '../../utils/format';
import { card, colors, font, radius, spacing } from '../../constants/theme';

// Güven oranına göre kullanıcıya düz bir yorum.
function confidenceComment(confidence) {
  if (confidence >= 0.8) return 'Yüksek güven';
  if (confidence >= 0.5) return 'Orta güven; bir uzmana da gösterin';
  return 'Düşük güven; sonuç kesin değil';
}

export default function DiagnosisResultScreen({ route, navigation }) {
  const params = route.params || {};
  const diagnosis = params.diagnosis || null;
  const imageUri = (diagnosis && diagnosis.imageUrl) || params.localUri || null;
  const saved = Boolean(params.saved && diagnosis && diagnosis.id);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(() => {
    Alert.alert('Teşhis silinsin mi?', 'Bu teşhis kaydı kalıcı olarak silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            if (!(await isOnline())) {
              Alert.alert('Silinemedi', OFFLINE_MESSAGE);
              return;
            }
            await withTimeout(deleteDiagnosis(diagnosis), 15000);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Silinemedi', getErrorMessage(error, 'Teşhis silinemedi.'));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }, [diagnosis, navigation]);

  if (!diagnosis) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="alert-circle-outline"
          title="Sonuç bulunamadı"
          actionTitle="Geri Dön"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const confidence = Number(diagnosis.confidence) || 0;
  const healthy = Boolean(diagnosis.healthy);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />
      ) : null}

      {diagnosis.demo ? (
        <View style={styles.demoBanner}>
          <Ionicons name="flask-outline" size={22} color={colors.warning} />
          <Text style={styles.bannerText}>
            Bu bir demo sonucudur; fotoğraf gerçekten incelenmedi.
          </Text>
        </View>
      ) : null}

      {!params.saved ? (
        <View style={styles.demoBanner}>
          <Ionicons name="cloud-offline-outline" size={22} color={colors.warning} />
          <Text style={styles.bannerText}>
            Sonuç kaydedilemedi (internet sorunu olabilir). Geçmişte görünmeyecek.
          </Text>
        </View>
      ) : null}

      <FadeInView style={[styles.resultCard, healthy ? styles.resultHealthy : styles.resultSick]}>
        <Ionicons
          name={healthy ? 'checkmark-circle' : 'bug'}
          size={36}
          color={healthy ? colors.primary : colors.danger}
        />
        <View style={styles.resultText}>
          <Text style={styles.resultLabel}>Tahmin</Text>
          <Text style={styles.disease}>{diagnosis.disease}</Text>
        </View>
      </FadeInView>

      <FadeInView index={1} style={[styles.card, styles.ringCard]}>
        <ProgressRing
          progress={confidence}
          size={132}
          thickness={14}
          color={confidence >= 0.8 ? colors.primary : confidence >= 0.5 ? colors.wheat : colors.danger}
        >
          <Text style={styles.ringValue}>{formatPercent(confidence)}</Text>
          <Text style={styles.ringLabel}>güven</Text>
        </ProgressRing>
        <View style={styles.ringText}>
          <Text style={styles.cardTitle}>Güven oranı</Text>
          <Text style={styles.muted}>{confidenceComment(confidence)}</Text>
        </View>
      </FadeInView>

      <FadeInView index={2} style={styles.card}>
        <Text style={styles.cardTitle}>Öneri</Text>
        <Text style={styles.advice}>{diagnosis.advice}</Text>
      </FadeInView>

      <Text style={styles.meta}>
        {diagnosis.fieldName ? `${diagnosis.fieldName} · ` : ''}
        {formatDateTime(diagnosis.createdAt)}
      </Text>

      <Text style={styles.disclaimer}>
        Bu sonuç fotoğrafa dayalı bir tahmindir, kesin teşhis değildir. İlaç kullanmadan önce bir
        ziraat mühendisine danışın.
      </Text>

      <PrimaryButton
        title="Yeni Teşhis Yap"
        icon="camera-outline"
        onPress={() => navigation.goBack()}
        style={styles.button}
      />
      {saved ? (
        <PrimaryButton
          title="Bu Teşhisi Sil"
          icon="trash-outline"
          variant="danger"
          onPress={handleDelete}
          loading={deleting}
          style={styles.button}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  photo: {
    width: '100%',
    height: 240,
    borderRadius: radius.lg,
    backgroundColor: colors.earthLight,
    marginBottom: spacing.md,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerText: { flex: 1, marginLeft: spacing.sm, fontSize: font.sm, color: colors.text, lineHeight: 20 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  resultHealthy: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  resultSick: { backgroundColor: colors.dangerLight, borderColor: colors.danger },
  resultText: { flex: 1, marginLeft: spacing.md },
  resultLabel: { fontSize: font.sm, color: colors.textMuted, fontWeight: '600' },
  disease: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  card: { ...card, marginBottom: spacing.md },
  cardTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  ringCard: { flexDirection: 'row', alignItems: 'center' },
  ringText: { flex: 1, marginLeft: spacing.lg },
  ringValue: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  ringLabel: { fontSize: font.xs, color: colors.textMuted, fontWeight: '600' },
  muted: { fontSize: font.sm, color: colors.textMuted },
  advice: { fontSize: font.md, color: colors.text, lineHeight: 24 },
  meta: { fontSize: font.sm, color: colors.textMuted, marginBottom: spacing.sm },
  disclaimer: {
    fontSize: font.sm,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  button: { marginBottom: spacing.md },
});
