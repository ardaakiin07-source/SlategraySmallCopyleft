import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimalMascot, type MascotPalette } from '@/components/AnimalMascot';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

// ---- PAKET AYARLARI (buradan değiştirebilirsin) ----
const PRICE_TEXT = '₺349,99';
const TRIAL_DAYS = 7;
// ----------------------------------------------------

type ModalContent = {
  title: string;
  text: string;
  testMode?: boolean;
};

function BenefitRow({
  icon,
  title,
  text,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  colors: MascotPalette;
}) {
  return (
    <View style={styles.benefitRow}>
      <View style={[styles.benefitIcon, { backgroundColor: colors.marigold }]}>
        <Ionicons name={icon} size={19} color={colors.accentForeground} />
      </View>
      <View style={styles.benefitCopy}>
        <Text style={[styles.benefitTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.benefitText, { color: colors.mutedForeground }]}>{text}</Text>
      </View>
      <Feather name="check" size={19} color={colors.tealDeep} />
    </View>
  );
}

export default function PremiumScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPremium, activatePremium, creditsRemaining } = useApp();
  const [modal, setModal] = useState<ModalContent | null>(null);
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === 'web' ? Math.max(insets.bottom, 34) : insets.bottom;
  const storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

  const handleStart = () => {
    if (isPremium) return;
    if (__DEV__) {
      // Sadece geliştirme sırasında: ödeme almadan Premium'u test etmek için
      setModal({
        title: 'Test modu',
        text: 'Bu mesaj sadece geliştirme sürümünde görünür. Ödeme alınmaz, Premium test için açılır.',
        testMode: true,
      });
    } else {
      setModal({
        title: 'Çok yakında',
        text: 'Abonelik satın alma çok yakında aktif olacak.',
      });
    }
  };

  const handleRestore = () => {
    setModal({
      title: 'Çok yakında',
      text: 'Satın alımları geri yükleme, abonelik aktif olunca çalışacak.',
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topInset + 12, paddingBottom: bottomInset + 104 }}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Premium</Text>
          {!isPremium ? (
            <View style={[styles.tokenPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="star" size={14} color={colors.coral} />
              <Text style={[styles.tokenText, { color: colors.foreground }]}>
                {creditsRemaining} jeton
              </Text>
            </View>
          ) : null}
        </View>

        <LinearGradient
          colors={[colors.lilacDeep, colors.coral]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={[styles.heroBubble, styles.heroBubbleOne, { backgroundColor: colors.marigold }]} />
          <View style={[styles.heroBubble, styles.heroBubbleTwo, { backgroundColor: colors.teal }]} />
          <View style={styles.heroCopy}>
            <Text style={[styles.heroKicker, { color: colors.heroText }]}>
              {TRIAL_DAYS} GÜN ÜCRETSİZ DENE
            </Text>
            <Text style={[styles.heroTitle, { color: colors.softWhite }]}>
              Dostunla sınırsız{'\n'}sohbet et!
            </Text>
            <Text style={[styles.heroText, { color: colors.softWhite }]}>
              Jeton derdi yok, istediğin kadar konuş.
            </Text>
          </View>
          <View style={styles.heroMascots}>
            <View style={[styles.mascotBack, { backgroundColor: colors.teal }]}>
              <AnimalMascot animal="cat" colors={colors} size={75} />
            </View>
            <View style={[styles.mascotFront, { backgroundColor: colors.marigold }]}>
              <AnimalMascot animal="dog" colors={colors} size={94} />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Büyük önerilen paket kartı */}
          <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.coral }]}>
            <View style={[styles.planBadge, { backgroundColor: colors.coral }]}>
              <Ionicons name="sparkles" size={13} color={colors.primaryForeground} />
              <Text style={[styles.planBadgeText, { color: colors.primaryForeground }]}>ÖNERİLEN</Text>
            </View>
            <Text style={[styles.planName, { color: colors.foreground }]}>	Aylık Sınırsız</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.foreground }]}>{PRICE_TEXT}</Text>
              <Text style={[styles.priceUnit, { color: colors.mutedForeground }]}> / ay</Text>
            </View>
            <View style={[styles.trialPill, { backgroundColor: colors.marigold }]}>
              <Text style={[styles.trialText, { color: colors.accentForeground }]}>
                İlk {TRIAL_DAYS} gün ücretsiz
              </Text>
            </View>

            <View style={styles.benefits}>
              <BenefitRow
                icon="infinite-outline"
                title="Sınırsız analiz ve sohbet"
                text="Jeton harcamadan dilediğin kadar konuş."
                colors={colors}
              />
              <BenefitRow
                icon="ban-outline"
                title="%100 reklamsız"
                text="Hiçbir ekranda reklam görmezsin."
                colors={colors}
              />
              <BenefitRow
                icon="pulse-outline"
                title="Dostunun takip sistemi"
                text="Su, mama ve bakım zamanlarını kolayca takip et."
                colors={colors}
              />
              <BenefitRow
                icon="paw-outline"
                title="Birden fazla evcil hayvan"
                text="Hepsi için ayrı profil oluştur."
                colors={colors}
              />
            </View>
          </View>

          <Pressable
            testID="premium-cta"
            accessibilityRole="button"
            onPress={handleStart}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: isPremium ? colors.teal : colors.coral,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Ionicons
              name={isPremium ? 'checkmark-circle' : 'sparkles'}
              size={22}
              color={colors.primaryForeground}
            />
            <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
              {isPremium ? 'Premium aktif' : `${TRIAL_DAYS} gün ücretsiz başla`}
            </Text>
            {!isPremium ? (
              <Feather name="arrow-right" size={20} color={colors.primaryForeground} />
            ) : null}
          </Pressable>

          {!isPremium ? (
            <>
              <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
                {TRIAL_DAYS} günlük ücretsiz denemeden sonra ayda {PRICE_TEXT} tahsil edilir.
                İptal etmezseniz abonelik her ay otomatik olarak yenilenir. İstediğiniz zaman{' '}
                {storeName} hesap ayarlarından iptal edebilirsiniz.
              </Text>
              <Pressable onPress={handleRestore} style={styles.restoreButton}>
                <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>
                  Satın alımları geri yükle
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={modal !== null} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.foreground + '66' }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIcon, { backgroundColor: colors.marigold }]}>
              <Ionicons name="sparkles" size={28} color={colors.accentForeground} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{modal?.title}</Text>
            <Text style={[styles.modalText, { color: colors.mutedForeground }]}>{modal?.text}</Text>
            {modal?.testMode ? (
              <Pressable
                testID="premium-confirm"
                onPress={() => {
                  activatePremium();
                  setModal(null);
                }}
                style={[styles.modalButton, { backgroundColor: colors.coral }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.primaryForeground }]}>
                  Test için Premium'u aç
                </Text>
                <Feather name="unlock" size={18} color={colors.primaryForeground} />
              </Pressable>
            ) : null}
            <Pressable testID="premium-cancel" onPress={() => setModal(null)} style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                {modal?.testMode ? 'Vazgeç' : 'Tamam'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  tokenText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  hero: {
    marginHorizontal: 20,
    minHeight: 205,
    borderRadius: 30,
    overflow: 'hidden',
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBubble: { position: 'absolute', borderRadius: 100, opacity: 0.22 },
  heroBubbleOne: { width: 170, height: 170, top: -72, right: 6 },
  heroBubbleTwo: { width: 110, height: 110, bottom: -46, left: -33 },
  heroCopy: { flex: 1, zIndex: 1 },
  heroKicker: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.6, marginBottom: 9 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 27, lineHeight: 31, letterSpacing: -0.8 },
  heroText: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16, maxWidth: 195, marginTop: 10 },
  heroMascots: { width: 116, height: 165, position: 'relative' },
  mascotBack: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    top: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '10deg' }],
  },
  mascotFront: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    bottom: -1,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fffaf344',
    transform: [{ rotate: '-8deg' }],
  },
  content: { paddingHorizontal: 20, paddingTop: 27 },
  planCard: {
    borderRadius: 28,
    borderWidth: 2.5,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 12,
    alignItems: 'center',
  },
  planBadge: {
    position: 'absolute',
    top: -14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  planBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.2 },
  planName: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  price: { fontFamily: 'Inter_700Bold', fontSize: 40, letterSpacing: -1.2 },
  priceUnit: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  trialPill: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14 },
  trialText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  benefits: { width: '100%', marginTop: 16 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 },
  benefitIcon: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  benefitCopy: { flex: 1 },
  benefitTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  benefitText: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 15, marginTop: 2 },
  cta: {
    minHeight: 57,
    borderRadius: 20,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: '#c75841',
    shadowOpacity: 0.22,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ctaText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  disclaimer: {
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 10,
    paddingHorizontal: 8,
  },
  restoreButton: { alignSelf: 'center', minHeight: 36, justifyContent: 'center', paddingHorizontal: 14, marginTop: 4 },
  restoreText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, textDecorationLine: 'underline' },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', padding: 15 },
  modalCard: { width: '100%', maxWidth: 500, borderRadius: 29, padding: 21, alignItems: 'center' },
  modalIcon: { width: 60, height: 60, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, marginTop: 14 },
  modalText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 320,
  },
  modalButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 18,
    marginTop: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalButtonText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  cancelButton: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 14, marginTop: 6 },
  cancelText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});