import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
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
import themeColors from '@/constants/colors';
import { useColors } from '@/hooks/useColors';

type AnimalAccent = 'coral' | 'teal' | 'marigold' | 'lilac' | 'tangerine';
type AnimalId = 'dog' | 'cat' | 'cow' | 'chicken' | 'sheep' | 'goat';

type Animal = {
  id: AnimalId;
  name: string;
  subtitle: string;
  unlocked: boolean;
  accent: AnimalAccent;
  iconName: AnimalId;
};

type Palette = ReturnType<typeof useColors>;

const animals: Animal[] = [
  { id: 'dog', name: 'Köpek', subtitle: 'Neşeli hav hav', unlocked: true, accent: 'coral', iconName: 'dog' },
  { id: 'cat', name: 'Kedi', subtitle: 'Meraklı miyav', unlocked: true, accent: 'marigold', iconName: 'cat' },
  { id: 'cow', name: 'İnek', subtitle: 'Sıcacık möö', unlocked: false, accent: 'teal', iconName: 'cow' },
  { id: 'chicken', name: 'Tavuk', subtitle: 'Civcivli sohbet', unlocked: false, accent: 'tangerine', iconName: 'chicken' },
  { id: 'sheep', name: 'Koyun', subtitle: 'Yumuşak mee', unlocked: false, accent: 'lilac', iconName: 'sheep' },
  { id: 'goat', name: 'Keçi', subtitle: 'Şakacı mee-ee', unlocked: false, accent: 'teal', iconName: 'goat' },
];

const credits = { remaining: 12, total: 20 };
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
  muted = false,
}: {
  animal: AnimalId;
  colors: Palette;
  size?: number;
  muted?: boolean;
}) {
  const opacity = muted ? 0.58 : 1;
  const body = muted
    ? colors.locked
    : animal === 'dog'
      ? colors.coralLight
      : animal === 'cat'
        ? colors.marigold
        : animal === 'cow'
          ? colors.whiteWarm
          : animal === 'chicken'
            ? colors.marigold
            : animal === 'sheep'
              ? colors.whiteWarm
              : colors.tangerine;
  const ear = muted ? colors.locked : animal === 'dog' ? colors.tangerine : colors.coralLight;
  const spot = muted ? colors.lockedSurface : colors.coral;
  const ink = muted ? colors.lockedSurface : colors.inkSoft;
  const inner = muted ? colors.lockedSurface : colors.whiteWarm;

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
      <Circle cx="60" cy="60" r="54" fill={muted ? colors.lockedSurface : colors.whiteWarm} opacity={0.5} />
      {animal === 'dog' && (
        <>
          <Ellipse cx="28" cy="50" rx="17" ry="27" fill={ear} transform="rotate(22 28 50)" />
          <Ellipse cx="92" cy="50" rx="17" ry="27" fill={ear} transform="rotate(-22 92 50)" />
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
      {animal === 'cow' && (
        <>
          <Path d="M45 29 Q45 13 34 16 Q29 18 36 35" fill={body} />
          <Path d="M75 29 Q75 13 86 16 Q91 18 84 35" fill={body} />
          <Circle cx="60" cy="60" r="39" fill={body} />
          <Ellipse cx="44" cy="43" rx="10" ry="12" fill={spot} opacity={0.75} />
          <Ellipse cx="76" cy="67" rx="12" ry="9" fill={spot} opacity={0.65} />
          <Ellipse cx="60" cy="78" rx="21" ry="14" fill={inner} />
          {face}
          <Circle cx="52" cy="78" r="2.5" fill={spot} />
          <Circle cx="68" cy="78" r="2.5" fill={spot} />
          <Path d="M52 26 Q60 19 68 26" fill="none" stroke={colors.marigold} strokeWidth="4" strokeLinecap="round" opacity={opacity} />
        </>
      )}
      {animal === 'chicken' && (
        <>
          <Circle cx="60" cy="18" r="7" fill={colors.coral} />
          <Circle cx="51" cy="20" r="6" fill={colors.coral} />
          <Circle cx="69" cy="20" r="6" fill={colors.coral} />
          <Circle cx="60" cy="62" r="38" fill={body} />
          <Path d="M87 62 L105 70 L87 78" fill={colors.coral} />
          <Ellipse cx="60" cy="80" rx="18" ry="11" fill={inner} />
          {face}
          <Path d="M40 42 Q31 49 37 57" fill="none" stroke={colors.coralLight} strokeWidth="7" strokeLinecap="round" />
        </>
      )}
      {animal === 'sheep' && (
        <>
          <Circle cx="34" cy="48" r="15" fill={body} />
          <Circle cx="85" cy="48" r="15" fill={body} />
          <Circle cx="42" cy="32" r="13" fill={body} />
          <Circle cx="60" cy="28" r="15" fill={body} />
          <Circle cx="78" cy="32" r="13" fill={body} />
          <Circle cx="60" cy="62" r="34" fill={inner} />
          <Ellipse cx="60" cy="69" rx="25" ry="25" fill={body} />
          {face}
          <Path d="M42 94 Q60 104 78 94" fill="none" stroke={spot} strokeWidth="5" strokeLinecap="round" opacity={0.55} />
        </>
      )}
      {animal === 'goat' && (
        <>
          <Path d="M40 39 Q18 19 29 15 Q38 14 48 33" fill="none" stroke={body} strokeWidth="8" strokeLinecap="round" />
          <Path d="M80 39 Q102 19 91 15 Q82 14 72 33" fill="none" stroke={body} strokeWidth="8" strokeLinecap="round" />
          <Circle cx="60" cy="62" r="38" fill={body} />
          <Path d="M50 28 L60 18 L70 28" fill={colors.whiteWarm} opacity={0.8} />
          <Ellipse cx="60" cy="80" rx="17" ry="13" fill={inner} />
          {face}
          <Path d="M48 91 Q60 101 72 91" fill="none" stroke={spot} strokeWidth="4" strokeLinecap="round" opacity={0.6} />
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
        accessibilityLabel={`${animal.name}${animal.unlocked ? '' : ', kilitli'}`}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.animalCard,
          { backgroundColor: animal.unlocked ? colors.card : colors.lockedSurface },
          selected && { borderColor: accent, borderWidth: 2 },
        ]}
      >
        <View style={[styles.cardOrb, { backgroundColor: accent, opacity: animal.unlocked ? 0.18 : 0.14 }]} />
        <View style={styles.mascotWrap}>
          <AnimalMascot animal={animal.iconName} colors={colors} size={104} muted={!animal.unlocked} />
        </View>
        <View style={styles.cardCopy}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.animalName, { color: animal.unlocked ? colors.foreground : colors.mutedForeground }]}>
              {animal.name}
            </Text>
            {animal.unlocked ? (
              selected ? (
                <View style={[styles.selectedDot, { backgroundColor: accent }]}>
                  <Feather name="check" size={12} color={colors.whiteWarm} />
                </View>
              ) : null
            ) : (
              <View style={[styles.lockDot, { backgroundColor: colors.locked }]}>
                <Feather name="lock" size={11} color={colors.whiteWarm} />
              </View>
            )}
          </View>
          <Text style={[styles.animalSubtitle, { color: animal.unlocked ? colors.mutedForeground : colors.locked }]}>
            {animal.subtitle}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function TabOneScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<AnimalId>('dog');
  const [lockedAnimal, setLockedAnimal] = useState<Animal | null>(null);
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === 'web' ? Math.max(insets.bottom, 34) : insets.bottom;
  const cardWidth = screenWidth < 380 ? '47.5%' : '48%';

  const selectAnimal = (animal: Animal) => {
    if (!animal.unlocked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLockedAnimal(animal);
      return;
    }
    Haptics.selectionAsync();
    setSelectedId(animal.id);
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
                {credits.remaining} / {credits.total}
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
            <Text style={[styles.heroEyebrow, { color: colors.heroText }]}>BUGÜNÜN MERAKI</Text>
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
          <View style={[styles.openCount, { backgroundColor: colors.teal + '20' }]}>
            <Text style={[styles.openCountText, { color: colors.tealDeep }]}>2 açık</Text>
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

        <View style={[styles.footerNote, { backgroundColor: colors.lilac + '1A' }]}>
          <View style={[styles.footerIcon, { backgroundColor: colors.lilac }]}>
            <Feather name="heart" size={15} color={colors.whiteWarm} />
          </View>
          <View style={styles.footerCopy}>
            <Text style={[styles.footerTitle, { color: colors.lilacDeep }]}>Daha çok dost yolda</Text>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Çiftlik ekibi yakında oyun alanına katılıyor.
            </Text>
          </View>
          <Feather name="chevron-right" size={19} color={colors.lilacDeep} />
        </View>
      </ScrollView>

      <Modal
        visible={lockedAnimal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setLockedAnimal(null)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.foreground + '66' }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalTop, { backgroundColor: colors.teal + '20' }]}>
              {lockedAnimal ? <AnimalMascot animal={lockedAnimal.iconName} colors={colors} size={128} muted /> : null}
              <View style={[styles.modalLock, { backgroundColor: colors.marigold }]}>
                <Feather name="lock" size={16} color={colors.accentForeground} />
              </View>
            </View>
            <Text style={[styles.modalEyebrow, { color: colors.tealDeep }]}>YENİ BİR DOST</Text>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {lockedAnimal?.name} birazdan burada!
            </Text>
            <Text style={[styles.modalText, { color: colors.mutedForeground }]}>
              Premium ile çiftlik ekibinin seslerini de keşfet. Şimdilik bu küçük sır aramızda kalsın.
            </Text>
            <Pressable
              testID="locked-animal-dismiss"
              accessibilityRole="button"
              accessibilityLabel="Bilgilendirmeyi kapat"
              onPress={() => setLockedAnimal(null)}
              style={({ pressed }) => [
                styles.modalButton,
                { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
            >
              <Text style={[styles.modalButtonText, { color: colors.primaryForeground }]}>Anladım</Text>
              <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
            </Pressable>
            <Pressable
              testID="locked-animal-close"
              accessibilityRole="button"
              accessibilityLabel="Pencereyi kapat"
              onPress={() => setLockedAnimal(null)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeText, { color: colors.mutedForeground }]}>Şimdilik sonra</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  openCount: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  openCountText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
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
  lockDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNote: {
    minHeight: 70,
    borderRadius: 21,
    marginTop: 22,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  footerIcon: {
    width: 37,
    height: 37,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCopy: {
    flex: 1,
  },
  footerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  footerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 15,
    paddingBottom: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 31,
    padding: 18,
    paddingBottom: 17,
    alignItems: 'center',
    shadowColor: themeColors.light.shadowDeep,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9,
  },
  modalTop: {
    width: '100%',
    height: 152,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 18,
  },
  modalLock: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEyebrow: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.7,
    fontSize: 10,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 23,
    letterSpacing: -0.7,
    textAlign: 'center',
    marginTop: 7,
  },
  modalText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 320,
    marginTop: 8,
  },
  modalButton: {
    width: '100%',
    minHeight: 53,
    borderRadius: 18,
    marginTop: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: themeColors.light.shadowHero,
    shadowOpacity: 0.19,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  modalButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  closeButton: {
    minHeight: 31,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});