// Fiş tarama: fiş fotoğrafı çekilir veya galeriden seçilir, yapay zekâ servisi
// tutarı ve masraf kalemini okur. Kullanıcı sonucu görür ve onaylarsa değerler
// masraf formuna aktarılır (kayıt formda yapılır, burada değil).

import React, { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import PrimaryButton from '../../components/PrimaryButton';
import Loading from '../../components/Loading';
import ErrorView from '../../components/ErrorView';
import { setReceiptDraft } from '../../store/expensesSlice';
import { AI_TASKS, analyzeImage, isAiConfigured } from '../../services/aiService';
import { pickImage } from '../../utils/device';
import { getErrorMessage } from '../../utils/errors';
import { formatTL, isoToTR } from '../../utils/format';
import { getCategory } from '../../constants/expenseCategories';
import { card, colors, font, radius, spacing } from '../../constants/theme';

export default function ReceiptScanScreen({ navigation }) {
  const dispatch = useDispatch();
  const [photoUri, setPhotoUri] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePick = useCallback(async (fromCamera) => {
    setError(null);
    try {
      const photo = await pickImage({ fromCamera, base64: true, quality: 0.4 });
      if (!photo) return; // kullanıcı vazgeçti
      setPhotoUri(photo.uri);
      setResult(null);
      setAnalyzing(true);
      const analysis = await analyzeImage(photo.base64, AI_TASKS.RECEIPT);
      setResult(analysis);
    } catch (err) {
      setError(getErrorMessage(err, 'Fiş okunamadı. Tekrar deneyin.'));
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleUse = useCallback(() => {
    if (!result) return;
    dispatch(
      setReceiptDraft({
        amount: result.amount,
        category: result.category,
        date: result.date,
        note: result.note,
      })
    );
    navigation.goBack();
  }, [dispatch, navigation, result]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!isAiConfigured ? (
        <View style={styles.demoBanner}>
          <Ionicons name="flask-outline" size={22} color={colors.warning} />
          <Text style={styles.demoText}>
            Demo modu: yapay zekâ servisi ayarlanmadı. Fiş gerçekten okunmaz, örnek değerler gösterilir.
          </Text>
        </View>
      ) : null}

      <Text style={styles.help}>
        Fişi düz bir yere koyun, tamamı görünecek şekilde ve aydınlık ortamda çekin.
      </Text>

      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="contain" />
      ) : (
        <View style={[styles.photo, styles.placeholder]}>
          <Ionicons name="receipt-outline" size={64} color={colors.textMuted} />
        </View>
      )}

      {analyzing ? <Loading message="Fiş okunuyor..." /> : null}
      {error ? <ErrorView message={error} style={styles.error} /> : null}

      {result && !analyzing ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Fişten okunan değerler</Text>
          <Text style={styles.resultLine}>
            Tutar: {result.amount ? formatTL(result.amount, 2) : 'Okunamadı'}
          </Text>
          <Text style={styles.resultLine}>Kalem: {getCategory(result.category).label}</Text>
          <Text style={styles.resultLine}>
            Tarih: {result.date ? isoToTR(result.date) : 'Okunamadı (bugün kullanılacak)'}
          </Text>
          {result.note ? <Text style={styles.resultLine}>Not: {result.note}</Text> : null}
          <Text style={styles.resultHint}>
            Değerleri formda değiştirebilirsiniz. Kaydetmeden önce mutlaka kontrol edin.
          </Text>
          <PrimaryButton
            title="Forma Aktar"
            icon="arrow-forward-circle-outline"
            onPress={handleUse}
            style={styles.useButton}
          />
        </View>
      ) : null}

      <PrimaryButton
        title={photoUri ? 'Yeniden Çek' : 'Fotoğraf Çek'}
        icon="camera-outline"
        onPress={() => handlePick(true)}
        disabled={analyzing}
        style={styles.button}
      />
      <PrimaryButton
        title="Galeriden Seç"
        icon="images-outline"
        variant="outline"
        onPress={() => handlePick(false)}
        disabled={analyzing}
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  help: { fontSize: font.md, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 22 },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  demoText: { flex: 1, marginLeft: spacing.sm, fontSize: font.sm, color: colors.text, lineHeight: 20 },
  photo: {
    width: '100%',
    height: 280,
    borderRadius: radius.lg,
    backgroundColor: colors.earthLight,
    marginBottom: spacing.md,
  },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  error: { marginHorizontal: 0 },
  resultCard: { ...card, marginBottom: spacing.md },
  resultTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  resultLine: { fontSize: font.md, color: colors.text, marginBottom: 4 },
  resultHint: { fontSize: font.sm, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 20 },
  useButton: { marginTop: spacing.md },
  button: { marginBottom: spacing.md },
});
