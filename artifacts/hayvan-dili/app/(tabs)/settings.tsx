import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useApp,
  type Language,
  type PetGender,
  type PetType,
  type ThemeMode,
} from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useT } from '@/hooks/useT';
import PetManager from '@/components/PetManager';
type Palette = ReturnType<typeof useColors>;
type IconName = React.ComponentProps<typeof Feather>['name'];

const LANGUAGES: { id: Language; label: string; short: string }[] = [
  { id: 'Türkçe', label: 'Türkçe', short: 'TR' },
  { id: 'English', label: 'English', short: 'EN' },
  { id: 'العربية', label: 'العربية', short: 'AR' },
];

const THEMES: {
  id: ThemeMode;
  icon: IconName;
  key: 'themeLight' | 'themeDark' | 'themeSystem';
}[] = [
  { id: 'light', icon: 'sun', key: 'themeLight' },
  { id: 'dark', icon: 'moon', key: 'themeDark' },
  { id: 'system', icon: 'smartphone', key: 'themeSystem' },
];

const PET_TYPES: { id: PetType; emoji: string; key: 'petDog' | 'petCat' }[] = [
  { id: 'dog', emoji: '🐶', key: 'petDog' },
  { id: 'cat', emoji: '🐱', key: 'petCat' },
];

const PET_GENDERS: { id: PetGender; emoji: string; key: 'petMale' | 'petFemale' }[] = [
  { id: 'male', emoji: '♂️', key: 'petMale' },
  { id: 'female', emoji: '♀️', key: 'petFemale' },
];

function Section({
  title,
  hint,
  colors,
  children,
}: {
  title: string;
  hint?: string;
  colors: Palette;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {hint ? <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>{hint}</Text> : null}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const {
    language,
    setLanguage,
    themeMode,
    setThemeMode,
    hapticsEnabled,
    setHapticsEnabled,
    isPremium,
    creditsRemaining,
    pet,
    updatePet,
  } = useApp();

  // Dostum formu: yazdıkların burada tutulur, "Kaydet"e basınca kaydedilir
  const [petName, setPetName] = useState(pet?.name ?? '');
  const [petBreed, setPetBreed] = useState(pet?.breed ?? '');
  const [petAge, setPetAge] = useState(pet?.age ?? '');
  const [petType, setPetType] = useState<PetType>(pet?.type ?? 'dog');
  const [petGender, setPetGender] = useState<PetGender | undefined>(pet?.gender);
  const [nameError, setNameError] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Başka bir dost seçilirse form yeniden doldurulur
  useEffect(() => {
    setPetName(pet?.name ?? '');
    setPetBreed(pet?.breed ?? '');
    setPetAge(pet?.age ?? '');
    setPetType(pet?.type ?? 'dog');
    setPetGender(pet?.gender);
    setNameError(false);
  }, [pet?.id]);

  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), 1800);
    return () => clearTimeout(timer);
  }, [justSaved]);

  const petChanged =
    !!pet &&
    (petName.trim() !== pet.name ||
      petBreed.trim() !== (pet.breed ?? '') ||
      petAge.trim() !== (pet.age ?? '') ||
      petType !== pet.type ||
      petGender !== pet.gender);

  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === 'web' ? Math.max(insets.bottom, 34) : insets.bottom;

  const tap = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
  };

  const savePet = () => {
    if (!pet) return;
    if (!petName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    updatePet(pet.id, {
      type: petType,
      name: petName.trim(),
      breed: petBreed.trim(),
      age: petAge.trim(),
      gender: petGender,
    });
    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setJustSaved(true);
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.muted, color: colors.foreground, borderColor: 'transparent' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 14, paddingBottom: bottomInset + 108 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        bounces
      >
        <Text style={[styles.title, { color: colors.foreground }]}>{t('settingsTitle')}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{t('settingsSubtitle')}</Text>
<PetManager />
        {/* Dostum */}
        {pet ? (
          <Section title={t('petTitle')} hint={t('petHint')} colors={colors}>
            <View style={styles.form}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t('petName')}</Text>
              <TextInput
                testID="pet-name-input"
                value={petName}
                onChangeText={(value) => {
                  setPetName(value);
                  if (nameError) setNameError(false);
                }}
                placeholder={t('petNamePlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                maxLength={24}
                style={[inputStyle, nameError && { borderColor: colors.destructive }]}
              />
              {nameError ? (
                <Text style={[styles.errorText, { color: colors.destructive }]}>{t('petNameRequired')}</Text>
              ) : null}

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t('petType')}</Text>
              <View style={styles.chipRow}>
                {PET_TYPES.map((item) => {
                  const active = petType === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      testID={`pet-type-${item.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={t(item.key)}
                      onPress={() => {
                        tap();
                        setPetType(item.id);
                      }}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          backgroundColor: active ? colors.coral : colors.muted,
                          transform: [{ scale: pressed ? 0.96 : 1 }],
                        },
                      ]}
                    >
                      <Text style={styles.chipEmoji}>{item.emoji}</Text>
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? colors.primaryForeground : colors.mutedForeground },
                        ]}
                      >
                        {t(item.key)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t('petBreed')}</Text>
              <TextInput
                testID="pet-breed-input"
                value={petBreed}
                onChangeText={setPetBreed}
                placeholder={t('petBreedPlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                maxLength={30}
                style={inputStyle}
              />

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t('petAge')}</Text>
              <TextInput
                testID="pet-age-input"
                value={petAge}
                onChangeText={setPetAge}
                placeholder={t('petAgePlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                maxLength={16}
                style={inputStyle}
              />

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t('petGender')}</Text>
              <View style={styles.chipRow}>
                {PET_GENDERS.map((item) => {
                  const active = petGender === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      testID={`pet-gender-${item.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={t(item.key)}
                      onPress={() => {
                        tap();
                        // Aynı seçeneğe tekrar basınca seçim kalkar
                        setPetGender(active ? undefined : item.id);
                      }}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          backgroundColor: active ? colors.teal : colors.muted,
                          transform: [{ scale: pressed ? 0.96 : 1 }],
                        },
                      ]}
                    >
                      <Text style={styles.chipEmoji}>{item.emoji}</Text>
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? colors.primaryForeground : colors.mutedForeground },
                        ]}
                      >
                        {t(item.key)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                testID="pet-save"
                accessibilityRole="button"
                accessibilityLabel={t('petSave')}
                disabled={!petChanged}
                onPress={savePet}
                style={({ pressed }) => [
                  styles.saveButton,
                  {
                    backgroundColor: justSaved ? colors.teal : colors.coral,
                    opacity: petChanged || justSaved ? 1 : 0.4,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <Feather
                  name={justSaved ? 'check' : 'save'}
                  size={18}
                  color={colors.primaryForeground}
                />
                <Text style={[styles.saveText, { color: colors.primaryForeground }]}>
                  {justSaved ? t('petSaved') : t('petSave')}
                </Text>
              </Pressable>
            </View>
          </Section>
        ) : null}

        {/* Kalan jeton (sadece gösterir, satın alma yok) */}
        <Section title={t('tokensTitle')} colors={colors}>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: colors.marigold }]}>
              <Feather name="star" size={18} color={colors.accentForeground} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t('tokensLeft')}</Text>
            </View>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>
              {isPremium ? '∞' : `${creditsRemaining}`}
            </Text>
          </View>
        </Section>

        {/* Dil */}
        <Section title={t('languageTitle')} hint={t('languageHint')} colors={colors}>
          {LANGUAGES.map((item, index) => {
            const active = language === item.id;
            return (
              <Pressable
                key={item.id}
                testID={`language-${item.short}`}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => {
                  tap();
                  setLanguage(item.id);
                }}
                style={({ pressed }) => [
                  styles.row,
                  { opacity: pressed ? 0.85 : 1 },
                  index < LANGUAGES.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: active ? colors.coral : colors.muted },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: active ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {item.short}
                  </Text>
                </View>
                <Text style={[styles.rowLabel, styles.rowCopy, { color: colors.foreground }]}>
                  {item.label}
                </Text>
                {active ? <Feather name="check-circle" size={20} color={colors.coral} /> : null}
              </Pressable>
            );
          })}
          <Text style={[styles.note, { color: colors.mutedForeground }]}>{t('languageNote')}</Text>
        </Section>

        {/* Görünüm */}
        <Section title={t('appearanceTitle')} colors={colors}>
          <View style={styles.segmentRow}>
            {THEMES.map((item) => {
              const active = themeMode === item.id;
              return (
                <Pressable
                  key={item.id}
                  testID={`theme-${item.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={t(item.key)}
                  onPress={() => {
                    tap();
                    setThemeMode(item.id);
                  }}
                  style={({ pressed }) => [
                    styles.segment,
                    {
                      backgroundColor: active ? colors.coral : colors.muted,
                      transform: [{ scale: pressed ? 0.96 : 1 }],
                    },
                  ]}
                >
                  <Feather
                    name={item.icon}
                    size={20}
                    color={active ? colors.primaryForeground : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      { color: active ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {t(item.key)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Dokunuş */}
        <Section title={t('feelTitle')} colors={colors}>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: colors.teal + '33' }]}>
              <Feather name="zap" size={18} color={colors.tealDeep} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t('hapticsTitle')}</Text>
              <Text style={[styles.rowHint, { color: colors.mutedForeground }]}>{t('hapticsHint')}</Text>
            </View>
            <Switch
              testID="haptics-switch"
              value={hapticsEnabled}
              onValueChange={(value) => {
                setHapticsEnabled(value);
                if (value) Haptics.selectionAsync();
              }}
              trackColor={{ false: colors.border, true: colors.teal }}
              thumbColor={colors.whiteWarm}
            />
          </View>
        </Section>

        {/* Hakkında */}
        <Section title={t('aboutTitle')} colors={colors}>
          <View style={styles.aboutBox}>
            <Text style={[styles.aboutText, { color: colors.mutedForeground }]}>{t('aboutText')}</Text>
            <Text style={[styles.version, { color: colors.foreground }]}>{t('version')} 1.0.0</Text>
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    letterSpacing: -0.3,
    paddingHorizontal: 3,
  },
  sectionHint: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 2,
    paddingHorizontal: 3,
  },
  card: {
    marginTop: 10,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  form: {
    padding: 14,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chipEmoji: {
    fontSize: 18,
  },
  chipText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 18,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowCopy: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  rowHint: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 2,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  note: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  segment: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  aboutBox: {
    padding: 14,
    gap: 8,
  },
  aboutText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  version: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});