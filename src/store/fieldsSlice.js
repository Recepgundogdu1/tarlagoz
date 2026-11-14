// Tarlalar: listeleme, ekleme, güncelleme, silme ve sezon kapatma.

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as fieldService from '../services/fieldService';
import { isOnline, loadCache, saveCache, withTimeout } from '../services/offlineQueue';
import { getCrop } from '../constants/crops';
import { buildSeasonSummary } from '../utils/calculations';
import { getErrorMessage, OFFLINE_MESSAGE } from '../utils/errors';

const CACHE_NAME = 'fields';

function currentUid(getState) {
  const user = getState().auth.user;
  return user ? user.uid : null;
}

// Tarlaları getirir. İnternet yoksa veya istek başarısız olursa telefondaki
// son kopyayı gösterir (fromCache: true).
export const fetchFields = createAsyncThunk(
  'fields/fetch',
  async (_, { getState, rejectWithValue }) => {
    const uid = currentUid(getState);
    if (!uid) return rejectWithValue('Oturum bulunamadı.');
    try {
      const online = await isOnline();
      if (!online) throw new Error('offline');
      const items = await withTimeout(fieldService.fetchFields(uid), 15000);
      await saveCache(CACHE_NAME, uid, items);
      return { items, fromCache: false };
    } catch (error) {
      const cached = await loadCache(CACHE_NAME, uid);
      if (cached) return { items: cached, fromCache: true };
      return rejectWithValue(
        error && error.message === 'offline'
          ? OFFLINE_MESSAGE
          : getErrorMessage(error, 'Tarlalar yüklenemedi.')
      );
    }
  }
);

export const addField = createAsyncThunk(
  'fields/add',
  async (data, { getState, rejectWithValue }) => {
    const uid = currentUid(getState);
    if (!uid) return rejectWithValue('Oturum bulunamadı.');
    try {
      if (!(await isOnline())) return rejectWithValue(OFFLINE_MESSAGE);
      return await withTimeout(fieldService.createField(uid, data), 15000);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Tarla kaydedilemedi.'));
    }
  }
);

export const updateField = createAsyncThunk(
  'fields/update',
  async ({ id, patch }, { rejectWithValue }) => {
    try {
      if (!(await isOnline())) return rejectWithValue(OFFLINE_MESSAGE);
      return await withTimeout(fieldService.updateField(id, patch), 15000);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Tarla güncellenemedi.'));
    }
  }
);

export const deleteField = createAsyncThunk(
  'fields/delete',
  async (fieldId, { getState, rejectWithValue }) => {
    const uid = currentUid(getState);
    if (!uid) return rejectWithValue('Oturum bulunamadı.');
    try {
      if (!(await isOnline())) return rejectWithValue(OFFLINE_MESSAGE);
      await withTimeout(fieldService.deleteFieldCascade(uid, fieldId), 20000);
      return fieldId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Tarla silinemedi.'));
    }
  }
);

// Sezonu kapatır: gerçek hasat ve satış fiyatıyla sezon özetini tarlanın
// geçmişine (pastSeasons) ekler ve tarlayı yeni sezona hazırlar.
// Bu geçmiş, Tarla Karnesi'nin "gerçekleşen" satırlarını oluşturur.
export const closeSeason = createAsyncThunk(
  'fields/closeSeason',
  async ({ fieldId, harvestKg, salePrice, nextSeason, nextCrop }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const field = state.fields.items.find((f) => f.id === fieldId);
      if (!field) return rejectWithValue('Tarla bulunamadı.');
      if (!(await isOnline())) return rejectWithValue(OFFLINE_MESSAGE);

      const summary = buildSeasonSummary(field, state.expenses.items, { harvestKg, salePrice });
      const crop = getCrop(nextCrop);
      const patch = {
        pastSeasons: [...(field.pastSeasons || []), summary],
        season: String(nextSeason).trim(),
        crop: nextCrop,
        expectedYield: crop.yieldPerDonum,
        expectedPrice: crop.pricePerKg,
      };
      return await withTimeout(fieldService.updateField(fieldId, patch), 15000);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Sezon kapatılamadı.'));
    }
  }
);

const initialState = {
  items: [],
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  saving: false,
  fromCache: false,
  // Haritada çizilen sınır, tarla ekleme formuna buradan taşınır.
  draftPolygon: null, // { polygon, area, center }
};

function applyPatch(state, payload) {
  const index = state.items.findIndex((f) => f.id === payload.id);
  if (index !== -1) state.items[index] = { ...state.items[index], ...payload };
}

const fieldsSlice = createSlice({
  name: 'fields',
  initialState,
  reducers: {
    setDraftPolygon(state, action) {
      state.draftPolygon = action.payload;
    },
    clearDraftPolygon(state) {
      state.draftPolygon = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFields.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFields.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.fromCache = action.payload.fromCache;
      })
      .addCase(fetchFields.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Tarlalar yüklenemedi.';
      })
      .addCase(addField.pending, (state) => {
        state.saving = true;
      })
      .addCase(addField.fulfilled, (state, action) => {
        state.saving = false;
        state.items.unshift(action.payload);
        state.status = 'succeeded';
      })
      .addCase(addField.rejected, (state) => {
        state.saving = false;
      })
      .addCase(updateField.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateField.fulfilled, (state, action) => {
        state.saving = false;
        applyPatch(state, action.payload);
      })
      .addCase(updateField.rejected, (state) => {
        state.saving = false;
      })
      .addCase(closeSeason.pending, (state) => {
        state.saving = true;
      })
      .addCase(closeSeason.fulfilled, (state, action) => {
        state.saving = false;
        applyPatch(state, action.payload);
      })
      .addCase(closeSeason.rejected, (state) => {
        state.saving = false;
      })
      .addCase(deleteField.pending, (state) => {
        state.saving = true;
      })
      .addCase(deleteField.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.filter((f) => f.id !== action.payload);
      })
      .addCase(deleteField.rejected, (state) => {
        state.saving = false;
      })
      // Çıkış yapılınca önceki kullanıcının verisi bellekte kalmasın.
      .addCase('auth/logout/fulfilled', () => initialState);
  },
});

export const { setDraftPolygon, clearDraftPolygon } = fieldsSlice.actions;
export default fieldsSlice.reducer;
