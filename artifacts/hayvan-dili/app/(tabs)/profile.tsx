import { useRouter } from 'expo-router';
import React from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { displayName, updateDisplayName, language, toggleLanguage, creditsRemaining, creditsTotal, isPremium, creditHistory } = useApp();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === 'web' ? Math.max(insets.bottom, 34) : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: topInset + 12, paddingBottom: bottomInset + 105 }}>
        <View style={styles.header}>
          <Pressable testID="profile-back" onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card }]}>
            <Feather name="arrow-left" size={21} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profil ve ayarlar</Text>
          <View style={{ width: 43 }} />
        </View>

        <View style={[styles.profileHero, { backgroundColor: colors.lilac + '22' }]}>
          <View style={[styles.avatar, { backgroundColor: colors.lilac }]}>
            <Ionicons name="paw" size={27} color={colors.primaryForeground} />
          </View>
          <View style={styles.profileCopy}>
            <Text style={[styles.hello, { color: colors.lilacDeep }]}>MERHABA!</Text>
            <Text style={[styles.profileTitle, { color: colors.foreground }]}>{displayName || 'Minik dost'}</Text>
            <Text style={[styles.profileText, { color: colors.mutedForeground }]}>Hayvan arkadaşların seni özledi.</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Senin bilgilerin</Text>
        <View style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>İsim</Text>
          <TextInput
            testID="profile-name-input"
            value={displayName}
            onChangeText={updateDisplayName}
            placeholder="Adını yaz"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.fieldInput, { color: colors.foreground }]}
            returnKeyType="done"
          />
        </View>

        <Pressable testID="language-toggle" onPress={toggleLanguage} style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.settingIcon, { backgroundColor: colors.teal + '25' }]}>
            <Ionicons name="language" size={20} color={colors.tealDeep} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={[styles.settingTitle, { color: colors.foreground }]}>Uygulama dili</Text>
            <Text style={[styles.settingText, { color: colors.mutedForeground }]}>Mesajlarını hangi dilde görmek istersin?</Text>
          </View>
          <View style={[styles.languagePill, { backgroundColor: colors.teal }]}>
            <Text style={[styles.languageText, { color: colors.primaryForeground }]}>{language}</Text>
          </View>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 26 }]}>Kredi özeti</Text>
        <View style={[styles.creditCard, { backgroundColor: colors.marigold + '38' }]}>
          <View style={[styles.creditIcon, { backgroundColor: colors.marigold }]}>
            <Feather name="star" size={20} color={colors.accentForeground} />
          </View>
          <View style={styles.creditCopy}>
            <Text style={[styles.creditTitle, { color: colors.accentForeground }]}>{isPremium ? 'Sınırsız dostluk' : `${creditsRemaining} / ${creditsTotal} kredi kaldı`}</Text>
            <Text style={[styles.creditText, { color: colors.inkSoft }]}>{isPremium ? 'Premium açık, dilediğin kadar konuşabilirsin.' : 'Hakların her gün minik bir tazelenmeyle yenilenir.'}</Text>
          </View>
        </View>

        <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: colors.foreground }]}>Son hareketler</Text>
            <Text style={[styles.historyCount, { color: colors.mutedForeground }]}>{creditHistory.length} kayıt</Text>
          </View>
          {creditHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Feather name="message-circle" size={19} color={colors.lilacDeep} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>İlk çevirini yaptığında burada göreceksin.</Text>
            </View>
          ) : (
            creditHistory.slice(0, 3).map((timestamp) => (
              <View key={timestamp} style={styles.historyRow}>
                <View style={[styles.historyDot, { backgroundColor: colors.coral }]} />
                <Text style={[styles.historyText, { color: colors.mutedForeground }]}>Bir dostla konuşuldu</Text>
                <Text style={[styles.historyDate, { color: colors.mutedForeground }]}>{new Date(timestamp).toLocaleDateString('tr-TR')}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 19 },
  backButton: { width: 43, height: 43, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  profileHero: { marginHorizontal: 20, borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 62, height: 62, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  profileCopy: { flex: 1 },
  hello: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.5 },
  profileTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, marginTop: 3 },
  profileText: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  sectionTitle: { marginHorizontal: 20, fontFamily: 'Inter_700Bold', fontSize: 19, marginTop: 27, marginBottom: 10 },
  fieldCard: { marginHorizontal: 20, borderRadius: 19, borderWidth: 1, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 7 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  fieldInput: { fontFamily: 'Inter_600SemiBold', fontSize: 15, minHeight: 33, paddingVertical: 2 },
  settingRow: { marginHorizontal: 20, marginTop: 11, borderRadius: 19, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingIcon: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  settingCopy: { flex: 1 },
  settingTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  settingText: { fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 14, marginTop: 2 },
  languagePill: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7 },
  languageText: { fontFamily: 'Inter_700Bold', fontSize: 10 },
  creditCard: { marginHorizontal: 20, borderRadius: 20, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  creditIcon: { width: 43, height: 43, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  creditCopy: { flex: 1 },
  creditTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  creditText: { fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 14, marginTop: 3 },
  historyCard: { marginHorizontal: 20, marginTop: 13, borderRadius: 20, borderWidth: 1, padding: 14 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  historyTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  historyCount: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  emptyHistory: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 9 },
  emptyText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  historyDot: { width: 7, height: 7, borderRadius: 4 },
  historyText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11 },
  historyDate: { fontFamily: 'Inter_500Medium', fontSize: 10 },
});