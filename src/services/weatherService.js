// Hava tahmini: Open-Meteo (API anahtarı gerektirmez).
// https://open-meteo.com/en/docs

import axios from 'axios';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
export const FROST_THRESHOLD_C = 0; // minimum sıcaklık bunun altındaysa don uyarısı

// WMO hava kodu -> Türkçe açıklama ve simge (Ionicons adı).
export function describeWeather(code) {
  if (code === 0) return { label: 'Açık', icon: 'sunny-outline' };
  if (code === 1 || code === 2) return { label: 'Parçalı bulutlu', icon: 'partly-sunny-outline' };
  if (code === 3) return { label: 'Bulutlu', icon: 'cloud-outline' };
  if (code === 45 || code === 48) return { label: 'Sisli', icon: 'cloudy-outline' };
  if (code >= 51 && code <= 57) return { label: 'Çisenti', icon: 'rainy-outline' };
  if (code >= 61 && code <= 67) return { label: 'Yağmurlu', icon: 'rainy-outline' };
  if (code >= 71 && code <= 77) return { label: 'Karlı', icon: 'snow-outline' };
  if (code >= 80 && code <= 82) return { label: 'Sağanak', icon: 'rainy-outline' };
  if (code === 85 || code === 86) return { label: 'Kar sağanağı', icon: 'snow-outline' };
  if (code >= 95) return { label: 'Fırtına', icon: 'thunderstorm-outline' };
  return { label: 'Bilinmiyor', icon: 'cloud-outline' };
}

// Verilen koordinat için 7 günlük tahmin.
// Dönüş: { days: [{ date, tMax, tMin, precipitation, wind, code }], frostDays: [...] }
export async function fetchForecast(latitude, longitude) {
  const response = await axios.get(BASE_URL, {
    timeout: 10000,
    params: {
      latitude,
      longitude,
      daily:
        'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code',
      timezone: 'auto',
      forecast_days: 7,
    },
  });

  const daily = response.data && response.data.daily;
  if (!daily || !Array.isArray(daily.time)) {
    throw new Error('Hava verisi beklenen biçimde gelmedi.');
  }

  const days = daily.time.map((date, i) => ({
    date,
    tMax: daily.temperature_2m_max ? daily.temperature_2m_max[i] : null,
    tMin: daily.temperature_2m_min ? daily.temperature_2m_min[i] : null,
    precipitation: daily.precipitation_sum ? daily.precipitation_sum[i] : null,
    wind: daily.wind_speed_10m_max ? daily.wind_speed_10m_max[i] : null,
    code: daily.weather_code ? daily.weather_code[i] : null,
  }));

  const frostDays = days.filter(
    (d) => typeof d.tMin === 'number' && d.tMin < FROST_THRESHOLD_C
  );

  return { days, frostDays };
}
