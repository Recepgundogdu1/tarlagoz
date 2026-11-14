// Hava tahmini: tarla bazında saklanır. Don bekleniyorsa yerel bildirim gönderilir.

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchForecast } from '../services/weatherService';
import { sendFrostAlert } from '../services/notificationService';
import { getErrorMessage } from '../utils/errors';

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // aynı tarla için 30 dakikada bir yenile

export const fetchWeatherForField = createAsyncThunk(
  'weather/fetchForField',
  async (field, { rejectWithValue }) => {
    try {
      const { latitude, longitude } = field.location;
      const forecast = await fetchForecast(latitude, longitude);
      if (forecast.frostDays.length > 0) {
        // Bildirim gönderilemese de hava verisi gösterilmeli; sonucu beklemiyoruz.
        sendFrostAlert({ id: field.id, name: field.name }, forecast.frostDays);
      }
      return { fieldId: field.id, ...forecast, fetchedAt: Date.now() };
    } catch (error) {
      return rejectWithValue({
        fieldId: field.id,
        message: getErrorMessage(error, 'Hava tahmini alınamadı.'),
      });
    }
  },
  {
    // Konumu olmayan tarla için ya da veri tazeyse istek atılmaz.
    condition: (field, { getState }) => {
      if (!field || !field.location) return false;
      const entry = getState().weather.byField[field.id];
      if (!entry) return true;
      if (entry.loading) return false;
      if (entry.fetchedAt && Date.now() - entry.fetchedAt < REFRESH_INTERVAL_MS) return false;
      return true;
    },
  }
);

const initialState = {
  // { [fieldId]: { days, frostDays, fetchedAt, loading, error } }
  byField: {},
};

const weatherSlice = createSlice({
  name: 'weather',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWeatherForField.pending, (state, action) => {
        const fieldId = action.meta.arg.id;
        state.byField[fieldId] = {
          ...(state.byField[fieldId] || { days: [], frostDays: [] }),
          loading: true,
          error: null,
        };
      })
      .addCase(fetchWeatherForField.fulfilled, (state, action) => {
        const { fieldId, days, frostDays, fetchedAt } = action.payload;
        state.byField[fieldId] = { days, frostDays, fetchedAt, loading: false, error: null };
      })
      .addCase(fetchWeatherForField.rejected, (state, action) => {
        // condition false döndüğünde de "rejected" tetiklenir; o durumda payload yoktur.
        if (!action.payload) return;
        const { fieldId, message } = action.payload;
        state.byField[fieldId] = {
          ...(state.byField[fieldId] || { days: [], frostDays: [] }),
          loading: false,
          error: message,
        };
      })
      .addCase('auth/logout/fulfilled', () => initialState);
  },
});

export default weatherSlice.reducer;
