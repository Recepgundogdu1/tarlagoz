// Giriş ekranı: e-posta ve şifre ile oturum açma, şifre sıfırlama.

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import Logo3D from '../../components/motion/Logo3D';
import FadeInView from '../../components/motion/FadeInView';
import { FloatView } from '../../components/motion/Attention';
import { clearAuthError, loginUser, sendPasswordReset } from '../../store/authSlice';
import { isValidEmail, validateLogin } from '../../utils/validators';
import { card, colors, font, radius, shadows, spacing, weight } from '../../constants/theme';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.auth.loading);
  const serverError = useSelector((state) => state.auth.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  // Ekrana her gelişte önceki hata mesajını temizle.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => dispatch(clearAuthError()));
    return unsubscribe;
  }, [navigation, dispatch]);

  const handleLogin = useCallback(() => {
    const check = validateLogin({ email, password });
    setErrors(check.errors);
    if (!check.valid) return;
    // Başarılı girişte RootNavigator ekranı kendiliğinden değiştirir;
    // hata olursa mesaj state.auth.error üzerinden gösterilir.
    dispatch(loginUser({ email, password }));
  }, [dispatch, email, password]);

  const handleForgotPassword = useCallback(async () => {
    if (!isValidEmail(email)) {
      setErrors({ email: 'Şifre sıfırlamak için önce e-posta adresinizi yazın.' });
      return;
    }
    try {
      await dispatch(sendPasswordReset(email)).unwrap();
      Alert.alert('E-posta gönderildi', 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    } catch (message) {
      Alert.alert('Gönderilemedi', String(message));
    }
  }, [dispatch, email]);

  return (
    <View style={styles.root}>
      {/* Üst kahraman alanı: koyu yeşil zemin, logo ve slogan */}
      <View style={styles.hero}>
        <SafeAreaView edges={['top']}>
          <View style={styles.logoBlock}>
            <Logo3D size={80} />
            <FadeInView delay={200}>
              <Text style={styles.appName}>TarlaGöz</Text>
            </FadeInView>
            <FadeInView delay={350}>
              <Text style={styles.tagline}>Tarlanın cebindeki muhasebecisi</Text>
            </FadeInView>
          </View>
        </SafeAreaView>
        {/* Dekoratif daireler */}
        <FloatView style={[styles.blob, styles.blobOne]} distance={14} duration={4200} />
        <FloatView style={[styles.blob, styles.blobTwo]} distance={-10} duration={5200} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FadeInView delay={300} distance={32} style={styles.formCard}>
            <Text style={styles.formTitle}>Hoş geldiniz</Text>
            <Text style={styles.formSub}>Devam etmek için hesabınıza giriş yapın.</Text>

            <FormInput
              label="E-posta"
              icon="mail-outline"
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
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              placeholder="Şifreniz"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />

            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgot}
              accessibilityRole="button"
            >
              <Text style={styles.linkText}>Şifremi unuttum</Text>
            </TouchableOpacity>

            {serverError ? (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Ionicons name="alert-circle" size={20} color={colors.danger} />
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            ) : null}

            <PrimaryButton title="Giriş Yap" icon="log-in-outline" onPress={handleLogin} loading={loading} />
          </FadeInView>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Hesabınız yok mu?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.registerLink}> Kayıt olun</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  hero: {
    backgroundColor: colors.primaryDeep,
    paddingBottom: 72,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' },
  blobOne: { width: 220, height: 220, top: -80, right: -60 },
  blobTwo: { width: 140, height: 140, bottom: -50, left: -40 },
  logoBlock: { alignItems: 'center', paddingTop: spacing.md },
  appName: {
    fontSize: font.display,
    fontWeight: weight.heavy,
    color: colors.white,
    letterSpacing: -0.5,
  },
  tagline: { fontSize: font.md, color: colors.textOnDarkMuted, marginTop: spacing.xs },
  content: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  formCard: { ...card, marginTop: -48, padding: spacing.xl, ...shadows.md },
  formTitle: { fontSize: font.xl, fontWeight: weight.heavy, color: colors.text },
  formSub: { fontSize: font.sm, color: colors.textMuted, marginTop: 4, marginBottom: spacing.lg },
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.sm, marginBottom: spacing.lg, padding: spacing.xs },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: { flex: 1, marginLeft: spacing.sm, color: colors.danger, fontSize: font.sm, fontWeight: '600' },
  linkText: { color: colors.primary, fontSize: font.sm, fontWeight: weight.bold },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  registerText: { fontSize: font.md, color: colors.textMuted },
  registerLink: { fontSize: font.md, color: colors.primary, fontWeight: weight.heavy },
});
