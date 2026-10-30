import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import themeColors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import PetStrip from '@/components/PetStrip';
type AnimalAccent = 'coral' | 'marigold';
type AnimalId = 'dog' | 'cat';

type Animal = {
  id: AnimalId;
  name: string;
  subtitle: string;
  accent: AnimalAccent;
  iconName: AnimalId;
};

type Fact = {
  emoji: string;
  text: string;
};

type Palette = ReturnType<typeof useColors>;

const animals: Animal[] = [
  { id: 'dog', name: 'Köpek', subtitle: 'Neşeli hav hav', accent: 'coral', iconName: 'dog' },
  { id: 'cat', name: 'Kedi', subtitle: 'Meraklı miyav', accent: 'marigold', iconName: 'cat' },
];

// Biliyor muydun: her 30 saniyede bir sıradaki bilgi gösterilir
const FACT_INTERVAL_MS = 30000;

const FUN_FACTS: Fact[] = [
  { emoji: '🐶', text: 'Köpeklerin burun izi, insan parmak izi gibi her köpekte farklıdır.' },
  { emoji: '🐱', text: 'Kediler insanlarla genellikle miyavlayarak iletişim kurar.' },
  { emoji: '🐶', text: 'Köpeklerin koku alma duyusu, insanınkinden çok daha güçlüdür.' },
  { emoji: '🐱', text: 'Kedi mırlaması her zaman mutluluk demek değildir, bazen stresliyken de mırlayabilirler.' },
  { emoji: '🐶', text: 'Köpekler, insanların duyamadığı yüksek frekanslı sesleri de duyabilir.' },
  { emoji: '🐱', text: 'Kediler günün büyük bölümünü uyuyarak geçirir.' },
  { emoji: '🐶', text: 'Köpek kuyruk sallıyorsa her zaman mutlu demek değildir. Kuyruğun duruşu da önemlidir.' },
  { emoji: '🐱', text: 'Kedinin yavaş göz kırpması çoğu zaman rahat ve güvende olduğunu gösterir.' },
  { emoji: '🐶', text: 'Köpekler esneyerek bazen gerginliklerini de belli edebilir.' },
  { emoji: '🐱', text: 'Kedinin kuyruğu dik duruyorsa genelde selam veriyor demektir.' },
  { emoji: '🐶', text: 'Köpek yavruları doğduklarında duyamaz, ilk günlerde dünyayı koku ve dokunmayla tanırlar.' },
  { emoji: '🐱', text: 'Kediler tırmalayarak hem pençelerini bakımlı tutar hem de bölgesini işaretler.' },
  { emoji: '🐶', text: 'Köpekler, sahiplerinin yüz ifadelerinden ruh halini anlamayı öğrenebilir.' },
  { emoji: '🐱', text: 'Kedilerin bıyıkları, dar yerlerden geçip geçemeyeceklerini anlamalarına yardım eder.' },
  { emoji: '🐶', text: 'Köpeklerin ıslak burnu, havadaki kokuları daha iyi yakalamalarına yardımcı olur.' },
  { emoji: '🐱', text: 'Kedilerin burun izi de tıpkı parmak izi gibi her kedide farklıdır.' },
  { emoji: '🐶', text: 'Yetişkin bir köpek günün yaklaşık yarısını uyuyarak geçirebilir.' },
  { emoji: '🐱', text: 'Kediler karanlıkta insanlardan çok daha iyi görür.' },
  { emoji: '🐶', text: 'Köpekler bazen kuyruğunu sağa ya da sola daha çok sallayarak farklı duygular gösterir.' },
  { emoji: '🐱', text: 'Kediler yüksekten düşerken havada dönerek ayakları üstüne inmeyi çoğu zaman başarır.' },
];

const { width: screenWidth } = Dimensions.get('window');

function MiniLogo({ colors }: { colors: Palette }) {
  return (
    <View style={[styles.logo, { backgroundColor: colors.coral }]}>
      <View style={[styles.logoEar, styles.logoEarLeft, { backgroundColor: colors.marigold }]} />
      <View style={[styles.logoEar, styles.logoEarRight, { backgroundColor: colors.marigold }]} />
      <View style={[styles.logoFace, { backgroundColor: colors.whiteWarm }]}>
        <View style={[styles.logoEye, { backgroundColor: colors.inkSoft }]} />
        <View style={[styles.logoEye, styles.logoEyeRight, { backgroundColor: colors.inkSoft }]} />
        <View style={[styles.logoMuzzle, { backgroundColor: colors.coralLight }]} />
      </View>
    </View>
  );
}

function AnimalMascot({
  animal,
  colors,
  size = 116,
}: {
  animal: AnimalId;
  colors: Palette;
  size?: number;
}) {
  const body = animal === 'dog' ? colors.coralLight : colors.marigold;
  const spot = colors.coral;
  const ink = colors.inkSoft;
  const inner = colors.whiteWarm;

  const face = (
    <>
      <Ellipse cx="60" cy="73" rx="5" ry="7" fill={ink} />
      <Ellipse cx="60" cy="74" rx="2" ry="3" fill={inner} opacity={0.9} />
      <Circle cx="43" cy="59" r="4.5" fill={ink} />
      <Circle cx="77" cy="59" r="4.5" fill={ink} />
      <Circle cx="41.5" cy="57.5" r="1.5" fill={inner} />
      <Circle cx="75.5" cy="57.5" r="1.5" fill={inner} />
      <Path d="M53 82 Q60 89 67 82" fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round" />
    </>
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel={`${animal} maskotu`}>
      <Circle cx="60" cy="60" r="54" fill={colors.whiteWarm} opacity={0.5} />
      {animal === 'dog' && (
        <>
          <Ellipse cx="28" cy="50" rx="17" ry="27" fill={colors.tangerine} transform="rotate(22 28 50)" />
          <Ellipse cx="92" cy="50" rx="17" ry="27" fill={colors.tangerine} transform="rotate(-22 92 50)" />
          <Circle cx="60" cy="61" r="38" fill={body} />
          <Ellipse cx="48" cy="51" rx="12" ry="16" fill={inner} opacity={0.55} />
          <Circle cx="42" cy="48" r="10" fill={spot} opacity={0.78} />
          {face}
          <Path d="M43 33 Q48 27 55 31" fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" opacity={0.7} />
          <Path d="M70 31 Q76 26 81 33" fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" opacity={0.7} />
        </>
      )}
      {animal === 'cat' && (
        <>
          <Path d="M29 42 L32 16 Q33 12 37 16 L53 29" fill={body} />
          <Path d="M91 42 L88 16 Q87 12 83 16 L67 29" fill={body} />
          <Path d="M34 23 L38 20 L46 30" fill={colors.coralLight} opacity={0.9} />
          <Path d="M86 23 L82 20 L74 30" fill={colors.coralLight} opacity={0.9} />
          <Circle cx="60" cy="62" r="38" fill={body} />
          <Path d="M41 48 Q48 42 54 48" fill="none" stroke={spot} strokeWidth="3" strokeLinecap="round" opacity={0.65} />
          <Path d="M66 48 Q73 42 79 48" fill="none" stroke={spot} strokeWidth="3" strokeLinecap="round" opacity={0.65} />
          {face}
          <Line x1="38" y1="73" x2="19" y2="68" stroke={ink} strokeWidth="2" opacity={0.7} />
          <Line x1="38" y1="78" x2="19" y2="80" stroke={ink} strokeWidth="2" opacity={0.7} />
          <Line x1="82" y1="73" x2="101" y2="68" stroke={ink} strokeWidth="2" opacity={0.7} />
          <Line x1="82" y1="78" x2="101" y2="80" stroke={ink} strokeWidth="2" opacity={0.7} />
        </>
      )}
    </Svg>
  );
}

function AnimalCard({
  animal,
  colors,
  selected,
  onPress,
}: {
  animal: Animal;
  colors: Palette;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const accent = colors[animal.accent];

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: Platform.OS !== 'web',
      speed: 22,
      bounciness: 4,
    }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 18,
      bounciness: 9,
    }).start();
  };

  return (
    <Animated.View style={[styles.cardShadow, { transform: [{ scale }] }]}>
      <Pressable
        testID={`animal-card-${animal.id}`}
        accessibilityRole="button"
        accessibilityLabel={animal.name}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.animalCard,
          { backgroundColor: colors.card },
          selected && { borderColor: accent, borderWidth: 2 },
        ]}
      >
        <View style={[styles.cardOrb, { backgroundColor: accent, opacity: 0.18 }]} />
        <View style={styles.mascotWrap}>
          <AnimalMascot animal={animal.iconName} colors={colors} size={104} />
        </View>
        <View style={styles.cardCopy}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.animalName, { color: colors.foreground }]}>{animal.name}</Text>
            {selected ? (
              <View style={[styles.selectedDot, { backgroundColor: accent }]}>
                <Feather name="check" size={12} color={colors.whiteWarm} />
              </View>
            ) : null}
          </View>
          <Text style={[styles.animalSubtitle, { color: colors.mutedForeground }]}>{animal.subtitle}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function TabOneScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { creditsRemaining, isPremium, pet, canClaimDailyBonus, claimDailyBonus, hapticsEnabled } = useApp();
  const [selectedId, setSelectedId] = useState<AnimalId>('dog');
  const [factIndex, setFactIndex] = useState(
    () => Math.floor(Date.now() / 86400000) % FUN_FACTS.length,
  );
  const factOpacity = useRef(new Animated.Value(1)).current;
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === 'web' ? Math.max(insets.bottom, 34) : insets.bottom;
  const cardWidth = screenWidth < 380 ? '47.5%' : '48%';
  const quickAnimalId: AnimalId = pet?.type ?? selectedId;
  const currentFact = FUN_FACTS[factIndex];

  // Her 30 saniyede bir yeni bilgi: önce yumuşakça kaybolur, sonra yenisi belirir
  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(factOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setFactIndex((current) => (current + 1) % FUN_FACTS.length);
        Animated.timing(factOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      });
    }, FACT_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [factOpacity]);

  const selectAnimal = (animal: Animal) => {
    if (hapticsEnabled) Haptics.selectionAsync();
    setSelectedId(animal.id);
    router.push({ pathname: '/translate', params: { animalId: animal.id } });
  };

  const openTranslate = (mode: 'listen' | 'speak') => {
    if (hapticsEnabled) Haptics.selectionAsync();
    router.push({
      pathname: '/translate',
      params: { animalId: quickAnimalId, mode, t: String(Date.now()) },
    });
  };

  const handleClaimBonus = () => {
    if (claimDailyBonus() && hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 14, paddingBottom: bottomInset + 108 }]}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={styles.header}>
          <View style={styles.brandGroup}>
            <MiniLogo colors={colors} />
            <View>
              <Text style={[styles.brandName, { color: colors.foreground }]}>Hayvan Dili</Text>
              <Text style={[styles.brandKicker, { color: colors.mutedForeground }]}>minik dostların sözlüğü</Text>
            </View>
          </View>
          <Pressable
            testID="credit-badge"
            accessibilityRole="button"
            accessibilityLabel="Jeton"
            style={[styles.creditBadge, { backgroundColor: colors.whiteWarm, borderColor: colors.border }]}
          >
            <View style={[styles.creditIcon, { backgroundColor: colors.marigold }]}>
              <Feather name="star" size={13} color={colors.accentForeground} />
            </View>
            <View>
              <Text style={[styles.creditValue, { color: colors.foreground }]}>
                {isPremium ? '∞' : `${creditsRemaining}`}
              </Text>
              <Text style={[styles.creditLabel, { color: colors.mutedForeground }]}>jeton</Text>
            </View>
          </Pressable>
        </View>

        <LinearGradient
          colors={[colors.coral, colors.tangerine]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={[styles.heroBlob, styles.heroBlobOne, { backgroundColor: colors.marigold }]} />
          <View style={[styles.heroBlob, styles.heroBlobTwo, { backgroundColor: colors.teal }]} />
          <View style={styles.heroCopy}>
            <Text style={[styles.heroEyebrow, { color: colors.heroText }]}>BUGÜNÜN MERAĞI</Text>
            <Text style={[styles.heroTitle, { color: colors.softWhite }]}>Hangi dostun{'\n'}konuşsun?</Text>
            <View style={styles.heroHint}>
              <View style={[styles.heroHintDot, { backgroundColor: colors.marigold }]} />
              <Text style={[styles.heroHintText, { color: colors.heroText }]}>Bir hayvan seç, sesini dinle</Text>
            </View>
          </View>
          <View style={styles.heroFriends} pointerEvents="none">
            <View style={[styles.friendBack, { backgroundColor: colors.teal }]}>
              <AnimalMascot animal="cat" colors={colors} size={88} />
            </View>
            <View style={[styles.friendFront, { backgroundColor: colors.marigold }]}>
              <AnimalMascot animal="dog" colors={colors} size={112} />
            </View>
            <View style={[styles.sparkle, styles.sparkleOne, { backgroundColor: colors.whiteWarm }]}>
              <Feather name="star" size={10} color={colors.coral} />
            </View>
            <View style={[styles.sparkle, styles.sparkleTwo, { backgroundColor: colors.whiteWarm }]}>
              <Feather name="plus" size={12} color={colors.tealDeep} />
            </View>
          </View>
        </LinearGradient>
        <PetStrip />
        {/* Dostumun kartı */}
        {pet ? (
          <View style={[styles.petCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.petAvatar, { backgroundColor: colors.teal + '26' }]}>
              <AnimalMascot animal={pet.type} colors={colors} size={64} />
            </View>
            <View style={styles.petCopy}>
              <Text style={[styles.petKicker, { color: colors.tealDeep }]}>DOSTUM</Text>
              <Text style={[styles.petName, { color: colors.foreground }]}>{pet.name}</Text>
              {pet.breed ? (
                <Text style={[styles.petBreed, { color: colors.mutedForeground }]}>{pet.breed}</Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Hızlı butonlar */}
        <View style={styles.quickRow}>
          <Pressable
            testID="quick-listen"
            accessibilityRole="button"
            accessibilityLabel="Ne diyor?"
            onPress={() => openTranslate('listen')}
            style={({ pressed }) => [
              styles.quickButton,
              { backgroundColor: colors.coral, transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
          >
            <Feather name="mic" size={22} color={colors.primaryForeground} />
            <Text style={[styles.quickText, { color: colors.primaryForeground }]}>Ne diyor?</Text>
          </Pressable>
          <Pressable
            testID="quick-speak"
            accessibilityRole="button"
            accessibilityLabel="Bir şey söyle"
            onPress={() => openTranslate('speak')}
            style={({ pressed }) => [
              styles.quickButton,
              { backgroundColor: colors.teal, transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
          >
            <Feather name="message-circle" size={22} color={colors.primaryForeground} />
            <Text style={[styles.quickText, { color: colors.primaryForeground }]}>Bir şey söyle</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Bir dost seç</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>İlk cümlenizi birlikte bulalım.</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {animals.map((animal) => (
            <View key={animal.id} style={{ width: cardWidth }}>
              <AnimalCard
                animal={animal}
                colors={colors}
                selected={selectedId === animal.id}
                onPress={() => selectAnimal(animal)}
              />
            </View>
          ))}
        </View>

        {/* Biliyor muydun? (ortada, her 30 saniyede bir yenilenir) */}
        <LinearGradient
          colors={[colors.teal + '26', colors.marigold + '33']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.factCard, { borderColor: colors.border }]}
        >
          <View style={[styles.factOrb, styles.factOrbOne, { backgroundColor: colors.marigold }]} />
          <View style={[styles.factOrb, styles.factOrbTwo, { backgroundColor: colors.teal }]} />
          <View style={[styles.factEmojiCircle, { backgroundColor: colors.whiteWarm }]}>
            <Text style={styles.factEmoji}>{currentFact.emoji}</Text>
          </View>
          <Text style={[styles.factKicker, { color: colors.tealDeep }]}>BİLİYOR MUYDUN?</Text>
          <Animated.View style={[styles.factTextWrap, { opacity: factOpacity }]}>
            <Text style={[styles.factText, { color: colors.foreground }]}>{currentFact.text}</Text>
          </Animated.View>
          <View style={styles.factHintRow}>
            <View style={[styles.factHintDot, { backgroundColor: colors.coral }]} />
            <Text style={[styles.factHint, { color: colors.mutedForeground }]}>
              30 saniyede bir yeni bilgi
            </Text>
          </View>
        </LinearGradient>

        {/* Günlük bonus kartı (Premium kullanıcıda gösterilmez) */}
        {!isPremium ? (
          <View
            style={[
              styles.infoCard,
              styles.bonusCard,
              {
                backgroundColor: canClaimDailyBonus ? colors.marigold + '40' : colors.card,
                borderColor: canClaimDailyBonus ? colors.marigold : colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.infoIcon,
                { backgroundColor: canClaimDailyBonus ? colors.marigold : colors.muted },
              ]}
            >
              <Feather
                name={canClaimDailyBonus ? 'gift' : 'check'}
                size={20}
                color={canClaimDailyBonus ? colors.accentForeground : colors.mutedForeground}
              />
            </View>
            <View style={styles.infoCopy}>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>
                {canClaimDailyBonus ? 'Günlük bonus hazır!' : 'Bugünkü bonusunu aldın'}
              </Text>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {canClaimDailyBonus ? 'Bugünkü +1 jetonunu al.' : 'Yarın yeni bir jeton seni bekliyor.'}
              </Text>
            </View>
            {canClaimDailyBonus ? (
              <Pressable
                testID="claim-daily-bonus"
                accessibilityRole="button"
                accessibilityLabel="Günlük bonusu al"
                onPress={handleClaimBonus}
                style={({ pressed }) => [
                  styles.claimButton,
                  { backgroundColor: colors.coral, transform: [{ scale: pressed ? 0.94 : 1 }] },
                ]}
              >
                <Text style={[styles.claimText, { color: colors.primaryForeground }]}>Al</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  logo: {
    width: 43,
    height: 43,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoEar: {
    position: 'absolute',
    width: 13,
    height: 17,
    borderRadius: 9,
    top: 7,
  },
  logoEarLeft: {
    left: 7,
    transform: [{ rotate: '-23deg' }],
  },
  logoEarRight: {
    right: 7,
    transform: [{ rotate: '23deg' }],
  },
  logoFace: {
    width: 29,
    height: 27,
    borderRadius: 14,
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEye: {
    position: 'absolute',
    width: 4,
    height: 5,
    borderRadius: 4,
    left: 7,
    top: 8,
  },
  logoEyeRight: {
    left: undefined,
    right: 7,
  },
  logoMuzzle: {
    width: 9,
    height: 6,
    borderRadius: 5,
    marginTop: 11,
  },
  brandName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 19,
    letterSpacing: -0.5,
  },
  brandKicker: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.1,
    marginTop: 1,
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    shadowColor: themeColors.light.shadowHero,
    shadowOpacity: 0.08,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  creditIcon: {
    width: 26,
    height: 26,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditPlus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 16,
  },
  creditLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    lineHeight: 12,
  },
  hero: {
    minHeight: 226,
    borderRadius: 30,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
    paddingLeft: 22,
    paddingVertical: 24,
    marginBottom: 18,
    shadowColor: themeColors.light.shadowHero,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  heroCopy: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'center',
  },
  heroEyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1.8,
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -1.1,
  },
  heroHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 17,
  },
  heroHintDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
  },
  heroHintText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  heroFriends: {
    width: 151,
    alignSelf: 'stretch',
    position: 'relative',
  },
  friendBack: {
    position: 'absolute',
    width: 98,
    height: 98,
    borderRadius: 49,
    right: -5,
    top: 6,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
  },
  friendFront: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    right: 8,
    bottom: -23,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
    borderWidth: 5,
    borderColor: themeColors.light.overlayLine,
  },
  sparkle: {
    width: 23,
    height: 23,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  sparkleOne: {
    right: 9,
    top: 28,
    transform: [{ rotate: '15deg' }],
  },
  sparkleTwo: {
    right: 123,
    top: 34,
    transform: [{ rotate: '-15deg' }],
  },
  heroBlob: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.2,
  },
  heroBlobOne: {
    width: 170,
    height: 170,
    right: 37,
    top: -84,
  },
  heroBlobTwo: {
    width: 100,
    height: 100,
    left: -48,
    bottom: -54,
  },
  petCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  petAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petCopy: {
    flex: 1,
  },
  petKicker: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.4,
  },
  petName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  petBreed: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 2,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 26,
  },
  quickButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 3,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: -0.7,
  },
  sectionSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 13,
  },
  cardShadow: {
    shadowColor: themeColors.light.shadowWarm,
    shadowOpacity: 0.11,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    marginBottom: 1,
  },
  animalCard: {
    minHeight: 191,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 12,
    position: 'relative',
  },
  cardOrb: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    top: -31,
    right: -27,
  },
  mascotWrap: {
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  cardCopy: {
    zIndex: 2,
    paddingHorizontal: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  animalName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  animalSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 3,
  },
  selectedDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bonusCard: {
    marginTop: 22,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  infoText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  claimButton: {
    minWidth: 58,
    minHeight: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  claimText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  premiumCard: {
    marginTop: 14,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumCopy: {
    flex: 1,
  },
  premiumKicker: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.6,
    marginBottom: 7,
  },
  premiumTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.6,
  },
  premiumText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 8,
  },
  premiumArrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factCard: {
    marginTop: 26,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  factOrb: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.16,
  },
  factOrbOne: {
    width: 110,
    height: 110,
    top: -40,
    right: -30,
  },
  factOrbTwo: {
    width: 80,
    height: 80,
    bottom: -34,
    left: -26,
  },
  factEmojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  factEmoji: {
    fontSize: 32,
  },
  factKicker: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1.8,
    textAlign: 'center',
  },
  factTextWrap: {
    minHeight: 80,
    justifyContent: 'center',
    marginTop: 8,
  },
  factText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  factHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  factHintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  factHint: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
  },
});