import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

import { AnimalMascot, animalInfo, type AnimalId, type MascotPalette } from '@/components/AnimalMascot';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const lockedAnimals: AnimalId[] = ['cow', 'chicken', 'sheep', 'goat'];

function BenefitRow({ icon, title, text, colors }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; colors: MascotPalette }) {
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPremium, activatePremium } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === 'web' ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: topInset + 12, paddingBottom: bottomInset + 104 }}>
        <View style={styles.header}>
          <Pressable testID="premium-back" onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card }]}>
            <Feather name="arrow-left" size={21} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Premium dostluk</Text>
          <View style={{ width: 43 }} />
        </View>

        <LinearGradient colors={[colors.lilacDeep, colors.coral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={[styles.heroBubble, styles.heroBubbleOne, { backgroundColor: colors.marigold }]} />
          <View style={[styles.heroBubble, styles.heroBubbleTwo, { backgroundColor: colors.teal }]} />
          <View style={styles.heroCopy}>
            <Text style={[styles.heroKicker, { color: colors.heroText }]}>DAHA ÇOK OYUN</Text>
            <Text style={[styles.heroTitle, { color: colors.softWhite }]}>Bütün dostların{'\n'}seni bekliyor!</Text>
            <Text style={[styles.heroText, { color: colors.softWhite }]}>Hayvan Dili ailesinin tamamını aç, her gün sınırsız konuş.</Text>
          </View>
          <View style={styles.heroMascots}>
            <View style={[styles.mascotBack, { backgroundColor: colors.teal }]}><AnimalMascot animal="sheep" colors={colors} size={75} muted /></View>
            <View style={[styles.mascotFront, { backgroundColor: colors.marigold }]}><AnimalMascot animal="cow" colors={colors} size={94} /></View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Premium ile neler geliyor?</Text>
          <BenefitRow icon="paw-outline" title="4 yeni dost" text="İnek, tavuk, koyun ve keçi hemen açılır." colors={colors} />
          <BenefitRow icon="infinite-outline" title="Sınırsız kredi" text="Dostlarınla dilediğin kadar sesli sohbet et." colors={colors} />
          <BenefitRow icon="sparkles-outline" title="Özel cümleler" text="Her hayvanın daha büyük ve komik sözlüğünü keşfet." colors={colors} />

          <View style={[styles.friendGrid, { backgroundColor: colors.lilac + '1A' }]}>
            {lockedAnimals.map((id) => (
              <View key={id} style={styles.friendItem}>
                <View style={[styles.friendCircle, { backgroundColor: colors.card }]}>
                  <AnimalMascot animal={id} colors={colors} size={66} />
                </View>
                <Text style={[styles.friendName, { color: colors.foreground }]}>{animalInfo[id].name}</Text>
              </View>
            ))}
          </View>

          <Pressable
            testID="premium-cta"
            accessibilityRole="button"
            onPress={() => isPremium ? null : setShowConfirm(true)}
            style={({ pressed }) => [styles.cta, { backgroundColor: isPremium ? colors.teal : colors.coral, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <Ionicons name={isPremium ? 'checkmark-circle' : 'sparkles'} size={22} color={colors.primaryForeground} />
            <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>{isPremium ? 'Premium aktif' : 'Premium dost ol'}</Text>
            {!isPremium ? <Feather name="arrow-right" size={20} color={colors.primaryForeground} /> : null}
          </Pressable>
          <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>Bu demo akışında ödeme alınmaz. Gerçek ödeme daha sonra eklenecek.</Text>
        </View>
      </ScrollView>

      <Modal visible={showConfirm} transparent animationType="fade" onRequestClose={() => setShowConfirm(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: colors.foreground + '66' }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIcon, { backgroundColor: colors.marigold }]}>
              <Ionicons name="sparkles" size={28} color={colors.accentForeground} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Dost ekibi hazır!</Text>
            <Text style={[styles.modalText, { color: colors.mutedForeground }]}>Demo Premium'u açarak bütün hayvanları ve sınırsız krediyi hemen deneyebilirsin.</Text>
            <Pressable testID="premium-confirm" onPress={() => { activatePremium(); setShowConfirm(false); }} style={[styles.modalButton, { backgroundColor: colors.coral }]}>
              <Text style={[styles.modalButtonText, { color: colors.primaryForeground }]}>Hepsini aç</Text>
              <Feather name="unlock" size={18} color={colors.primaryForeground} />
            </Pressable>
            <Pressable testID="premium-cancel" onPress={() => setShowConfirm(false)} style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Şimdilik değil</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backButton: { width: 43, height: 43, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 19 },
  hero: { marginHorizontal: 20, minHeight: 205, borderRadius: 30, overflow: 'hidden', padding: 22, flexDirection: 'row', alignItems: 'center' },
  heroBubble: { position: 'absolute', borderRadius: 100, opacity: 0.22 },
  heroBubbleOne: { width: 170, height: 170, top: -72, right: 6 },
  heroBubbleTwo: { width: 110, height: 110, bottom: -46, left: -33 },
  heroCopy: { flex: 1, zIndex: 1 },
  heroKicker: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.6, marginBottom: 9 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 27, lineHeight: 31, letterSpacing: -0.8 },
  heroText: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16, maxWidth: 195, marginTop: 10 },
  heroMascots: { width: 116, height: 165, position: 'relative' },
  mascotBack: { position: 'absolute', width: 84, height: 84, borderRadius: 42, top: 0, right: 0, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '10deg' }] },
  mascotFront: { position: 'absolute', width: 112, height: 112, borderRadius: 56, bottom: -1, left: 0, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fffaf344', transform: [{ rotate: '-8deg' }] },
  content: { paddingHorizontal: 20, paddingTop: 27 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, letterSpacing: -0.5, marginBottom: 9 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 },
  benefitIcon: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  benefitCopy: { flex: 1 },
  benefitTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  benefitText: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 15, marginTop: 2 },
  friendGrid: { borderRadius: 22, marginTop: 19, padding: 13, flexDirection: 'row', justifyContent: 'space-between' },
  friendItem: { alignItems: 'center', flex: 1 },
  friendCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  friendName: { fontFamily: 'Inter_700Bold', fontSize: 10, marginTop: 6 },
  cta: { minHeight: 57, borderRadius: 20, marginTop: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, shadowColor: '#c75841', shadowOpacity: 0.22, shadowRadius: 11, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  ctaText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  disclaimer: { textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 15, marginTop: 10, paddingHorizontal: 14 },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', padding: 15 },
  modalCard: { width: '100%', maxWidth: 500, borderRadius: 29, padding: 21, alignItems: 'center' },
  modalIcon: { width: 60, height: 60, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, marginTop: 14 },
  modalText: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7, maxWidth: 320 },
  modalButton: { width: '100%', minHeight: 52, borderRadius: 18, marginTop: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalButtonText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  cancelButton: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 14 },
  cancelText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});