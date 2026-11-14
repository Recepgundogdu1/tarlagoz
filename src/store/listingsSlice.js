// Pazar: satılık tarla ilanları ve filtreler.

import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import * as listingService from '../services/listingService';
import { isOnline, withTimeout } from '../services/offlineQueue';
import { parseNumber } from '../utils/format';
import { getErrorMessage, OFFLINE_MESSAGE } from '../utils/errors';

export const fetchListings = createAsyncThunk(
  'listings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      if (!(await isOnline())) return rejectWithValue(OFFLINE_MESSAGE);
      return await withTimeout(listingService.fetchListings(), 15000);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'İlanlar yüklenemedi.'));
    }
  }
);

export const createListing = createAsyncThunk(
  'listings/create',
  async ({ data, photoUris }, { getState, rejectWithValue }) => {
    const user = getState().auth.user;
    if (!user) return rejectWithValue('Oturum bulunamadı.');
    try {
      if (!(await isOnline())) return rejectWithValue(OFFLINE_MESSAGE);
      // Fotoğraf yükleme uzun sürebilir; süre sınırı geniş tutuldu.
      return await withTimeout(
        listingService.createListing(user.uid, { ...data, ownerName: user.name }, photoUris),
        120000
      );
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'İlan yayınlanamadı.'));
    }
  }
);

export const deleteListing = createAsyncThunk(
  'listings/delete',
  async (listing, { rejectWithValue }) => {
    try {
      if (!(await isOnline())) return rejectWithValue(OFFLINE_MESSAGE);
      await withTimeout(listingService.deleteListing(listing), 20000);
      return listing.id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'İlan silinemedi.'));
    }
  }
);

const emptyFilters = { city: '', maxPrice: '', minArea: '' };

const initialState = {
  items: [],
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  saving: false,
  filters: emptyFilters,
};

const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = emptyFilters;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchListings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchListings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchListings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'İlanlar yüklenemedi.';
      })
      .addCase(createListing.pending, (state) => {
        state.saving = true;
      })
      .addCase(createListing.fulfilled, (state, action) => {
        state.saving = false;
        state.items.unshift(action.payload);
      })
      .addCase(createListing.rejected, (state) => {
        state.saving = false;
      })
      .addCase(deleteListing.fulfilled, (state, action) => {
        state.items = state.items.filter((l) => l.id !== action.payload);
      })
      .addCase('auth/logout/fulfilled', () => initialState);
  },
});

export const { setFilters, clearFilters } = listingsSlice.actions;

const selectItems = (state) => state.listings.items;
const selectFilters = (state) => state.listings.filters;

// Filtrelenmiş ilan listesi. createSelector sonucu belleğe alır: ilanlar veya
// filtreler değişmedikçe aynı dizi döner ve liste gereksiz yere yeniden çizilmez.
export const selectFilteredListings = createSelector(
  [selectItems, selectFilters],
  (items, filters) => {
    const maxPrice = parseNumber(filters.maxPrice);
    const minArea = parseNumber(filters.minArea);
    return items.filter((listing) => {
      if (filters.city && listing.city !== filters.city) return false;
      if (Number.isFinite(maxPrice) && maxPrice > 0 && listing.price > maxPrice) return false;
      if (Number.isFinite(minArea) && minArea > 0 && listing.area < minArea) return false;
      return true;
    });
  }
);

export default listingsSlice.reducer;
