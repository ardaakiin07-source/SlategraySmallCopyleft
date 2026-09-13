import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimalMascot, animalInfo, type AnimalId, type MascotPalette } from '@/components/AnimalMascot';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const validAnimalIds: AnimalId[] = ['dog', 'cat', 'cow', 'chicken', 'sheep', 'goat'];

const MICROPHONE_PERMISSION_MESSAGE = 'Mikrofon izni verilmedi. Ses analizi için mikrofon erişimini açmalısın.';
const SHORT_RECORDING_MESSAGE = 'Bu sesi analiz etmek için biraz daha uzun bir kayıt gerekiyor.';

const toneForMessage = (text: string) => {
  const normalized = text.toLocaleLowerCase('tr-TR');
  if (normalized.includes('oyna') || normalized.includes('eğlen')) return 'oyuncu';
  if (normalized.includes('dur') || normalized.includes('hayır') || normalized.includes('yapma')) return 'uyarı';
  if (normalized.includes('sakin') || normalized.includes('korkma')) return 'sakinleştirici';
  return 'sevgi dolu';
};

function Pulse({ colors, active }: { colors: MascotPalette; active: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [active, pulse]);

  const ringStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
  };

  return (
    <View pointerEvents="none" style={styles.pulseLayer}>
      <Animated.View style={[styles.pulseRing, { borderColor: colors.marigold }, ringStyle]} />
      <Animated.View style={[styles.pulseRing, styles.pulseRingInner, { borderColor: colors.teal }, ringStyle]} />
    </View>
  );
}

function ModeSwitch({
  mode,
  onChange,
  colors,
}: {
  mode: 'listen' | 'speak';
  onChange: (mode: 'listen' | 'speak') => void;
  colors: MascotPalette;
}) {
  return (
    <View style={[styles.modeSwitch, { backgroundColor: colors.muted }]}>
      <Pressable
        testID="mode-listen"
        accessibilityRole="button"
        onPress={() => onChange('listen')}
        style={[styles.modeButton, mode === 'listen' && { backgroundColor: colors.coral }]}
      >
        <Ionicons name="ear-outline" size={20} color={mode === 'listen' ? colors.primaryForeground : colors.mutedForeground} />
        <Text style={[styles.modeText, { color: mode === 'listen' ? colors.primaryForeground : colors.mutedForeground }]}>
          Ne diyor?
        </Text>
      </Pressable>
      <Pressable
        testID="mode-speak"
        accessibilityRole="button"
        onPress={() => onChange('speak')}
        style={[styles.modeButton, mode === 'speak' && { backgroundColor: colors.teal }]}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={20} color={mode === 'speak' ? colors.primaryForeground : colors.mutedForeground} />
        <Text style={[styles.modeText, { color: mode === 'speak' ? colors.primaryForeground : colors.mutedForeground }]}>
          Bir şey söyle
        </Text>
      </Pressable>
    </View>
  );
}

export default function TranslateScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ animalId?: string }>();
  const { consumeCredit, creditsRemaining, isPremium } = useApp();
  const animalId = validAnimalIds.includes(params.animalId as AnimalId) ? (params.animalId as AnimalId) : 'dog';
  const animal = animalInfo[animalId];
  const [mode, setMode] = useState<'listen' | 'speak'>('listen');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [translation, setTranslation] = useState('');
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState('');
  const soundRef = useRef<Audio.Sound | null>(null);
  const nativeRecordingRef = useRef<Audio.Recording | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingStartingRef = useRef(false);

  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === 'web' ? Math.max(insets.bottom, 34) : insets.bottom;
  const helperText = useMemo(
    () => (mode === 'listen' ? `${animal.name} seni dinliyor, hazır olduğunda dokun.` : `${animal.name} mesajını duyunca uygun bir ses çıkaracak.`),
    [animal.name, mode],
  );

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => undefined);
      nativeRecordingRef.current?.stopAndUnloadAsync().catch(() => undefined);
      nativeRecordingRef.current = null;
    };
  }, []);

  const startRecording = async () => {
    if (isRecording || isAnalyzing || nativeRecordingRef.current || recordingStartingRef.current) return;

    if (Platform.OS === 'web') {
      setFeedback('Gerçek ses kaydı iOS ve Android cihazlarda kullanılabilir.');
      return;
    }

    recordingStartingRef.current = true;
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setFeedback(MICROPHONE_PERMISSION_MESSAGE);
        return;
      }

      if (!isPremium && creditsRemaining <= 0) {
        setFeedback('Bugünkü ücretsiz hakların bitti. Daha çok konuşmak için Premium dostluğa geçebilirsin.');
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const nextRecording = new Audio.Recording();
      await nextRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await nextRecording.startAsync();

      nativeRecordingRef.current = nextRecording;
      recordingStartedAtRef.current = Date.now();
      setTranslation('');
      setFeedback('');
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      nativeRecordingRef.current = null;
      recordingStartedAtRef.current = null;
      setIsRecording(false);
      setFeedback('Kayıt başlatılamadı. Lütfen tekrar dene.');
      console.error('[Hayvan Dili] Kayıt başlatma hatası:', error);
    } finally {
      recordingStartingRef.current = false;
    }
  };

  const stopRecording = async () => {
    const recording = nativeRecordingRef.current;
    if (!isRecording || isAnalyzing || !recording) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAnalyzing(true);

    const startedAt = recordingStartedAtRef.current;
    const elapsedMillis = startedAt ? Date.now() - startedAt : 0;

    try {
      const status = await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const durationMillis = status.durationMillis || elapsedMillis;

      nativeRecordingRef.current = null;
      recordingStartedAtRef.current = null;
      setIsRecording(false);
      setIsAnalyzing(false);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }).catch(() => undefined);

      if (!uri) {
        setFeedback('Kayıt dosyası oluşturulamadı. Lütfen tekrar dene.');
        return;
      }

      console.log('[Hayvan Dili] Native kayıt dosyası oluşturuldu:', {
        uri,
        durationMillis,
      });

      if (durationMillis < 1000) {
        setTranslation('');
        setFeedback(SHORT_RECORDING_MESSAGE);
        return;
      }

      if (!isPremium && !consumeCredit()) {
        setTranslation('');
        setFeedback('Bugünkü ücretsiz hakların bitti. Daha çok konuşmak için Premium dostluğa geçebilirsin.');
        return;
      }

      setFeedback('');
      setTranslation(`Kayıt tamamlandı, dosya: ${uri}`);
    } catch (error) {
      nativeRecordingRef.current = null;
      recordingStartedAtRef.current = null;
      setIsRecording(false);
      setIsAnalyzing(false);
      console.error('[Hayvan Dili] Kayıt durdurma hatası:', error);

      if (elapsedMillis < 1000) {
        setFeedback(SHORT_RECORDING_MESSAGE);
      } else {
        setFeedback('Kayıt durdurulamadı. Lütfen tekrar dene.');
      }
    }
  };

  const playReaction = async () => {
    try {
      await soundRef.current?.unloadAsync();
      const { sound } = await Audio.Sound.createAsync(require('../../assets/audio/pet-reaction.wav'));
      soundRef.current = sound;
      await sound.playAsync();
      setTimeout(() => setIsPlaying(false), 1200);
    } catch {
      setTimeout(() => setIsPlaying(false), 1000);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || isPlaying) {
      if (!message.trim()) setFeedback('Dostuna söylemek istediğin cümleyi yaz.');
      return;
    }
    if (!isPremium && !consumeCredit()) {
      setFeedback('Bugünkü ücretsiz hakların bitti. Premium ile sınırsız konuşabilirsin.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFeedback('');
    setTone(toneForMessage(message));
    setIsPlaying(true);
    await playReaction();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topInset + 10, paddingBottom: bottomInset + 110 }}
      >
        <View style={styles.header}>
          <Pressable
            testID="translate-back"
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card }]}
          >
            <Feather name="arrow-left" size={21} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerKicker, { color: colors.tealDeep }]}>DOSTUNLA KONUŞ</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>{animal.name}</Text>
          </View>
          <View style={[styles.smallCredit, { backgroundColor: colors.marigold }]}>
            <Feather name="star" size={13} color={colors.accentForeground} />
            <Text style={[styles.smallCreditText, { color: colors.accentForeground }]}>{isPremium ? '∞' : creditsRemaining}</Text>
          </View>
        </View>

        <LinearGradient colors={[colors.teal, colors.lilac]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.animalHero}>
          <View style={[styles.heroCircle, { backgroundColor: colors.whiteWarm }]} />
          <View style={styles.animalHeroCopy}>
            <Text style={[styles.animalHeroEyebrow, { color: colors.heroText }]}>BUGÜNÜN DOSTU</Text>
            <Text style={[styles.animalHeroTitle, { color: colors.softWhite }]}>{animal.name} hazır!</Text>
            <Text style={[styles.animalHeroText, { color: colors.softWhite }]}>{helperText}</Text>
          </View>
          <View style={styles.heroMascot}>
            <AnimalMascot animal={animalId} colors={colors} size={118} />
          </View>
        </LinearGradient>

        <ModeSwitch mode={mode} onChange={(nextMode) => { setMode(nextMode); setTranslation(''); setTone(''); setFeedback(''); }} colors={colors} />

        {mode === 'listen' ? (
          <View style={styles.modeContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Bir ses kaydet</Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>Sesini duyunca sana tatlı bir tahminde bulunacak.</Text>
            <View style={styles.recordStage}>
              <Pulse colors={colors} active={isRecording} />
              <Pressable
                testID="record-button"
                accessibilityRole="button"
                accessibilityLabel={isRecording ? 'Kaydı bitir' : 'Ses kaydını başlat'}
                onPress={isRecording ? stopRecording : startRecording}
                style={({ pressed }) => [
                  styles.recordButton,
                  { backgroundColor: isRecording ? colors.coral : colors.teal, transform: [{ scale: pressed ? 0.93 : 1 }] },
                ]}
              >
                <Ionicons name={isRecording ? 'stop' : 'mic'} size={40} color={colors.primaryForeground} />
              </Pressable>
              <Text style={[styles.recordLabel, { color: colors.foreground }]}>
                {isAnalyzing ? 'Dostun düşünüyor…' : isRecording ? 'Dinliyorum…' : 'Dokun ve konuş'}
              </Text>
              <Text style={[styles.recordSubtext, { color: colors.mutedForeground }]}>
                {isAnalyzing ? 'Minik kulaklar mesajını çözüyor' : 'İstediğin kadar kısa ve komik olabilir'}
              </Text>
              {isAnalyzing ? <ActivityIndicator color={colors.coral} style={styles.loader} /> : null}
            </View>
            {translation ? (
              <View style={[styles.resultBubble, { backgroundColor: colors.card, borderColor: colors.coral }]}>
                <View style={[styles.resultMascot, { backgroundColor: colors.coral + '24' }]}>
                  <AnimalMascot animal={animalId} colors={colors} size={82} />
                </View>
                <View style={styles.resultCopy}>
                  <Text style={[styles.resultKicker, { color: colors.coral }]}>ÇEVİRİ GELDİ</Text>
                  <Text style={[styles.resultText, { color: colors.foreground }]}>{translation}</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.modeContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dostuna ne söylemek istersin?</Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>Mesajının tonunu sezsin ve ona göre cevap versin.</Text>
            <View style={[styles.messageBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                testID="pet-message-input"
                value={message}
                onChangeText={setMessage}
                placeholder="Örn. Seni çok seviyorum!"
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={[styles.input, { color: colors.foreground }]}
                textAlignVertical="top"
              />
              <View style={styles.inputFooter}>
                <Text style={[styles.inputHint, { color: colors.mutedForeground }]}>Sevgi dolu, oyuncu veya sakin olabilir.</Text>
                <Pressable
                  testID="send-pet-message"
                  accessibilityRole="button"
                  accessibilityLabel="Mesajı hayvana gönder"
                  onPress={sendMessage}
                  style={({ pressed }) => [styles.sendButton, { backgroundColor: colors.coral, transform: [{ scale: pressed ? 0.94 : 1 }] }]}
                >
                  <Ionicons name="volume-high" size={21} color={colors.primaryForeground} />
                </Pressable>
              </View>
            </View>
            {isPlaying ? (
              <View style={[styles.listeningCard, { backgroundColor: colors.teal + '1C' }]}>
                <View style={[styles.listeningDot, { backgroundColor: colors.teal }]} />
                <AnimalMascot animal={animalId} colors={colors} size={60} />
                <View style={styles.listeningCopy}>
                  <Text style={[styles.listeningTitle, { color: colors.tealDeep }]}>{animal.name} dinliyor…</Text>
                  <Text style={[styles.listeningText, { color: colors.mutedForeground }]}>Minik sesini hazırlıyorum</Text>
                </View>
                <ActivityIndicator color={colors.tealDeep} />
              </View>
            ) : null}
            {tone ? (
              <View style={[styles.toneCard, { backgroundColor: colors.marigold + '35' }]}>
                <Feather name="star" size={18} color={colors.accentForeground} />
                <Text style={[styles.toneText, { color: colors.accentForeground }]}>Mesajın {tone} bir tonda algılandı. Ses hazır!</Text>
              </View>
            ) : null}
          </View>
        )}

        {feedback ? (
          <View style={[styles.feedback, { backgroundColor: colors.coral + '18' }]}>
            <Feather name="info" size={16} color={colors.coral} />
            <Text style={[styles.feedbackText, { color: colors.coral }]}>{feedback}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  backButton: { width: 43, height: 43, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#332827', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  headerCenter: { alignItems: 'center' },
  headerKicker: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.4 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, marginTop: 2 },
  smallCredit: { minWidth: 43, height: 34, borderRadius: 14, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  smallCreditText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  animalHero: { marginHorizontal: 20, minHeight: 158, borderRadius: 28, overflow: 'hidden', flexDirection: 'row', padding: 18, alignItems: 'center' },
  heroCircle: { position: 'absolute', width: 180, height: 180, borderRadius: 90, right: -54, top: -50, opacity: 0.22 },
  animalHeroCopy: { flex: 1, zIndex: 1 },
  animalHeroEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.5, marginBottom: 6 },
  animalHeroTitle: { fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: -0.8 },
  animalHeroText: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16, marginTop: 7, maxWidth: 180 },
  heroMascot: { width: 124, height: 124, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffaf340', borderRadius: 62 },
  modeSwitch: { marginHorizontal: 20, marginTop: 19, padding: 5, borderRadius: 21, flexDirection: 'row', gap: 5 },
  modeButton: { flex: 1, minHeight: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  modeText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  modeContent: { paddingHorizontal: 20, paddingTop: 27 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.6 },
  sectionHint: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18, marginTop: 5 },
  recordStage: { minHeight: 300, alignItems: 'center', justifyContent: 'center', marginTop: 7, position: 'relative' },
  pulseLayer: { position: 'absolute', width: 170, height: 170, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 142, height: 142, borderRadius: 71, borderWidth: 3 },
  pulseRingInner: { width: 118, height: 118, borderRadius: 59, borderWidth: 2 },
  recordButton: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', shadowColor: '#168c91', shadowOpacity: 0.28, shadowRadius: 15, shadowOffset: { width: 0, height: 9 }, elevation: 7 },
  recordLabel: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 22 },
  recordSubtext: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 4 },
  loader: { marginTop: 13 },
  resultBubble: { borderRadius: 24, borderWidth: 1.5, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#704b3e', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  resultMascot: { width: 82, height: 82, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  resultCopy: { flex: 1 },
  resultKicker: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.1, marginBottom: 5 },
  resultText: { fontFamily: 'Inter_700Bold', fontSize: 16, lineHeight: 22 },
  messageBox: { minHeight: 182, borderRadius: 24, borderWidth: 1, padding: 14, marginTop: 22, shadowColor: '#704b3e', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  input: { flex: 1, minHeight: 105, fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 22 },
  inputFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  inputHint: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 14 },
  sendButton: { width: 49, height: 49, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#c75841', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  listeningCard: { minHeight: 80, borderRadius: 22, marginTop: 17, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  listeningDot: { width: 9, height: 9, borderRadius: 5, marginLeft: 2 },
  listeningCopy: { flex: 1 },
  listeningTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  listeningText: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  toneCard: { minHeight: 50, borderRadius: 17, marginTop: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  toneText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 17 },
  feedback: { marginHorizontal: 20, marginTop: 18, borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  feedbackText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 17 },
});