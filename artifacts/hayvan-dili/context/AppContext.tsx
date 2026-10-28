import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type Language = 'Türkçe' | 'English' | 'العربية';
export type ThemeMode = 'system' | 'light' | 'dark';
export type PetType = 'dog' | 'cat';
export type PetGender = 'male' | 'female';

export type Pet = {
  id: string;
  type: PetType;
  name: string;
  breed: string;
  age?: string;
  gender?: PetGender;
};

export type AppState = {
  displayName: string;
  language: Language;
  themeMode: ThemeMode;
  hapticsEnabled: boolean;
  isPremium: boolean;
  // creditsRemaining = kalan jeton sayısı
  creditsRemaining: number;
  creditsTotal: number;
  lastCreditDate: string;
  // bonusClaimedDate = günlük bonus jetonunun son alındığı gün
  bonusClaimedDate: string;
  creditHistory: number[];
  pets: Pet[];
  activePetId: string | null;
};

type AppContextValue = AppState & {
  isReady: boolean;
  pet: Pet | null;
  canClaimDailyBonus: boolean;
  consumeCredit: () => boolean;
  addCredits: (amount: number) => void;
  claimDailyBonus: () => boolean;
  activatePremium: () => void;
  updateDisplayName: (value: string) => void;
  toggleLanguage: () => void;
  setLanguage: (language: Language) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  addPet: (input: {
    type: PetType;
    name: string;
    breed: string;
    age?: string;
    gender?: PetGender;
  }) => void;
  updatePet: (id: string, patch: Partial<Omit<Pet, 'id'>>) => void;
  // YENİ: bir hayvanı siler
  removePet: (id: string) => void;
  // YENİ: seçili (aktif) hayvanı değiştirir
  setActivePet: (id: string) => void;
};

const STORAGE_KEY = '@hayvan-dili/app-state';

// ---- JETON AYARLARI (sayıları buradan değiştirebilirsin) ----
// Yeni kullanıcıya hediye jeton sayısı
const START_TOKENS = 5;
// Günlük bonus butonuna basınca verilen jeton (günde bir kez)
const DAILY_BONUS = 1;
// --------------------------------------------------------------

const getDayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

const initialState: AppState = {
  displayName: '',
  language: 'Türkçe',
  themeMode: 'system',
  hapticsEnabled: true,
  isPremium: false,
  creditsRemaining: START_TOKENS,
  creditsTotal: START_TOKENS,
  lastCreditDate: getDayKey(),
  bonusClaimedDate: '',
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
        const balance = parsed.creditsRemaining ?? START_TOKENS;

        setState({
          ...initialState,
          ...parsed,
          lastCreditDate: getDayKey(),
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
      canClaimDailyBonus: !state.isPremium && state.bonusClaimedDate !== getDayKey(),
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
      // Günlük bonus: günde bir kez, true döner = jeton verildi
      claimDailyBonus: () => {
        const today = getDayKey();
        if (state.isPremium || state.bonusClaimedDate === today) return false;
        setState((current) => {
          if (current.isPremium || current.bonusClaimedDate === today) return current;
          const balance = current.creditsRemaining + DAILY_BONUS;
          return {
            ...current,
            creditsRemaining: balance,
            creditsTotal: Math.max(current.creditsTotal, balance),
            bonusClaimedDate: today,
          };
        });
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
      setLanguage: (language: Language) => {
        setState((current) => ({ ...current, language }));
      },
      setThemeMode: (themeMode: ThemeMode) => {
        setState((current) => ({ ...current, themeMode }));
      },
      setHapticsEnabled: (hapticsEnabled: boolean) => {
        setState((current) => ({ ...current, hapticsEnabled }));
      },
      addPet: (input) => {
        const newPet: Pet = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: input.type,
          name: input.name,
          breed: input.breed,
          age: input.age,
          gender: input.gender,
        };
        setState((current) => ({
          ...current,
          pets: [...current.pets, newPet],
          activePetId: newPet.id,
        }));
      },
      // Dostumun bilgilerini günceller (isim, tür, cins, yaş, cinsiyet)
      updatePet: (id: string, patch: Partial<Omit<Pet, 'id'>>) => {
        setState((current) => ({
          ...current,
          pets: current.pets.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        }));
      },
      // YENİ: Hayvanı siler. Silinen hayvan seçiliyse listedeki ilk hayvan seçilir.
      removePet: (id: string) => {
        setState((current) => {
          const pets = current.pets.filter((item) => item.id !== id);
          const activePetId =
            current.activePetId === id ? (pets[0]?.id ?? null) : current.activePetId;
          return { ...current, pets, activePetId };
        });
      },
      // YENİ: Seçili hayvanı değiştirir
      setActivePet: (id: string) => {
        setState((current) => ({ ...current, activePetId: id }));
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

// Tema seçimini okur. AppProvider dışında çağrılırsa hata vermez, "telefon" ayarına döner.
export function useThemeMode(): ThemeMode {
  const value = useContext(AppContext);
  return value?.themeMode ?? 'system';
}