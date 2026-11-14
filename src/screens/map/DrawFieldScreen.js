// Tarla sınırı çizme: haritada köşelere sırayla dokunulur, çokgen oluşur ve
// alan dönüm olarak anında hesaplanır (1 dönüm = 1.000 m²).
// Köşe iğneleri basılı tutulup sürüklenerek düzeltilebilir.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
import { useDispatch } from 'react-redux';
import PrimaryButton from '../../components/PrimaryButton';
import { setDraftPolygon } from '../../store/fieldsSlice';
import { polygonAreaDonum, polygonAreaM2, polygonCenter } from '../../utils/calculations';
import { formatDonum, formatNumber } from '../../utils/format';
import { getCurrentLocation, TURKEY_REGION } from '../../utils/device';
import { colors, font, radius, spacing } from '../../constants/theme';

const CLOSE_ZOOM = { latitudeDelta: 0.008, longitudeDelta: 0.008 };

export default function DrawFieldScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const params = route.params || {};
  const initialPolygon = Array.isArray(params.polygon) ? params.polygon : [];
  const initialCenter = params.center || (initialPolygon.length > 0 ? initialPolygon[0] : null);

  const [points, setPoints] = useState(initialPolygon);

  const initialRegion = useMemo(
    () => (initialCenter ? { ...initialCenter, ...CLOSE_ZOOM } : TURKEY_REGION),
    // Yalnızca ilk açılışta hesaplanır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Başlangıç konumu verilmediyse kullanıcının bulunduğu yere yaklaş.
  // İzin verilmezse sessizce geçilir; kullanıcı haritayı elle kaydırabilir.
  useEffect(() => {
    if (initialCenter) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const current = await getCurrentLocation();
        if (!cancelled && mapRef.current) {
          mapRef.current.animateToRegion({ ...current, ...CLOSE_ZOOM }, 600);
        }
      } catch (error) {
        // yok sayılır
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const areaDonum = useMemo(() => polygonAreaDonum(points), [points]);
  const areaM2 = useMemo(() => polygonAreaM2(points), [points]);

  const handleMapPress = useCallback((event) => {
    const { coordinate, action } = event.nativeEvent;
    // iOS'ta iğneye dokunmak harita dokunuşu olarak da gelir; yeni köşe eklemesin.
    if (!coordinate || action === 'marker-press') return;
    setPoints((previous) => [
      ...previous,
      { latitude: coordinate.latitude, longitude: coordinate.longitude },
    ]);
  }, []);

  const handleDragEnd = useCallback((index, event) => {
    const coordinate = event.nativeEvent.coordinate;
    if (!coordinate) return;
    setPoints((previous) =>
      previous.map((point, i) =>
        i === index ? { latitude: coordinate.latitude, longitude: coordinate.longitude } : point
      )
    );
  }, []);

  const handleUndo = useCallback(() => {
    setPoints((previous) => previous.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setPoints([]);
  }, []);

  const handleSave = useCallback(() => {
    if (points.length < 3) {
      Alert.alert('Sınır eksik', 'Alan hesaplanabilmesi için en az 3 köşe işaretleyin.');
      return;
    }
    dispatch(
      setDraftPolygon({
        polygon: points,
        area: areaDonum,
        center: polygonCenter(points),
      })
    );
    navigation.goBack();
  }, [dispatch, navigation, points, areaDonum]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType="hybrid"
        initialRegion={initialRegion}
        onPress={handleMapPress}
      >
        {points.length >= 3 ? (
          <Polygon
            coordinates={points}
            strokeColor={colors.white}
            strokeWidth={3}
            fillColor="rgba(46,125,50,0.4)"
          />
        ) : null}
        {points.length === 2 ? (
          <Polyline coordinates={points} strokeColor={colors.white} strokeWidth={3} />
        ) : null}
        {points.map((point, index) => (
          <Marker
            key={`${index}-${point.latitude}-${point.longitude}`}
            coordinate={point}
            draggable
            pinColor="green"
            onDragEnd={(event) => handleDragEnd(index, event)}
            stopPropagation
          />
        ))}
      </MapView>

      <View style={styles.panel}>
        <Text style={styles.areaLabel}>Hesaplanan alan</Text>
        <Text style={styles.areaValue}>
          {points.length >= 3 ? formatDonum(areaDonum) : '-'}
        </Text>
        <Text style={styles.hint}>
          {points.length >= 3
            ? `${formatNumber(areaM2, 0)} m² · ${points.length} köşe`
            : 'Tarlanın köşelerine sırayla dokunun (en az 3 köşe).'}
        </Text>

        <View style={styles.row}>
          <PrimaryButton
            title="Geri Al"
            icon="arrow-undo-outline"
            variant="outline"
            onPress={handleUndo}
            disabled={points.length === 0}
            style={styles.rowButton}
          />
          <PrimaryButton
            title="Temizle"
            icon="trash-outline"
            variant="outline"
            onPress={handleClear}
            disabled={points.length === 0}
            style={[styles.rowButton, styles.rowButtonLast]}
          />
        </View>
        <PrimaryButton
          title="Sınırı Kaydet"
          icon="checkmark-circle-outline"
          onPress={handleSave}
          disabled={points.length < 3}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  areaLabel: { fontSize: font.sm, color: colors.textMuted, fontWeight: '600' },
  areaValue: { fontSize: font.xxl, fontWeight: '800', color: colors.primaryDark },
  hint: { fontSize: font.sm, color: colors.textMuted, marginBottom: spacing.md },
  row: { flexDirection: 'row', marginBottom: spacing.md },
  rowButton: { flex: 1 },
  rowButtonLast: { marginLeft: spacing.md },
});
