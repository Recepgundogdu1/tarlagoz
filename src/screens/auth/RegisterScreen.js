// Kayıt ekranı: ad, e-posta ve şifre ile yeni hesap açma.

import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { clearAuthError, registerUser } from '../../store/authSlice';
import { validateRegister } from '../../utils/validators';
import { colors, font, radius, spacing } from '../../constants/theme';

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.auth.loading);
  const serverError = useSelector((state) => state.auth.error);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => dispatch(clearAuthError()));
    return unsubscribe;
  }, [navigation, dispatch]);

  const handleRegister = useCallback(() => {
    const check = validateRegister({ name, email, password, passwordAgain });
    setErrors(check.errors);
    if (!check.valid) return;
    // Kayıt başarılı olunca kullanıcı otomatik olarak içeri alınır.
    dispatch(registerUser({ name, email, password }));
  }, [dispatch, name, email, password, passwordAgain]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Hesabınızı oluşturun; tarlalarınız ve masraflarınız bu hesapta saklanır.
        </Text>

        <FormInput
          label="Ad Soyad"
          value={name}
          onChangeText={setName}
          error={errors.name}
          placeholder="Adınız ve soyadınız"
          autoCapitalize="words"
          autoComplete="name"
        />
        <FormInput
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          placeholder="ornek@eposta.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
        />
        <FormInput
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          placeholder="En az 6 karakter"
          secureTextEntry
          autoCapitalize="none"
        />
        <FormInput
          label="Şifre (tekrar)"
          value={passwordAgain}
          onChangeText={setPasswordAgain}
          error={errors.passwordAgain}
          placeholder="Şifrenizi tekrar yazın"
          secureTextEntry
          autoCapitalize="none"
        />

        {serverError ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Text style={styles.errorText}>{serverError}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title="Kayıt Ol"
          icon="person-add-outline"
          onPress={handleRegister}
          loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  intro: { fontSize: font.md, color: colors.textMuted, marginBottom: spacing.xl, lineHeight: 22 },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: { color: colors.danger, fontSize: font.md, fontWeight: '600' },
});
