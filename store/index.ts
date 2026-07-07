import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
  createMigrate,
  type PersistedState,
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";

import { createLogger } from "redux-logger";

import storage from "./storage";
import authReducer from "./slices/auth-slice";
import configReducer from "./slices/config-slice";
import applicationReducer from "./slices/application-slice";

const rootReducer = combineReducers({
  auth: authReducer,
  config: configReducer,
  application: applicationReducer,
});

// Bump when a persisted slice's shape changes incompatibly. Each migration
// drops the persisted `application` state so the reducer's fresh initial state
// (now an empty list) is used instead of a stale snapshot. v3 clears any loan
// data left over from earlier testing.
const dropApplication = (state: PersistedState) => {
  if (!state) return state;
  const next = { ...state } as Record<string, unknown>;
  delete next.application;
  return next as PersistedState;
};
const migrations = {
  2: dropApplication,
  3: dropApplication,
};

const persistConfig = {
  key: "piccolo",
  version: 3,
  storage,
  whitelist: ["auth", "application"],
  migrate: createMigrate(migrations, { debug: false }),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const isDev = process.env.NODE_ENV !== "production";

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => {
    const middleware = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    });
    if (isDev) {
      middleware.push(createLogger({ collapsed: true, diff: true }));
    }
    return middleware;
  },
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
