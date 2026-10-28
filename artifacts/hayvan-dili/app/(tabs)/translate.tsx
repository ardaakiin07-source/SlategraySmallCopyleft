import { File } from 'expo-file-system';
import {
  AudioModule,
  RecordingPresets,
  createAudioPlayer,
  setAudioModeAsync,
  useAudioRecorder,
  type AudioPlayer,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
import { animalAnalysis } from '@workspace/api-client-react';

import { AnimalMascot, animalInfo, type AnimalId, type MascotPalette } from '@/components/AnimalMascot';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const validAnimalIds: AnimalId[] = ['dog', 'cat'];

const ANIMAL_EMOJI: Record<string, string> = { dog: '🐶', cat: '🐱' };

const MICROPHONE_PERMISSION_MESSAGE = 'Mikrofon izni verilmedi. Ses analizi için mikrofon erişimini açmalısın.';
const SHORT_RECORDING_MESSAGE = 'Bu sesi analiz etmek için biraz daha uzun bir kayıt gerekiyor.';
const NO_CREDIT_MESSAGE = 'Jetonların bitti. Aşağıdaki butondan yeni jeton alabilirsin.';
const ANALYSIS_ERROR_MESSAGES: Record<string, string> = {
  INVALID_ANIMAL: 'Bu hayvan için analiz yapılamadı. Lütfen dostunu tekrar seç.',
  INVALID_FILE_TYPE: 'Bu ses dosyası desteklenmiyor. Lütfen tekrar kayıt yap.',
  FILE_TOO_LARGE: 'Kayıt çok uzun. Lütfen daha kısa bir ses kaydet.',
  AI_ANALYSIS_FAILED: 'Dostun şu an sesini çözemedi. Lütfen tekrar dene.',
};

type Phrase = {
  id: string;
  emoji: string;
  text: string;
  tone: string;
};

// Hazır cümleler: birine basınca direkt çevrilir
const QUICK_PHRASES: Phrase[] = [
  { id: 'love', emoji: '❤️', text: 'Seni çok seviyorum', tone: 'sevgi dolu' },
  { id: 'hungry', emoji: '🍖', text: 'Karnın aç mı?', tone: 'meraklı' },
  { id: 'thirsty', emoji: '🥛', text: 'Susadın mı?', tone: 'meraklı' },
  { id: 'walk', emoji: '🚶', text: 'Yürüyüşe çıkalım mı?', tone: 'neşeli' },
  { id: 'play', emoji: '🎾', text: 'Oyun oynayalım mı?', tone: 'oyuncu' },
  { id: 'sleepy', emoji: '😴', text: 'Uykun geldi mi?', tone: 'sakinleştirici' },
  { id: 'home', emoji: '🏠', text: 'Eve geldim!', tone: 'neşeli' },
  { id: 'morning', emoji: '👋', text: 'Günaydın', tone: 'neşeli' },
  { id: 'night', emoji: '🌙', text: 'İyi geceler', tone: 'sakinleştirici' },
  { id: 'good', emoji: '😊', text: 'Aferin sana!', tone: 'sevgi dolu' },
  { id: 'what', emoji: '🙈', text: 'Ne yaptın sen?', tone: 'şaşkın' },
  { id: 'treat', emoji: '🍪', text: 'Ödül ister misin?', tone: 'neşeli' },
  { id: 'bath', emoji: '🛁', text: 'Banyo zamanı', tone: 'neşeli' },
  { id: 'miss', emoji: '🥺', text: 'Beni özledin mi?', tone: 'sevgi dolu' },
  { id: 'hug', emoji: '🤗', text: 'Gel buraya, sarılalım', tone: 'sevgi dolu' },
  { id: 'calm', emoji: '🙏', text: 'Lütfen sakin ol', tone: 'sakinleştirici' },
  { id: 'trip', emoji: '🚗', text: 'Gezmeye gidiyoruz', tone: 'neşeli' },
  { id: 'hurt', emoji: '🩺', text: 'Canın bir yerde mi acıyor?', tone: 'şefkatli' },
  { id: 'paw', emoji: '🐾', text: 'Pati ver bakalım', tone: 'oyuncu' },
  { id: 'bed', emoji: '💤', text: 'Hadi yatağına', tone: 'sakinleştirici' },
];

const STEPS = ['Kaydet', 'Dinle', 'Çevir'];

const toneForMessage = (text: string) => {
  const normalized = text.toLocaleLowerCase('tr-TR');
  if (normalized.includes('oyna') || normalized.includes('eğlen')) return 'oyuncu';
  if (normalized.includes('dur') || normalized.includes('hayır') || normalized.includes('yapma')) return 'uyarı';
  if (normalized.includes('sakin') || normalized.includes('korkma')) return 'sakinleştirici';
  return 'sevgi dolu';
};

function getAnalysisErrorCode(error: unknown) {
  if (!error || typeof error !== 'object') return null;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;
  const code = (data as { error?: unknown }).error;
  return typeof code === 'string' ? code : null;
}

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

function StepIndicator({ active, colors }: { active: number; colors: MascotPalette }) {
  return (
    <View style={styles.stepsRow}>
      {STEPS.map((label, index) => {
        const done = index < active;
        const current = index === active;
        const filled = done || current;
        return (
          <React.Fragment key={label}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  { backgroundColor: filled ? colors.coral : colors.muted },
                ]}
              >
                {done ? (
                  <Feather name="check" size={12} color={colors.primaryForeground} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      { color: filled ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  { color: filled ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {label}
              </Text>
            </View>
            {index < STEPS.length - 1 ? (
              <View
                style={[
                  styles.stepLine,
                  { backgroundColor: done ? colors.coral : colors.border },
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const REACTION_SOUNDS: Record<string, number[]> = {
  dog: [
    require('../../assets/audio/dog1.mp3'),
    require('../../assets/audio/dog2.mp3'),
    require('../../assets/audio/dog3.mp3'),
    require('../../assets/audio/dog4.mp3'),
    require('../../assets/audio/dog5.mp3'),
    require('../../assets/audio/dog6.mp3'),
    require('../../assets/audio/dog7.mp3'),
    require('../../assets/audio/dog8.mp3'),
require('../../assets/audio/dog9.mp3'),
require('../../assets/audio/dog10.mp3'),
require('../../assets/audio/dog11.mp3'),
require('../../assets/audio/dog12.mp3'),
require('../../assets/audio/dog13.mp3'),
  ],
  cat: [
    require('../../assets/audio/cat1.mp3'),
    require('../../assets/audio/cat2.mp3'),
    require('../../assets/audio/cat3.mp3'),
    require('../../assets/audio/cat4.mp3'),
    require('../../assets/audio/cat5.mp3'),
    require('../../assets/audio/cat6.mp3'),
    require('../../assets/audio/cat7.mp3'),
    require('../../assets/audio/cat8.mp3'),
require('../../assets/audio/cat9.mp3'),
require('../../assets/audio/cat10.mp3'),
require('../../assets/audio/cat11.mp3'),
require('../../assets/audio/cat12.mp3'),
require('../../assets/audio/cat13.mp3'),
  ],
};

function pickSound(sounds: number[], text: string) {
  const clean = text.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) % 1000003;
  }
  return sounds[hash % sounds.length];
}

export default function TranslateScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ animalId?: string; mode?: string; t?: string }>();
  const { consumeCredit, creditsRemaining, isPremium, hapticsEnabled } = useApp();
  const [animalId, setAnimalId] = useState<AnimalId>(
    validAnimalIds.includes(params.animalId as AnimalId) ? (params.animalId as AnimalId) : 'dog',
  );
  const animal = animalInfo[animalId];
  const [mode, setMode] = useState<'listen' | 'speak'>('listen');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [translation, setTranslation] = useState('');
  const [analysisMood, setAnalysisMood] = useState('');
  const [disclaimer, setDisclaimer] = useState('');
  const [message, setMessage] = useState('');
  const [sentText, setSentText] = useState('');
  const [tone, setTone] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState('');
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const playerRef = useRef<AudioPlayer | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingStartingRef = useRef(false);

  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === 'web' ? Math.max(insets.bottom, 34) : insets.bottom;

  // Titreşim: Ayarlar'daki düğmeye göre çalışır
  const impact = (style: Haptics.ImpactFeedbackStyle) => {
    if (hapticsEnabled) Haptics.impactAsync(style);
  };
  const notify = (type: Haptics.NotificationFeedbackType) => {
    if (hapticsEnabled) Haptics.notificationAsync(type);
  };
  const select = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
  };

  const phase: 'idle' | 'recording' | 'ready' | 'analyzing' = isAnalyzing
    ? 'analyzing'
    : isRecording
      ? 'recording'
      : recordedUri
        ? 'ready'
        : 'idle';

  const phaseText = {
    idle: { label: 'Dokun ve kaydet', sub: `${animal.name} sesini çıkarırken mikrofona dokun` },
    recording: { label: 'Dinliyorum…', sub: 'Bitirince kareye dokun' },
    ready: { label: 'Kayıt hazır!', sub: 'Önce dinleyebilir, sonra çevirebilirsin' },
    analyzing: { label: 'Dostun düşünüyor…', sub: 'Biraz sürebilir' },
  }[phase];

  const activeStep = phase === 'ready' ? 1 : phase === 'analyzing' ? 2 : translation ? 3 : 0;

  // Ana sayfadan gelen seçim: hangi hayvan
  useEffect(() => {
    if (params.animalId && validAnimalIds.includes(params.animalId as AnimalId)) {
      setAnimalId(params.animalId as AnimalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.animalId, params.t]);

  // Ana sayfadaki hızlı butonlardan gelen seçim: hangi sekme
  useEffect(() => {
    if ((params.mode === 'listen' || params.mode === 'speak') && !isRecording && !isAnalyzing) {
      setMode(params.mode);
      setTranslation('');
      setTone('');
      setFeedback('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.mode, params.t]);

  useEffect(() => {
    return () => {
      try {
        playerRef.current?.remove();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
  }, []);

  // Ton kartı birkaç saniye sonra kendiliğinden kaybolur
  useEffect(() => {
    if (!tone || isPlaying) return;
    const timer = setTimeout(() => setTone(''), 4000);
    return () => clearTimeout(timer);
  }, [tone, isPlaying]);

  // Uyarı kartı birkaç saniye sonra kaybolur (jeton uyarısı hariç)
  useEffect(() => {
    if (!feedback || feedback === NO_CREDIT_MESSAGE) return;
    const timer = setTimeout(() => setFeedback(''), 6000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const startRecording = async () => {
    if (isRecording || isAnalyzing || recordingStartingRef.current) return;

    if (Platform.OS === 'web') {
      setFeedback('Gerçek ses kaydı iOS ve Android cihazlarda kullanılabilir.');
      return;
    }

    recordingStartingRef.current = true;
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setFeedback(MICROPHONE_PERMISSION_MESSAGE);
        return;
      }

      if (!isPremium && creditsRemaining <= 0) {
        setFeedback(NO_CREDIT_MESSAGE);
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();

      recordingStartedAtRef.current = Date.now();
      setRecordedUri(null);
      setTranslation('');
      setAnalysisMood('');
      setDisclaimer('');
      setFeedback('');
      setIsRecording(true);
      impact(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      recordingStartedAtRef.current = null;
      setIsRecording(false);
      setFeedback('Kayıt başlatılamadı. Lütfen tekrar dene.');
      console.error('[Hayvan Dili] Kayıt başlatma hatası:', error);
    } finally {
      recordingStartingRef.current = false;
    }
  };

  // Kayıt durdurulur, çeviri yapılmaz. Çeviri "Çevir" butonuyla başlar.
  const stopRecording = async () => {
    if (!isRecording) return;

    impact(Haptics.ImpactFeedbackStyle.Light);

    const startedAt = recordingStartedAtRef.current;
    const elapsedMillis = startedAt ? Date.now() - startedAt : 0;

    try {
      await recorder.stop();
      const uri = recorder.uri;
      const durationMillis = recorder.getStatus().durationMillis || elapsedMillis;

      recordingStartedAtRef.current = null;
      setIsRecording(false);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);

      if (!uri) {
        setFeedback('Kayıt dosyası oluşturulamadı. Lütfen tekrar dene.');
        return;
      }

      if (durationMillis < 1000) {
        setFeedback(SHORT_RECORDING_MESSAGE);
        return;
      }

      setFeedback('');
      setRecordedUri(uri);
    } catch (error) {
      recordingStartedAtRef.current = null;
      setIsRecording(false);
      console.error('[Hayvan Dili] Kayıt durdurma hatası:', error);
      setFeedback(elapsedMillis < 1000 ? SHORT_RECORDING_MESSAGE : 'Kayıt durdurulamadı. Lütfen tekrar dene.');
    }
  };

  const discardRecording = () => {
    if (isAnalyzing) return;
    impact(Haptics.ImpactFeedbackStyle.Light);
    try {
      playerRef.current?.remove();
    } catch {
      // ignore
    }
    playerRef.current = null;
    setRecordedUri(null);
    setFeedback('');
  };

  // Kullanıcı kendi kaydını tekrar dinler (jeton harcamaz)
  const playRecording = () => {
    if (!recordedUri || isAnalyzing) return;
    impact(Haptics.ImpactFeedbackStyle.Light);
    try {
      playerRef.current?.remove();
      const player = createAudioPlayer({ uri: recordedUri });
      playerRef.current = player;
      player.play();
    } catch (error) {
      setFeedback('Kayıt çalınamadı. Lütfen tekrar dene.');
      console.error('[Hayvan Dili] Kayıt çalma hatası:', error);
    }
  };

  const translateRecording = async () => {
    if (!recordedUri || isAnalyzing) return;

    if (!isPremium && creditsRemaining <= 0) {
      setFeedback(NO_CREDIT_MESSAGE);
      return;
    }

    impact(Haptics.ImpactFeedbackStyle.Medium);
    setIsAnalyzing(true);
    setFeedback('');

    try {
      const audio = new File(recordedUri);
      const response = await animalAnalysis({
        audio: audio as unknown as Blob,
        animalId,
        locale: 'tr',
      });

      if (!response.interpretation || !response.mood) {
        throw new Error('Animal analysis response is incomplete');
      }

      if (!isPremium) {
        consumeCredit();
      }

      setTranslation(response.interpretation);
      setAnalysisMood(response.mood);
      setDisclaimer(response.disclaimer ?? '');
      setRecordedUri(null);
    } catch (error) {
      const errorCode = getAnalysisErrorCode(error);
      setFeedback(
        (errorCode && ANALYSIS_ERROR_MESSAGES[errorCode]) || 'Ses analizi başarısız oldu. Lütfen tekrar dene.',
      );
      console.error('[Hayvan Dili] Backend analiz hatası:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const playReaction = async (text: string) => {
    try {
      playerRef.current?.remove();
      const sounds = REACTION_SOUNDS[animalId];
      const source = sounds ? pickSound(sounds, text) : require('../../assets/audio/pet-reaction.wav');
      const player = createAudioPlayer(source);
      playerRef.current = player;
      player.play();
      setTimeout(() => setIsPlaying(false), 1200);
    } catch {
      setTimeout(() => setIsPlaying(false), 1000);
    }
  };

  // Hazır cümleye ya da yazılan cümleye basınca çalışır
  const sendMessage = async (text: string, presetTone?: string) => {
    const clean = text.trim();
    if (!clean) {
      setFeedback('Dostuna söylemek istediğin cümleyi yaz.');
      return;
    }
    if (isPlaying) return;
    if (!isPremium && !consumeCredit()) {
      setFeedback(NO_CREDIT_MESSAGE);
      return;
    }
    notify(Haptics.NotificationFeedbackType.Success);
    setFeedback('');
    setSentText(clean);
    setTone(presetTone ?? toneForMessage(clean));
    setIsPlaying(true);
    await playReaction(clean);
  };

  const changeMode = (nextMode: 'listen' | 'speak') => {
    if (isRecording || isAnalyzing) return;
    select();
    setMode(nextMode);
    setTranslation('');
    setRecordedUri(null);
    setTone('');
    setFeedback('');
  };

  const changeAnimal = (nextId: AnimalId) => {
    if (isRecording || isAnalyzing || nextId === animalId) return;
    select();
    setAnimalId(nextId);
    setTranslation('');
    setTone('');
    setFeedback('');
  };

  const goHome = () => {
    select();
    router.navigate('/');
  };

  const openPremium = () => {
    select();
    router.push('/premium');
  };

  const hasMessage = message.trim().length > 0;
  const activePhrase = isPlaying || tone ? sentText : '';
  const noCredit = feedback === NO_CREDIT_MESSAGE;
  const showToast = !feedback && mode === 'speak' && (isPlaying || !!tone);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingTop: topInset + 10, paddingBottom: bottomInset + 150 }}
      >
        <View style={styles.header}>
          <Pressable
            testID="translate-back"
            accessibilityRole="button"
            accessibilityLabel="Ana sayfaya dön"
            onPress={goHome}
            style={[styles.backButton, { backgroundColor: colors.card }]}
          >
            <Feather name="arrow-left" size={21} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerKicker, { color: colors.tealDeep }]}>DOSTUNLA KONUŞ</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Hayvan Çeviri</Text>
          </View>
          <Pressable
            testID="translate-credit"
            accessibilityRole="button"
            accessibilityLabel="Jeton al"
            onPress={openPremium}
            style={({ pressed }) => [
              styles.smallCredit,
              { backgroundColor: colors.marigold, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="star" size={13} color={colors.accentForeground} />
            <Text style={[styles.smallCreditText, { color: colors.accentForeground }]}>
              {isPremium ? '∞' : creditsRemaining}
            </Text>
            <Feather name="plus" size={12} color={colors.accentForeground} />
          </Pressable>
        </View>

        {/* Dostum ve karşılama */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.mascotCircle, { backgroundColor: colors.teal + '26' }]}>
            <AnimalMascot animal={animalId} colors={colors} size={84} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>Merhaba! 👋</Text>
            <Text style={[styles.heroText, { color: colors.mutedForeground }]}>
              {mode === 'listen'
                ? `${animal.name} sesini kaydet, ne dediğini birlikte öğrenelim.`
                : `${animal.name} dostuna bir şey söyle, hemen cevap versin.`}
            </Text>
          </View>
        </View>

        {/* Hayvan seçimi */}
        <View style={styles.animalRow}>
          {validAnimalIds.map((id) => {
            const active = animalId === id;
            return (
              <Pressable
                key={id}
                testID={`translate-animal-${id}`}
                accessibilityRole="button"
                accessibilityLabel={animalInfo[id].name}
                onPress={() => changeAnimal(id)}
                style={({ pressed }) => [
                  styles.animalPill,
                  {
                    backgroundColor: active ? colors.coral : colors.card,
                    borderColor: active ? colors.coral : colors.border,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                <Text style={styles.animalPillEmoji}>{ANIMAL_EMOJI[id]}</Text>
                <Text
                  style={[
                    styles.animalPillText,
                    { color: active ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {animalInfo[id].name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ModeSwitch mode={mode} onChange={changeMode} colors={colors} />

        {mode === 'listen' ? (
          <View style={styles.modeContent}>
            <StepIndicator active={activeStep} colors={colors} />
            <View style={styles.recordStage}>
              {phase === 'ready' ? (
                <View style={styles.readyStage}>
                  <Pressable
                    testID="translate-button"
                    accessibilityRole="button"
                    accessibilityLabel="Çevir"
                    onPress={() => void translateRecording()}
                    style={({ pressed }) => [
                      styles.translateCta,
                      { backgroundColor: colors.coral, transform: [{ scale: pressed ? 0.96 : 1 }] },
                    ]}
                  >
                    <Ionicons name="sparkles" size={22} color={colors.primaryForeground} />
                    <Text style={[styles.ctaLabel, { color: colors.primaryForeground }]}>Çevir</Text>
                  </Pressable>
                  <View style={styles.readyActions}>
                    <Pressable
                      testID="play-recording-button"
                      accessibilityRole="button"
                      accessibilityLabel="Kaydı dinle"
                      onPress={playRecording}
                      style={[styles.secondaryButton, { backgroundColor: colors.muted }]}
                    >
                      <Feather name="play" size={17} color={colors.foreground} />
                      <Text style={[styles.secondaryText, { color: colors.foreground }]}>Dinle</Text>
                    </Pressable>
                    <Pressable
                      testID="discard-button"
                      accessibilityRole="button"
                      accessibilityLabel="Yeniden kaydet"
                      onPress={discardRecording}
                      style={[styles.secondaryButton, { backgroundColor: colors.muted }]}
                    >
                      <Feather name="rotate-ccw" size={17} color={colors.foreground} />
                      <Text style={[styles.secondaryText, { color: colors.foreground }]}>Yeniden kaydet</Text>
                    </Pressable>
                  </View>
                </View>
              ) : phase === 'analyzing' ? (
                <View style={styles.analyzingBox}>
                  <ActivityIndicator size="large" color={colors.coral} />
                </View>
              ) : (
                <View style={styles.micWrap}>
                  <Pulse colors={colors} active={isRecording} />
                  <Pressable
                    testID="record-button"
                    accessibilityRole="button"
                    accessibilityLabel={isRecording ? 'Kaydı bitir' : 'Ses kaydını başlat'}
                    onPress={isRecording ? stopRecording : startRecording}
                    style={({ pressed }) => [
                      styles.mainButton,
                      { backgroundColor: isRecording ? colors.coral : colors.teal, transform: [{ scale: pressed ? 0.93 : 1 }] },
                    ]}
                  >
                    <Ionicons name={isRecording ? 'stop' : 'mic'} size={40} color={colors.primaryForeground} />
                  </Pressable>
                </View>
              )}
              <Text style={[styles.recordLabel, { color: colors.foreground }]}>{phaseText.label}</Text>
              <Text style={[styles.recordSubtext, { color: colors.mutedForeground }]}>{phaseText.sub}</Text>
            </View>

            {translation ? (
              <View style={[styles.resultBubble, { backgroundColor: colors.card, borderColor: colors.coral }]}>
                <Text style={[styles.resultKicker, { color: colors.coral }]}>
                  ÇEVİRİ GELDİ{analysisMood ? ` · ${analysisMood.toLocaleUpperCase('tr-TR')}` : ''}
                </Text>
                <Text style={[styles.resultText, { color: colors.foreground }]}>{translation}</Text>
                {disclaimer ? (
                  <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>{disclaimer}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.modeContent}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hızlı cümleler</Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              Birine dokun, {animal.name.toLocaleLowerCase('tr-TR')} dostun hemen cevap versin.
            </Text>

            <View style={styles.phraseGrid}>
              {QUICK_PHRASES.map((phrase) => {
                const active = activePhrase === phrase.text;
                return (
                  <Pressable
                    key={phrase.id}
                    testID={`phrase-${phrase.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={phrase.text}
                    disabled={isPlaying}
                    onPress={() => void sendMessage(phrase.text, phrase.tone)}
                    style={({ pressed }) => [
                      styles.phraseChip,
                      {
                        backgroundColor: active ? colors.teal + '2A' : colors.card,
                        borderColor: active ? colors.teal : colors.border,
                        opacity: isPlaying && !active ? 0.55 : 1,
                        transform: [{ scale: pressed ? 0.96 : 1 }],
                      },
                    ]}
                  >
                    <Text style={styles.phraseEmoji}>{phrase.emoji}</Text>
                    <Text style={[styles.phraseText, { color: colors.foreground }]}>{phrase.text}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, styles.ownTitle, { color: colors.foreground }]}>
              Kendi cümleni yaz
            </Text>
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
                <Text style={[styles.inputHint, { color: colors.mutedForeground }]}>
                  Sevgi dolu, oyuncu veya sakin olabilir.
                </Text>
              </View>
            </View>
            <Pressable
              testID="send-pet-message"
              accessibilityRole="button"
              accessibilityLabel="Mesajı hayvan diline çevir"
              onPress={() => void sendMessage(message)}
              disabled={isPlaying}
              style={({ pressed }) => [
                styles.speakCta,
                {
                  backgroundColor: hasMessage ? colors.coral : colors.muted,
                  opacity: isPlaying ? 0.6 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <Ionicons
                name="volume-high"
                size={22}
                color={hasMessage ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.ctaLabel,
                  { color: hasMessage ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                Çevir
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Ekranın altında beliren küçük kart: uyarı ya da sonuç */}
      {feedback ? (
        <View
          pointerEvents="box-none"
          style={[styles.floating, { bottom: bottomInset + 68 }]}
        >
          <View style={[styles.floatingCard, { backgroundColor: colors.card, borderColor: colors.coral }]}>
            <View style={styles.floatingRow}>
              <Feather name="info" size={16} color={colors.coral} />
              <Text style={[styles.feedbackText, { color: colors.foreground }]}>{feedback}</Text>
              <Pressable
                testID="feedback-close"
                accessibilityRole="button"
                accessibilityLabel="Kapat"
                onPress={() => setFeedback('')}
                hitSlop={10}
              >
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
            {noCredit ? (
              <Pressable
                testID="feedback-buy"
                accessibilityRole="button"
                accessibilityLabel="Jeton al"
                onPress={openPremium}
                style={({ pressed }) => [
                  styles.buyButton,
                  { backgroundColor: colors.coral, transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <Feather name="shopping-bag" size={16} color={colors.primaryForeground} />
                <Text style={[styles.buyText, { color: colors.primaryForeground }]}>Jeton Al</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : showToast ? (
        <View
          pointerEvents="none"
          style={[styles.floating, { bottom: bottomInset + 68 }]}
        >
          <View style={[styles.floatingCard, { backgroundColor: colors.card, borderColor: colors.teal }]}>
            {isPlaying ? (
              <View style={styles.floatingRow}>
                <AnimalMascot animal={animalId} colors={colors} size={44} />
                <View style={styles.floatingCopy}>
                  <Text style={[styles.listeningTitle, { color: colors.tealDeep }]}>{animal.name} dinliyor…</Text>
                  <Text numberOfLines={1} style={[styles.listeningText, { color: colors.mutedForeground }]}>
                    “{sentText}”
                  </Text>
                </View>
                <ActivityIndicator color={colors.tealDeep} />
              </View>
            ) : (
              <View style={styles.floatingRow}>
                <Feather name="star" size={18} color={colors.tealDeep} />
                <Text style={[styles.toneText, { color: colors.foreground }]}>
                  Mesajın {tone} bir tonda algılandı. Ses hazır!
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 },
  backButton: { width: 43, height: 43, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#332827', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  headerCenter: { alignItems: 'center' },
  headerKicker: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.4 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, marginTop: 2 },
  smallCredit: { minWidth: 43, height: 34, borderRadius: 14, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
  smallCreditText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  heroCard: { marginHorizontal: 20, borderRadius: 26, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  mascotCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.4 },
  heroText: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19, marginTop: 4 },
  animalRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 12, marginBottom: 14 },
  animalPill: { flex: 1, minHeight: 50, borderRadius: 18, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  animalPillEmoji: { fontSize: 20 },
  animalPillText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  modeSwitch: { marginHorizontal: 20, padding: 5, borderRadius: 21, flexDirection: 'row', gap: 5 },
  modeButton: { flex: 1, minHeight: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  modeText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  modeContent: { paddingHorizontal: 20, paddingTop: 20 },
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stepNumber: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  stepLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  stepLine: { width: 22, height: 2, borderRadius: 1 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.6 },
  ownTitle: { marginTop: 28 },
  sectionHint: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18, marginTop: 5 },
  phraseGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginTop: 14 },
  phraseChip: { width: '48.5%', minHeight: 62, borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  phraseEmoji: { fontSize: 22 },
  phraseText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 17 },
  recordStage: { minHeight: 250, alignItems: 'center', justifyContent: 'center' },
  micWrap: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center' },
  pulseLayer: { position: 'absolute', width: 170, height: 170, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 142, height: 142, borderRadius: 71, borderWidth: 3 },
  pulseRingInner: { width: 118, height: 118, borderRadius: 59, borderWidth: 2 },
  mainButton: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', shadowColor: '#168c91', shadowOpacity: 0.28, shadowRadius: 15, shadowOffset: { width: 0, height: 9 }, elevation: 7 },
  readyStage: { width: '100%', alignItems: 'center', gap: 14, paddingVertical: 10 },
  translateCta: { width: '100%', maxWidth: 320, minHeight: 60, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#c75841', shadowOpacity: 0.22, shadowRadius: 11, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  ctaLabel: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  readyActions: { flexDirection: 'row', gap: 10 },
  secondaryButton: { minHeight: 46, borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  analyzingBox: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center' },
  recordLabel: { fontFamily: 'Inter_700Bold', fontSize: 17, marginTop: 14 },
  recordSubtext: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 4, textAlign: 'center' },
  resultBubble: { borderRadius: 24, borderWidth: 1.5, padding: 18, shadowColor: '#704b3e', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  resultKicker: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1, marginBottom: 8 },
  resultText: { fontFamily: 'Inter_700Bold', fontSize: 17, lineHeight: 24 },
  disclaimer: { fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 14, marginTop: 12 },
  messageBox: { minHeight: 120, borderRadius: 24, borderWidth: 1, padding: 14, marginTop: 12, shadowColor: '#704b3e', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  input: { flex: 1, minHeight: 70, fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 22 },
  inputFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  inputHint: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 14 },
  speakCta: { minHeight: 58, borderRadius: 20, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  floating: { position: 'absolute', left: 20, right: 20 },
  floatingCard: { borderRadius: 20, borderWidth: 1.5, padding: 12, gap: 10, shadowColor: '#281b1b', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  floatingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  floatingCopy: { flex: 1 },
  listeningTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  listeningText: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 },
  toneText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 17 },
  feedbackText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 17 },
  buyButton: { minHeight: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buyText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
});