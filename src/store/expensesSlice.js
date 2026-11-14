// Masraflar: listeleme, ekleme (çevrimdışı kuyruk destekli), silme, eşitleme.

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as expenseService from '../services/expenseService';
import {
  enqueueExpense,
  getQueueForUser,
  isOnline,
  loadCache,
  removeFromQueue,
  saveCache,
  withTimeout,
} from '../services/offlineQueue';
import { getErrorMessage } from '../utils/errors';

const CACHE_NAME = 'expenses';

function currentUid(getState) {
  const user = getState().auth.user;
  return user ? user.uid : null;
}

// Sunucudaki liste ile telefonda bekleyen masrafları birleştirir.
// Bekleyenler "pending: true" ile işaretlenir ve listede "gönderilecek" olarak görünür.
function mergeWithQueue(serverItems, queueItems) {
  const serverIds = new Set(serverItems.map((e) => e.id));
  const pending = queueItems
    .filter((e) => !serverIds.has(e.id))
    .map((e) => ({ ...e, pending: true }));
  return [...pending, ...serverItems].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export const fetchExpenses = createAsyncThunk(
  'expenses/fetch',
  async (_, { getState, rejectWithValue }) => {
    const uid = currentUid(getState);
    if (!uid) return rejectWithValue('Oturum bulunamadı.');
    const queue = await getQueueForUser(uid);
    try {
      const online = await isOnline();
      if (!online) throw new Error('offline');
      const items = await withTimeout(expenseService.fetchExpenses(uid), 15000);
      await saveCache(CACHE_NAME, uid, items);
      return { items: mergeWithQueue(items, queue), fromCache: false };
    } catch (error) {
      // İnternet yoksa: son indirilen kopya + bekleyen masraflar.
      const cached = (await loadCache(CACHE_NAME, uid)) || [];
      return { items: mergeWithQueue(cached, queue), fromCache: true };
    }
  }
);

// Masraf ekler. İnternet varsa Firestore'a yazar; yoksa veya yazma başarısız
// olursa masrafı telefondaki kuyruğa alır. Kullanıcının girdiği veri hiçbir
// durumda kaybolmaz.
// Dönüş: { expense, queued } — queued true ise masraf daha sonra gönderilecek.
export const addExpense = createAsyncThunk(
  'expenses/add',
  async (form, { getState, rejectWithValue }) => {
    const uid = currentUid(getState);
    if (!uid) return rejectWithValue('Oturum bulunamadı.');

    const expense = {
      id: expenseService.newExpenseId(),
      ownerId: uid,
      fieldId: form.fieldId,
      season: String(form.season),
      category: form.category,
      amount: form.amount,
      date: form.date,
      note: form.note || '',
      source: form.source || 'elle', // elle | fis
      createdAt: Date.now(),
    };

    try {
      const online = await isOnline();
      if (online) {
        try {
          await withTimeout(expenseService.saveExpense(expense), 10000);
          return { expense, queued: false };
        } catch (error) {
          // Yazma başarısız: aşağıda kuyruğa alınır.
        }
      }
      await enqueueExpense(expense);
      return { expense: { ...expense, pending: true }, queued: true };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Masraf kaydedilemedi.'));
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/delete',
  async (expense, { rejectWithValue }) => {
    try {
      if (expense.pending) {
        // Henüz sunucuya gitmemiş; yalnızca kuyruktan çıkarmak yeterli.
        await removeFromQueue([expense.id]);
        return expense.id;
      }
      if (!(await isOnline())) {
        return rejectWithValue('İnternet yokken kayıtlı masraf silinemez. Bağlantı gelince tekrar deneyin.');
      }
      await withTimeout(expenseService.deleteExpense(expense.id), 10000);
      return expense.id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Masraf silinemedi.'));
    }
  }
);

// Kuyrukta bekleyen masrafları Firestore'a gönderir. Uygulama açıldığında,
// öne geldiğinde ve belirli aralıklarla çağrılır (bkz. RootNavigator).
// Dönüş: { syncedIds, remaining }
export const syncOfflineExpenses = createAsyncThunk(
  'expenses/sync',
  async (_, { getState }) => {
    const uid = currentUid(getState);
    if (!uid) return { syncedIds: [], remaining: 0 };

    const queue = await getQueueForUser(uid);
    if (queue.length === 0) return { syncedIds: [], remaining: 0 };
    if (!(await isOnline())) return { syncedIds: [], remaining: queue.length };

    const syncedIds = [];
    for (let i = 0; i < queue.length; i += 1) {
      try {
        await withTimeout(expenseService.saveExpense(queue[i]), 10000);
        syncedIds.push(queue[i].id);
      } catch (error) {
        // Bu kayıt bir sonraki denemede tekrar gönderilecek.
      }
    }
    if (syncedIds.length > 0) await removeFromQueue(syncedIds);
    return { syncedIds, remaining: queue.length - syncedIds.length };
  },
  {
    // Aynı anda iki eşitleme çalışmasın.
    condition: (_, { getState }) => !getState().expenses.syncing,
  }
);

const initialState = {
  items: [],
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  saving: false,
  syncing: false,
  fromCache: false,
  // Fiş tarama ekranının okuduğu değerler, masraf formuna buradan taşınır.
  receiptDraft: null, // { amount, category, date, note }
};

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setReceiptDraft(state, action) {
      state.receiptDraft = action.payload;
    },
    clearReceiptDraft(state) {
      state.receiptDraft = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.fromCache = action.payload.fromCache;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Masraflar yüklenemedi.';
      })
      .addCase(addExpense.pending, (state) => {
        state.saving = true;
      })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.saving = false;
        state.items.unshift(action.payload.expense);
      })
      .addCase(addExpense.rejected, (state) => {
        state.saving = false;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.items = state.items.filter((e) => e.id !== action.payload);
      })
      .addCase(syncOfflineExpenses.pending, (state) => {
        state.syncing = true;
      })
      .addCase(syncOfflineExpenses.fulfilled, (state, action) => {
        state.syncing = false;
        const synced = new Set(action.payload.syncedIds);
        state.items.forEach((e) => {
          if (synced.has(e.id)) e.pending = false;
        });
      })
      .addCase(syncOfflineExpenses.rejected, (state) => {
        state.syncing = false;
      })
      // Tarla silinince ona bağlı masraflar da listeden çıkar.
      .addCase('fields/delete/fulfilled', (state, action) => {
        state.items = state.items.filter((e) => e.fieldId !== action.payload);
      })
      .addCase('auth/logout/fulfilled', () => initialState);
  },
});

export const { setReceiptDraft, clearReceiptDraft } = expensesSlice.actions;

// Telefonda bekleyen (henüz gönderilmemiş) masraf sayısı.
export const selectPendingCount = (state) =>
  state.expenses.items.filter((e) => e.pending).length;

export default expensesSlice.reducer;
