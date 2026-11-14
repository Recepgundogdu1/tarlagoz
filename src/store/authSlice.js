// Oturum durumu: giriş, kayıt, çıkış.

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { getErrorMessage } from '../utils/errors';

// Firebase kullanıcı nesnesi Redux'ta saklanamaz (serileştirilemez); yalnızca
// ihtiyacımız olan düz alanları alıyoruz.
export function toPlainUser(firebaseUser) {
  if (!firebaseUser) return null;
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || '',
  };
}

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(credential.user, { displayName: cleanName });
      // Profil belgesi yazılamazsa (zayıf internet) kayıt yine de geçerlidir.
      try {
        await setDoc(doc(db, 'users', credential.user.uid), {
          name: cleanName,
          email: cleanEmail,
          createdAt: Date.now(),
        });
      } catch (error) {
        // yok sayılır
      }
      return { uid: credential.user.uid, email: cleanEmail, name: cleanName };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Kayıt yapılamadı. Tekrar deneyin.'));
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );
      return toPlainUser(credential.user);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Giriş yapılamadı. Tekrar deneyin.'));
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Çıkış yapılamadı.'));
  }
});

export const sendPasswordReset = createAsyncThunk(
  'auth/passwordReset',
  async (email, { rejectWithValue }) => {
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      return true;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Şifre sıfırlama e-postası gönderilemedi.'));
    }
  }
);

const initialState = {
  user: null,
  initializing: true, // açılışta kayıtlı oturum kontrol edilirken true
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Firebase'in oturum dinleyicisi (onAuthStateChanged) her değişiklikte bunu çağırır.
    setUser(state, action) {
      const incoming = action.payload;
      if (incoming && state.user && state.user.uid === incoming.uid && !incoming.name) {
        // Kayıt sırasında dinleyici, ad kaydedilmeden önce tetiklenebilir; adı koru.
        state.user = { ...incoming, name: state.user.name };
      } else {
        state.user = incoming;
      }
      state.initializing = false;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.initializing = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Kayıt yapılamadı.';
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.initializing = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Giriş yapılamadı.';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload || 'Çıkış yapılamadı.';
      });
  },
});

export const { setUser, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
