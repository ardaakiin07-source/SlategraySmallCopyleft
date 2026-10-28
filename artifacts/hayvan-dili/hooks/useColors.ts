import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';
import { useThemeMode } from '@/context/AppContext';

/**
 * Koyu mu açık mı olduğunu söyler.
 * Ayarlar'daki seçim "Telefon" ise telefonun kendi ayarına bakar.
 */
export function useIsDark() {
  const scheme = useColorScheme();
  const mode = useThemeMode();
  return mode === 'system' ? scheme === 'dark' : mode === 'dark';
}

/**
 * Seçili temanın renklerini döndürür.
 */
export function useColors() {
  const isDark = useIsDark();
  const palette = isDark ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}