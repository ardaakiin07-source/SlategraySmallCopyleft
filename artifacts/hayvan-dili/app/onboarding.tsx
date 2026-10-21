import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimalMascot, animalInfo } from '@/components/AnimalMascot';
import { useApp, type PetType } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const BREEDS: Record<PetType, string[]> = {
  dog: [
    'Golden Retriever',
    'Labrador',
    'Kangal',
    'Alman Kurdu',
    'Pomeranian',
    'Terrier',
    'Husky',
    'Cocker Spaniel',
    'Melez / Bilmiyorum',
  ],
  cat: [
    'Tekir',
    'Sarman',
    'British Shorthair',
    'Van Kedisi',
    'Ankara Kedisi',
    'Scottish Fold',
    'İran Kedisi',
    'Melez / Bilmiyorum',
  ],
};

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addPet } = useApp();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<PetType | null>(null);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');

  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 40) : insets.top;
  const bottomInset = Platform.OS === 'web' ? Math.max(insets.bottom, 24) : insets.bottom;

  const canContinue =
    step === 0 ? type !== null : step === 1 ? name.trim().length > 0 : breed.trim().length > 0;
  const possessive = type === 'cat' ? 'Kedinin' : 'Köpeğinin';

  const chooseType = (next: PetType) => {
    Haptics.selectionAsync();
    if (next !== type) setBreed('');
    setType(next);
  };

  const goNext = () => {
    if (!canContinue || !type) return;
    if (step < 2) {
      Haptics.selectionAsync();
      setStep(step + 1);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addPet({ type, name: name.trim(), breed: breed.trim() });
  };

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const kicker = step === 0 ? 'HOŞ GELDİN' : step === 1 ? 'ADIM 2 / 3' : 'SON ADIM';
  const title =
    step === 0
      ? 'Evde hangi minik\ndostun var?'
      : step === 1
        ? `${possessive}\nadı ne?`
        : `${name.trim()} hangi\ncinsten?`;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: bottomInset + 24 }]}
      >
        <View style={styles.topRow}>
          {step > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Geri dön"
              onPress={goBack}
              style={[styles.backButton, { backgroundColor: colors.card }]}
            >
              <Feather name="arrow-left" size={21} color={colors.foreground} />
            </Pressable>
          ) : (
            <View style={styles.backSpacer} />
          )}
          <View style={styles.dots}>
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: index <= step ? colors.coral : colors.border },
                  index === step && styles.dotActive,
                ]}
              />
            ))}
          </View>
          <View style={styles.backSpacer} />
        </View>

        <LinearGradient
          colors={[colors.coral, colors.tangerine]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={[styles.heroBlob, { backgroundColor: colors.marigold }]} />
          <View style={styles.heroCopy}>
            <Text style={[styles.heroKicker, { color: colors.heroText }]}>{kicker}</Text>
            <Text style={[styles.heroTitle, { color: colors.softWhite }]}>{title}</Text>
          </View>
          <View style={styles.heroMascots}>
            {step === 0 ? (
              <>
                <View style={[styles.mascotCircle, { backgroundColor: colors.teal }]}>
                  <AnimalMascot animal="cat" colors={colors} size={70} />
                </View>
                <View style={[styles.mascotCircle, styles.mascotCircleBig, { backgroundColor: colors.marigold }]}>
                  <AnimalMascot animal="dog" colors={colors} size={92} />
                </View>
              </>
            ) : (
              <View style={[styles.mascotCircle, styles.mascotCircleBig, { backgroundColor: colors.marigold }]}>
                <AnimalMascot animal={type ?? 'dog'} colors={colors} size={96} />
              </View>
            )}
          </View>
        </LinearGradient>

        {step === 0 ? (
          <View style={styles.typeRow}>
            {(['dog', 'cat'] as PetType[]).map((option) => {
              const selected = type === option;
              return (
                <Pressable
                  key={option}
                  testID={`onboarding-type-${option}`}
                  accessibilityRole="button"
                  accessibilityLabel={animalInfo[option].name}
                  onPress={() => chooseType(option)}
                  style={[
                    styles.typeCard,
                    { backgroundColor: colors.card, borderColor: selected ? colors.coral : colors.border },
                    selected && styles.typeCardSelected,
                  ]}
                >
                  <AnimalMascot animal={option} colors={colors} size={96} />
                  <Text style={[styles.typeName, { color: colors.foreground }]}>{animalInfo[option].name}</Text>
                  <Text style={[styles.typeSubtitle, { color: colors.mutedForeground }]}>
                    {animalInfo[option].subtitle}
                  </Text>
                  {selected ? (
                    <View style={[styles.checkDot, { backgroundColor: colors.coral }]}>
                      <Feather name="check" size={13} color={colors.whiteWarm} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Minik dostunun adı</Text>
            <TextInput
              testID="onboarding-name"
              value={name}
              onChangeText={setName}
              placeholder="Örn. Pamuk"
              placeholderTextColor={colors.mutedForeground}
              maxLength={20}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={goNext}
              style={[
                styles.input,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
              ]}
            />
          </View>
        ) : null}

        {step === 2 && type ? (
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Birini seç ya da kendin yaz</Text>
            <View style={styles.chips}>
              {BREEDS[type].map((option) => {
                const selected = breed === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    onPress={() => {
                      Haptics.selectionAsync();
                      setBreed(option);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? colors.coral : colors.card,
                        borderColor: selected ? colors.coral : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              testID="onboarding-breed"
              value={breed}
              onChangeText={setBreed}
              placeholder="Başka bir cins yaz"
              placeholderTextColor={colors.mutedForeground}
              maxLength={30}
              returnKeyType="done"
              onSubmitEditing={goNext}
              style={[
                styles.input,
                styles.breedInput,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
              ]}
            />
          </View>
        ) : null}

        <Pressable
          testID="onboarding-next"
          accessibilityRole="button"
          disabled={!canContinue}
          onPress={goNext}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: colors.coral,
              opacity: canContinue ? 1 : 0.45,
              transform: [{ scale: pressed && canContinue ? 0.97 : 1 }],
            },
          ]}
        >
          <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
            {step < 2 ? 'Devam et' : 'Başlayalım'}
          </Text>
          <Feather name={step < 2 ? 'arrow-right' : 'check'} size={20} color={colors.primaryForeground} />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: { width: 43, height: 43, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  backSpacer: { width: 43, height: 43 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  hero: {
    minHeight: 190,
    borderRadius: 30,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 22,
    marginBottom: 24,
  },
  heroBlob: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    right: 20,
    top: -84,
    opacity: 0.2,
  },
  heroCopy: { flex: 1, zIndex: 1 },
  heroKicker: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.8, marginBottom: 10 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 27, lineHeight: 31, letterSpacing: -1 },
  heroMascots: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  mascotCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -14,
  },
  mascotCircleBig: { width: 112, height: 112, borderRadius: 56 },
  typeRow: { flexDirection: 'row', gap: 13 },
  typeCard: {
    flex: 1,
    borderRadius: 25,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    position: 'relative',
  },
  typeCardSelected: { borderWidth: 2.5 },
  typeName: { fontFamily: 'Inter_700Bold', fontSize: 17, marginTop: 8 },
  typeSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 3 },
  checkDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldBlock: { gap: 12 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginLeft: 4 },
  input: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  breedInput: { fontSize: 15, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chip: { borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10 },
  chipText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  cta: {
    minHeight: 57,
    borderRadius: 20,
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  ctaText: { fontFamily: 'Inter_700Bold', fontSize: 16 },
});