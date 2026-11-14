// Masraf ekleme: kalem, tutar, tarih ve not.
// "Fiş Tara" ile fiş fotoğrafından tutar ve kalem okunup form doldurulur;
// kullanıcı değerleri kontrol edip kaydeder.
// İnternet yoksa masraf telefonda bekletilir ve sonra gönderilir.

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import FormInput from '../../components/FormInput';
import ChipSelect from '../../components/ChipSelect';
import PrimaryButton from '../../components/PrimaryButton';
import EmptyState from '../../components/EmptyState';
import { addExpense, clearReceiptDraft } from '../../store/expensesSlice';
import { validateExpense } from '../../utils/validators';
import { isoToTR, parseNumber, todayISO, trToISO } from '../../utils/format';
import { EXPENSE_CATEGORIES } from '../../constants/expenseCategories';
import { colors, font, radius, spacing } from '../../constants/theme';
import { hapticSuccess } from '../../utils/motion';

export default function AddExpenseScreen({ route, navigation }) {
  const fieldId = route.params ? route.params.fieldId : null;
  const dispatch = useDispatch();
  const field = useSelector((state) => state.fields.items.find((f) => f.id === fieldId));
  const saving = useSelector((state) => state.expenses.saving);
  const receiptDraft = useSelector((state) => state.expenses.receiptDraft);

  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [dateText, setDateText] = useState(isoToTR(todayISO()));
  const [note, setNote] = useState('');
  const [source, setSource] = useState('elle');
  const [errors, setErrors] = useState({});
  const [filledFromReceipt, setFilledFromReceipt] = useState(false);

  // Fiş tarama ekranından dönen değerleri forma yerleştir.
  useEffect(() => {
    if (!receiptDraft) return;
    if (receiptDraft.category) setCategory(receiptDraft.category);
    if (receiptDraft.amount) setAmount(String(receiptDraft.amount).replace('.', ','));
    if (receiptDraft.date) setDateText(isoToTR(receiptDraft.date));
    if (receiptDraft.note) setNote(receiptDraft.note);
    setSource('fis');
    setFilledFromReceipt(true);
    setErrors({});
    dispatch(clearReceiptDraft());
  }, [receiptDraft, dispatch]);

  const handleSave = useCallback(async () => {
    const check = validateExpense({ category, amount, dateText, note });
    setErrors(check.errors);
    if (!check.valid || !field) return;

    try {
      const result = await dispatch(
        addExpense({
          fieldId: field.id,
          season: field.season,
          category,
          amount: Math.round(parseNumber(amount) * 100) / 100,
          date: trToISO(dateText),
          note: note.trim(),
          source,
        })
      ).unwrap();

      hapticSuccess();
      if (result.queued) {
        Alert.alert(
          'Telefona kaydedildi',
          'İnternet bağlantısı yok. Masraf telefonunuzda saklandı; bağlantı gelince kendiliğinden gönderilecek.'
        );
      }
      navigation.goBack();
    } catch (message) {
      Alert.alert('Masraf kaydedilemedi', String(message));
    }
  }, [dispatch, navigation, field, category, amount, dateText, note, source]);

  if (!field) {
    return (
      <View style={styles.flex}>
        <EmptyState
          icon="alert-circle-outline"
          title="Tarla bulunamadı"
          description="Masraf eklemek için önce bir tarla seçin."
          actionTitle="Geri Dön"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.fieldLine}>
          {field.name} · Sezon {field.season}
        </Text>

        <PrimaryButton
          title="Fiş Tara (otomatik doldur)"
          icon="scan-outline"
          variant="secondary"
          onPress={() => navigation.navigate('ReceiptScan')}
          style={styles.scanButton}
        />

        {filledFromReceipt ? (
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={22} color={colors.info} />
            <Text style={styles.noticeText}>
              Form fişten okunan değerlerle dolduruldu. Kaydetmeden önce tutarı ve kalemi kontrol edin.
            </Text>
          </View>
        ) : null}

        <ChipSelect
          label="Masraf kalemi"
          options={EXPENSE_CATEGORIES}
          value={category}
          onChange={setCategory}
          error={errors.category}
        />

        <FormInput
          label="Tutar"
          value={amount}
          onChangeText={setAmount}
          error={errors.amount}
          placeholder="Örnek: 4500"
          keyboardType="decimal-pad"
          suffix="TL"
        />

        <FormInput
          label="Tarih"
          value={dateText}
          onChangeText={setDateText}
          error={errors.dateText}
          placeholder="GG.AA.YYYY"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <View style={styles.dateButtons}>
          <PrimaryButton
            title="Bugün"
            variant="outline"
            onPress={() => setDateText(isoToTR(todayISO()))}
            style={styles.dateButton}
          />
          <PrimaryButton
            title="Dün"
            variant="outline"
            onPress={() => setDateText(isoToTR(todayISO(-1)))}
            style={[styles.dateButton, styles.dateButtonLast]}
          />
        </View>

        <FormInput
          label="Not (isteğe bağlı)"
          value={note}
          onChangeText={setNote}
          error={errors.note}
          placeholder="Örnek: 3 işçi, çapa"
          maxLength={200}
          multiline
        />

        <PrimaryButton
          title="Masrafı Kaydet"
          icon="checkmark-circle-outline"
          onPress={handleSave}
          loading={saving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  fieldLine: { fontSize: font.md, color: colors.textMuted, marginBottom: spacing.md, fontWeight: '600' },
  scanButton: { marginBottom: spacing.lg },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeText: { flex: 1, marginLeft: spacing.sm, fontSize: font.sm, color: colors.text, lineHeight: 20 },
  dateButtons: { flexDirection: 'row', marginTop: -spacing.sm, marginBottom: spacing.lg },
  dateButton: { flex: 1, minHeight: 44 },
  dateButtonLast: { marginLeft: spacing.md },
});
