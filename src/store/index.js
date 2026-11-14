// Redux store: tüm dilimler (slice) burada birleştirilir.

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import fieldsReducer from './fieldsSlice';
import expensesReducer from './expensesSlice';
import listingsReducer from './listingsSlice';
import weatherReducer from './weatherSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    fields: fieldsReducer,
    expenses: expensesReducer,
    listings: listingsReducer,
    weather: weatherReducer,
  },
});

export default store;
