import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { userReducer } from './user/userReducer';
import { preferenceReducer } from './preference/preferenceReducer';
import { tokensReducer } from './tokens/tokensReducer';
import { uiReducer } from './ui/uiReducer';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
  key: 'root',
  storage,
};

const persistedPreferenceReducer = persistReducer(
  persistConfig,
  preferenceReducer
);
const persistedTokensReducer = persistReducer(persistConfig, tokensReducer);

const reducer = combineReducers({
  userReducer,
  preferenceReducer: persistedPreferenceReducer,
  tokensReducer: persistedTokensReducer,
  uiReducer,
});

const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  reducer,
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);

export default store;
