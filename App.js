// Uygulamanın giriş noktası.
//  - Redux store'u ve güvenli alan (çentik, alt çubuk) sağlayıcısını kurar.
//  - .env doldurulmamışsa çökmek yerine kurulum açıklaması gösterir.
//  - Beklenmeyen bir çizim hatasında beyaz ekran yerine hata mesajı gösterir.

import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import store from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorView from './src/components/ErrorView';
import { isFirebaseConfigured } from './src/firebase/config';
import { colors, font, spacing } from './src/constants/theme';

// Hata sınırı (error boundary): alt bileşenlerden birinde çizim hatası olursa
// yakalar. React'te bu özellik yalnızca sınıf bileşeniyle yazılabilir.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleRetry() {
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.center}>
          <ErrorView
            message="Beklenmeyen bir hata oluştu. Tekrar deneyin; sorun sürerse uygulamayı kapatıp açın."
            onRetry={this.handleRetry}
          />
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

function SetupRequired() {
  return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.setupTitle}>Kurulum eksik</Text>
      <Text style={styles.setupText}>
        Firebase ayarları bulunamadı. Proje klasöründeki .env.example dosyasını .env adıyla
        kopyalayın, Firebase bilgilerinizi yazın ve uygulamayı şu komutla yeniden başlatın:
      </Text>
      <Text style={styles.setupCode}>npx expo start -c</Text>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.primaryDark} />
      {isFirebaseConfigured ? (
        <Provider store={store}>
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
        </Provider>
      ) : (
        <SetupRequired />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  setupTitle: { fontSize: font.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  setupText: { fontSize: font.md, color: colors.text, lineHeight: 24 },
  setupCode: {
    marginTop: spacing.lg,
    fontSize: font.lg,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 8,
  },
});
