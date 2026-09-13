import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type Language = 'Türkçe' | 'English';

export type AppState = {
  displayName: string;
  language: Language;
  isPremium: boolean;
  creditsRemaining: number;
  creditsTotal: number;
  lastCreditDate: string;
  creditHistory: number[];
};

type AppContextValue = AppState & {
  consumeCredit: () => boolean;
  activatePremium: () => void;
  updateDisplayName: (value: string) => void;
  toggleLanguage: () => void;
};

const STORAGE_KEY = '@hayvan-dili/app-state';
const DAILY_CREDITS = 5;

const getDayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

const initialState: AppState = {
  displayName: '',
  language: 'Türkçe',
  isPremium: false,
  creditsRemaining: DAILY_CREDITS,
  creditsTotal: DAILY_CREDITS,
  lastCreditDate: getDayKey(),
  creditHistory: [],
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const hydrated = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed = JSON.parse(stored) as Partial<AppState>;
        const today = getDayKey();
        const sameDay = parsed.lastCreditDate === today;
        setState({
          ...initialState,
          ...parsed,
          lastCreditDate: today,
          creditsRemaining:
            parsed.isPremium || sameDay ? (parsed.creditsRemaining ?? DAILY_CREDITS) : DAILY_CREDITS,
          creditsTotal: parsed.isPremium ? 9999 : DAILY_CREDITS,
        });
      })
      .catch(() => {
        setState(initialState);
      })
      .finally(() => {
        hydrated.current = true;
      });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state]);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      consumeCredit: () => {
        if (state.isPremium) return true;
        if (state.creditsRemaining <= 0) return false;
        setState((current) => ({
          ...current,
          creditsRemaining: Math.max(0, current.creditsRemaining - 1),
          creditHistory: [Date.now(), ...current.creditHistory].slice(0, 20),
        }));
        return true;
      },
      activatePremium: () => {
        setState((current) => ({
          ...current,
          isPremium: true,
          creditsRemaining: 9999,
          creditsTotal: 9999,
        }));
      },
      updateDisplayName: (displayName: string) => {
        setState((current) => ({ ...current, displayName }));
      },
      toggleLanguage: () => {
        setState((current) => ({
          ...current,
          language: current.language === 'Türkçe' ? 'English' : 'Türkçe',
        }));
      },
    }),
    [state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return value;
}