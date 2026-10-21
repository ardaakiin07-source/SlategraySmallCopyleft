import React, { useRef, useState } from 'react';
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

type AnimalAccent = 'coral' | 'marigold';
type AnimalId = 'dog' | 'cat';

type Animal = {
  id: AnimalId;
  name: string;
  subtitle: string;
  accent: AnimalAccent;
  iconName: AnimalId;
};

type Palette = ReturnType<typeof useColors>;

const animals: Animal[] = [
  { id: 'dog', name: 'Köpek', subtitle: 'Neşeli hav hav', accent: 'coral', iconName: 'dog' },
  { id: 'cat', name: 'Kedi', subtitle: 'Meraklı miyav', accent: 'marigold', iconName: 'cat' },
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
  const { creditsRemaining, creditsTotal, isPremium } = useApp();
  const [selectedId, setSelectedId] = useState<AnimalId>('dog');
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === 'web' ? Math.max(insets.bottom, 34) : insets.bottom;
  const cardWidth = screenWidth < 380 ? '47.5%' : '48%';

  const selectAnimal = (animal: Animal) => {
    Haptics.selectionAsync();
    setSelectedId(animal.id);
    router.push({ pathname: '/translate', params: { animalId: animal.id } });
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
          <View testID="credit-badge" style={[styles.creditBadge, { backgroundColor: colors.whiteWarm, borderColor: colors.border }]}>
            <View style={[styles.creditIcon, { backgroundColor: colors.marigold }]}>
              <Feather name="star" size={13} color={colors.accentForeground} />
            </View>
            <View>
              <Text style={[styles.creditValue, { color: colors.foreground }]}>
                {isPremium ? '∞' : `${creditsRemaining} / ${creditsTotal}`}
              </Text>
              <Text style={[styles.creditLabel, { color: colors.mutedForeground }]}>kredi</Text>
            </View>
          </View>
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
    marginBottom: 29,
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
});