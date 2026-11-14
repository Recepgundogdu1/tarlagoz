// Harita: kullanıcının tüm tarlaları uydu görüntüsü üzerinde.
// Sınırı çizilmiş tarlalar çokgen, diğerleri iğne olarak gösterilir.
// Bir tarlaya dokununca altta özet kartı açılır.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import PrimaryButton from '../../components/PrimaryButton';
import { fetchFields } from '../../store/fieldsSlice';
import { getCurrentLocation, TURKEY_REGION } from '../../utils/device';
import { getErrorMessage } from '../../utils/errors';
import { formatDonum } from '../../utils/format';
import { getCrop } from '../../constants/crops';
import { colors, font, radius, shadow, spacing } from '../../constants/theme';

export default function MapScreen({ navigation }) {
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const fields = useSelector((state) => state.fields.items);
  const status = useSelector((state) => state.fields.status);
  const [selectedId, setSelectedId] = useState(null);
  const [locating, setLocating] = useState(false);
  // Bir tarlaya dokunulduğu an. Bazı cihazlarda aynı dokunuş haritaya da
  // iletilir; hemen ardından gelen harita dokunuşu seçimi kaldırmasın diye tutulur.
  const lastShapePress = useRef(0);

  const selectField = useCallback((id) => {
    lastShapePress.current = Date.now();
    setSelectedId(id);
  }, []);

  const handleMapPress = useCallback((event) => {
    const action = event.nativeEvent ? event.nativeEvent.action : null;
    if (action === 'marker-press' || action === 'polygon-press') return;
    if (Date.now() - lastShapePress.current < 400) return;
    setSelectedId(null);
  }, []);

  // Kullanıcı uygulamayı doğrudan bu sekmeden açtıysa tarlalar henüz yüklenmemiş olabilir.
  useEffect(() => {
    if (status === 'idle') dispatch(fetchFields());
  }, [dispatch, status]);

  // Haritada gösterilebilecek (konumu veya sınırı olan) tarlalar.
  const mappable = useMemo(
    () =>
      fields.filter(
        (f) => f.location || (Array.isArray(f.polygon) && f.polygon.length >= 3)
      ),
    [fields]
  );

  // Tüm tarlaları ekrana sığdıracak koordinat listesi.
  const allCoordinates = useMemo(() => {
    const list = [];
    mappable.forEach((f) => {
      if (Array.isArray(f.polygon) && f.polygon.length >= 3) list.push(...f.polygon);
      else if (f.location) list.push(f.location);
    });
    return list;
  }, [mappable]);

  const fitToFields = useCallback(() => {
    if (!mapRef.current || allCoordinates.length === 0) return;
    if (allCoordinates.length === 1) {
      mapRef.current.animateToRegion(
        { ...allCoordinates[0], latitudeDelta: 0.02, longitudeDelta: 0.02 },
        600
      );
      return;
    }
    mapRef.current.fitToCoordinates(allCoordinates, {
      edgePadding: { top: 80, right: 60, bottom: 220, left: 60 },
      animated: true,
    });
  }, [allCoordinates]);

  useEffect(() => {
    // Harita hazır olduktan kısa süre sonra tarlalara yaklaş.
    const timer = setTimeout(fitToFields, 700);
    return () => clearTimeout(timer);
  }, [fitToFields]);

  const handleMyLocation = useCallback(async () => {
    setLocating(true);
    try {
      const current = await getCurrentLocation();
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          { ...current, latitudeDelta: 0.02, longitudeDelta: 0.02 },
          600
        );
      }
    } catch (error) {
      Alert.alert('Konum alınamadı', getErrorMessage(error, 'Konum alınamadı.'));
    } finally {
      setLocating(false);
    }
  }, []);

  const selected = useMemo(
    () => fields.find((f) => f.id === selectedId) || null,
    [fields, selectedId]
  );

  const openField = useCallback(() => {
    if (!selected) return;
    navigation.navigate('FieldsTab', {
      screen: 'FieldDetail',
      params: { fieldId: selected.id },
      initial: false,
    });
  }, [navigation, selected]);

  const addField = useCallback(() => {
    navigation.navigate('FieldsTab', { screen: 'AddField', initial: false });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType="hybrid"
        initialRegion={TURKEY_REGION}
        showsUserLocation={false}
        onPress={handleMapPress}
      >
        {mappable.map((field) => {
          const hasPolygon = Array.isArray(field.polygon) && field.polygon.length >= 3;
          const isSelected = field.id === selectedId;
          const markerPosition = field.location || field.polygon[0];
          return (
            <React.Fragment key={field.id}>
              {hasPolygon ? (
                <Polygon
                  coordinates={field.polygon}
                  strokeColor={isSelected ? colors.warning : colors.white}
                  strokeWidth={isSelected ? 4 : 2}
                  fillColor="rgba(46,125,50,0.35)"
                  tappable
                  onPress={() => selectField(field.id)}
                />
              ) : null}
              <Marker
                coordinate={markerPosition}
                pinColor={isSelected ? 'orange' : 'green'}
                stopPropagation
                onPress={() => selectField(field.id)}
              />
            </React.Fragment>
          );
        })}
      </MapView>

      <View style={styles.floatingButtons}>
        <TouchableOpacity
          style={styles.roundButton}
          onPress={handleMyLocation}
          disabled={locating}
          accessibilityRole="button"
          accessibilityLabel="Konumuma git"
        >
          <Ionicons name="locate" size={26} color={colors.primaryDark} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.roundButton}
          onPress={fitToFields}
          accessibilityRole="button"
          accessibilityLabel="Tüm tarlaları göster"
        >
          <Ionicons name="scan-outline" size={26} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPanel}>
        {selected ? (
          <View>
            <Text style={styles.selectedName}>{selected.name}</Text>
            <Text style={styles.selectedSub}>
              {getCrop(selected.crop).label} · {formatDonum(selected.area)} · Sezon {selected.season}
            </Text>
            <PrimaryButton
              title="Tarla Detayını Aç"
              icon="open-outline"
              onPress={openField}
              style={styles.panelButton}
            />
          </View>
        ) : (
          <View>
            <Text style={styles.hint}>
              {mappable.length > 0
                ? 'Ayrıntı için haritada bir tarlaya dokunun.'
                : 'Haritada gösterilecek tarla yok. Tarla eklerken konum verin veya sınırını çizin.'}
            </Text>
            <PrimaryButton
              title="Yeni Tarla Ekle"
              icon="add-circle-outline"
              onPress={addField}
              style={styles.panelButton}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  floatingButtons: { position: 'absolute', top: spacing.lg, right: spacing.lg },
  roundButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadow,
  },
  bottomPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  selectedName: { fontSize: font.xl, fontWeight: '800', color: colors.text },
  selectedSub: { fontSize: font.md, color: colors.textMuted, marginTop: 2 },
  hint: { fontSize: font.md, color: colors.textMuted, lineHeight: 22 },
  panelButton: { marginTop: spacing.md },
});
