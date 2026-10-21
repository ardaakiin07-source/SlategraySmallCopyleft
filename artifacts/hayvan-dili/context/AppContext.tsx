import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type Language = 'Türkçe' | 'English';
export type PetType = 'dog' | 'cat';

export type Pet = {
  id: string;
  type: PetType;
  name: string;
  breed: string;
};

export type AppState = {
  displayName: string;
  language: Language;
  isPremium: boolean;
  // creditsRemaining = kalan jeton sayısı
  creditsRemaining: number;
  creditsTotal: number;
  // lastCreditDate = günlük bonus jetonunun son verildiği gün
  lastCreditDate: string;
  creditHistory: number[];
  pets: Pet[];
  activePetId: string | null;
};

type AppContextValue = AppState & {
  isReady: boolean;
  pet: Pet | null;
  consumeCredit: () => boolean;
  addCredits: (amount: number) => void;
  activatePremium: () => void;
  updateDisplayName: (value: string) => void;
  toggleLanguage: () => void;
  addPet: (input: { type: PetType; name: string; breed: string }) => void;
};

const STORAGE_KEY = '@hayvan-dili/app-state';

// ---- JETON AYARLARI (sayıları buradan değiştirebilirsin) ----
// Yeni kullanıcıya hediye jeton sayısı
const START_TOKENS = 5;
// Her gün uygulamayı açana verilen bonus jeton
const DAILY_BONUS = 1;
// Günlük bonus sadece jeton sayısı bu sayının altındaysa verilir
const DAILY_BONUS_LIMIT = 5;
// --------------------------------------------------------------

const getDayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

const initialState: AppState = {
  displayName: '',
  language: 'Türkçe',
  isPremium: false,
  creditsRemaining: START_TOKENS,
  creditsTotal: START_TOKENS,
  lastCreditDate: getDayKey(),
  creditHistory: [],
  pets: [],
  activePetId: null,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [isReady, setIsReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed = JSON.parse(stored) as Partial<AppState>;
        const today = getDayKey();
        let balance = parsed.creditsRemaining ?? START_TOKENS;

        // Yeni gün başladıysa ve jeton azsa günlük bonus ver
        if (!parsed.isPremium && parsed.lastCreditDate !== today && balance < DAILY_BONUS_LIMIT) {
          balance = Math.min(balance + DAILY_BONUS, DAILY_BONUS_LIMIT);
        }

        setState({
          ...initialState,
          ...parsed,
          lastCreditDate: today,
          creditsRemaining: balance,
          creditsTotal: parsed.isPremium ? 9999 : Math.max(balance, START_TOKENS),
        });
      })
      .catch(() => {
        setState(initialState);
      })
      .finally(() => {
        hydrated.current = true;
        setIsReady(true);
      });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state]);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      isReady,
      pet: state.pets.find((item) => item.id === state.activePetId) ?? state.pets[0] ?? null,
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
      // Jeton ekler (satın alma ekranı bunu kullanacak)
      addCredits: (amount: number) => {
        if (amount <= 0) return;
        setState((current) => {
          if (current.isPremium) return current;
          const balance = current.creditsRemaining + amount;
          return {
            ...current,
            creditsRemaining: balance,
            creditsTotal: Math.max(current.creditsTotal, balance),
          };
        });
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
      addPet: (input) => {
        const newPet: Pet = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: input.type,
          name: input.name,
          breed: input.breed,
        };
        setState((current) => ({
          ...current,
          pets: [...current.pets, newPet],
          activePetId: newPet.id,
        }));
      },
    }),
    [state, isReady],
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