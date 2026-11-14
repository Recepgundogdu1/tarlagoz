// Hastalık tespiti: tarla seçilir, bitki fotoğrafı çekilir veya galeriden
// seçilir, yapay zekâ servisi hastalık tahmini yapar. Sonuç tarlaya bağlı
// olarak Firestore'a kaydedilir ve geçmiş teşhisler altta listelenir.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import ChipSelect from '../../components/ChipSelect';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import ErrorView from '../../components/ErrorView';
import Loading from '../../components/Loading';
import { fetchFields } from '../../store/fieldsSlice';
import { AI_TASKS, analyzeImage, isAiConfigured } from '../../services/aiService';
import { fetchDiagnoses, saveDiagnosis } from '../../services/diagnosisService';
import { isOnline, withTimeout } from '../../services/offlineQueue';
import { pickImage } from '../../utils/device';
import { getErrorMessage, OFFLINE_MESSAGE } from '../../utils/errors';
import { formatDateTime, formatPercent } from '../../utils/format';
import { colors, font, radius, spacing } from '../../constants/theme';

export default function DiagnosisScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const uid = useSelector((state) => (state.auth.user ? state.auth.user.uid : null));
  const fields = useSelector((state) => state.fields.items);
  const fieldsStatus = useSelector((state) => state.fields.status);

  const paramFieldId = route.params ? route.params.fieldId : null;
  const [selectedFieldId, setSelectedFieldId] = useState(paramFieldId);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (fieldsStatus === 'idle') dispatch(fetchFields());
  }, [dispatch, fieldsStatus]);

  // Tarla detayından gelindiyse o tarla seçili gelsin.
  useEffect(() => {
    if (paramFieldId) setSelectedFieldId(paramFieldId);
  }, [paramFieldId]);

  // Seçili tarla yoksa (veya silindiyse) ilk tarlayı seç.
  useEffect(() => {
    if (fields.length === 0) return;
    const exists = fields.some((f) => f.id === selectedFieldId);
    if (!exists) setSelectedFieldId(fields[0].id);
  }, [fields, selectedFieldId]);

  const loadHistory = useCallback(async () => {
    if (!uid) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      if (!(await isOnline())) {
        setHistoryError(OFFLINE_MESSAGE);
        return;
      }
      const items = await withTimeout(fetchDiagnoses(uid), 15000);
      setHistory(items);
    } catch (error) {
      setHistoryError(getErrorMessage(error, 'Geçmiş teşhisler yüklenemedi.'));
    } finally {
      setHistoryLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Ekrana her dönüşte geçmişi yenile (sonuç ekranında silme yapılmış olabilir).
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadHistory);
    return unsubscribe;
  }, [navigation, loadHistory]);

  const selectedField = useMemo(
    () => fields.find((f) => f.id === selectedFieldId) || null,
    [fields, selectedFieldId]
  );

  const fieldOptions = useMemo(
    () => fields.map((f) => ({ key: f.id, label: f.name })),
    [fields]
  );

  const fieldHistory = useMemo(
    () => history.filter((d) => d.fieldId === selectedFieldId),
    [history, selectedFieldId]
  );

  const handlePick = useCallback(
    async (fromCamera) => {
      if (!selectedField) {
        Alert.alert('Tarla seçin', 'Teşhisin kaydedileceği tarlayı seçin.');
        return;
      }
      try {
        const photo = await pickImage({ fromCamera, base64: true, quality: 0.4 });
        if (!photo) return; // kullanıcı vazgeçti
        setAnalyzing(true);

        const result = await analyzeImage(photo.base64, AI_TASKS.DIAGNOSIS);

        // Kaydetme başarısız olsa bile sonucu kullanıcıya gösteriyoruz.
        let saved = null;
        try {
          saved = await withTimeout(
            saveDiagnosis(uid, {
              fieldId: selectedField.id,
              fieldName: selectedField.name,
              result,
              photoUri: photo.uri,
            }),
            60000
          );
        } catch (saveError) {
          saved = null;
        }

        navigation.navigate('DiagnosisResult', {
          diagnosis: saved || {
            ...result,
            fieldId: selectedField.id,
            fieldName: selectedField.name,
            createdAt: Date.now(),
          },
          localUri: photo.uri,
          saved: Boolean(saved),
        });
      } catch (error) {
        Alert.alert(
          'Teşhis yapılamadı',
          getErrorMessage(error, 'Fotoğraf incelenemedi. Tekrar deneyin.')
        );
      } finally {
        setAnalyzing(false);
      }
    },
    [navigation, selectedField, uid]
  );

  const openDiagnosis = useCallback(
    (diagnosis) => navigation.navigate('DiagnosisResult', { diagnosis, saved: true }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.historyRow}
        onPress={() => openDiagnosis(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.disease}, ${formatDateTime(item.createdAt)}`}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="leaf-outline" size={24} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.historyText}>
          <Text style={styles.historyDisease} numberOfLines={1}>
            {item.disease}
          </Text>
          <Text style={styles.historyMeta} numberOfLines={1}>
            Güven {formatPercent(item.confidence)} · {formatDateTime(item.createdAt)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
      </TouchableOpacity>
    ),
    [openDiagnosis]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  if (fieldsStatus === 'loading' && fields.length === 0) {
    return <Loading fullScreen message="Tarlalar yükleniyor..." />;
  }

  if (fields.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="camera-outline"
          title="Önce bir tarla ekleyin"
          description="Teşhisler tarlaya bağlı kaydedilir. Tarlalarım sekmesinden tarla ekledikten sonra buraya dönün."
          actionTitle="Tarla Ekle"
          onAction={() => navigation.navigate('FieldsTab', { screen: 'AddField', initial: false })}
        />
      </View>
    );
  }

  const header = (
    <View>
      {!isAiConfigured ? (
        <View style={styles.demoBanner}>
          <Ionicons name="flask-outline" size={22} color={colors.warning} />
          <Text style={styles.demoText}>
            Demo modu: yapay zekâ servisi ayarlanmadı. Fotoğraf gerçekten incelenmez, örnek sonuç gösterilir.
          </Text>
        </View>
      ) : null}

      <ChipSelect
        label="Hangi tarla?"
        options={fieldOptions}
        value={selectedFieldId}
        onChange={setSelectedFieldId}
      />

      <Text style={styles.help}>
        Hasta görünen yaprağı yakından, gölgesiz ve net olacak şekilde çekin.
      </Text>

      {analyzing ? (
        <Loading message="Fotoğraf inceleniyor..." />
      ) : (
        <View>
          <PrimaryButton
            title="Fotoğraf Çek"
            icon="camera-outline"
            onPress={() => handlePick(true)}
            style={styles.button}
          />
          <PrimaryButton
            title="Galeriden Seç"
            icon="images-outline"
            variant="outline"
            onPress={() => handlePick(false)}
            style={styles.button}
          />
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Geçmiş teşhisler{selectedField ? ` · ${selectedField.name}` : ''}
      </Text>
      {historyLoading && history.length === 0 ? <Loading message="Geçmiş yükleniyor..." /> : null}
      {historyError ? (
        <ErrorView message={historyError} onRetry={loadHistory} style={styles.error} />
      ) : null}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={fieldHistory}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={header}
      ListEmptyComponent={
        !historyLoading && !historyError ? (
          <Text style={styles.emptyText}>Bu tarla için kayıtlı teşhis yok.</Text>
        ) : null
      }
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  demoText: { flex: 1, marginLeft: spacing.sm, fontSize: font.sm, color: colors.text, lineHeight: 20 },
  help: { fontSize: font.md, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 22 },
  button: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  error: { marginHorizontal: 0 },
  emptyText: { fontSize: font.md, color: colors.textMuted },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.earthLight },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  historyText: { flex: 1, marginHorizontal: spacing.md },
  historyDisease: { fontSize: font.md, fontWeight: '700', color: colors.text },
  historyMeta: { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
});
