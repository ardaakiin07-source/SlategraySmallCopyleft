import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

// ---- AYARLAR ----
const FREE_LIMIT = 3; // ücretsiz kullanıcının en fazla kaç hatırlatıcısı olabilir
// -----------------

const STORAGE_KEY = '@hayvan-dili/reminders';
const DAY_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const DAY_FULL = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const REPEAT_LABEL = { daily: 'Her gün', weekly: 'Haftalık', monthly: 'Aylık' } as const;

type Repeat = 'daily' | 'weekly' | 'monthly';

type Reminder = {
  id: string;
  emoji: string;
  title: string;
  hour: number;
  minute: number;
  repeat: Repeat;
  weekday: number; // 1 = Pazar ... 7 = Cumartesi
  monthDay: number;
  enabled: boolean;
  notificationId: string | null;
};

type Template = {
  key: string;
  emoji: string;
  title: string;
  hour: number;
  minute: number;
  repeat: Repeat;
  weekday: number;
  monthDay: number;
};

function getTemplates(petType: 'dog' | 'cat'): Template[] {
  const walkOrLitter: Template =
    petType === 'dog'
      ? { key: 'walk', emoji: '🚶', title: 'Yürüyüş zamanı', hour: 18, minute: 0, repeat: 'daily', weekday: 1, monthDay: 1 }
      : { key: 'litter', emoji: '🚽', title: 'Kum kabını temizle', hour: 9, minute: 0, repeat: 'daily', weekday: 1, monthDay: 1 };
  return [
    { key: 'food', emoji: '🍽️', title: 'Mama zamanı', hour: 8, minute: 0, repeat: 'daily', weekday: 1, monthDay: 1 },
    { key: 'water', emoji: '💧', title: 'Suyunu yenile', hour: 10, minute: 0, repeat: 'daily', weekday: 1, monthDay: 1 },
    walkOrLitter,
    { key: 'play', emoji: '🎾', title: 'Oyun zamanı', hour: 19, minute: 0, repeat: 'daily', weekday: 1, monthDay: 1 },
    { key: 'bath', emoji: '🛁', title: 'Banyo zamanı', hour: 11, minute: 0, repeat: 'monthly', weekday: 1, monthDay: 1 },
    { key: 'brush', emoji: '🪮', title: 'Tüy tarama', hour: 17, minute: 0, repeat: 'weekly', weekday: 1, monthDay: 1 },
    { key: 'nails', emoji: '✂️', title: 'Tırnak kesimi', hour: 17, minute: 0, repeat: 'monthly', weekday: 1, monthDay: 15 },
    { key: 'teeth', emoji: '🦷', title: 'Diş fırçalama', hour: 20, minute: 0, repeat: 'weekly', weekday: 4, monthDay: 1 },
  ];
}

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const pad = (n: number) => String(n).padStart(2, '0');

function describe(r: { repeat: Repeat; weekday: number; monthDay: number; hour: number; minute: number }) {
  const when =
    r.repeat === 'daily'
      ? 'Her gün'
      : r.repeat === 'weekly'
        ? `Her ${DAY_FULL[r.weekday - 1]}`
        : `Her ayın ${r.monthDay}. günü`;
  return `${when} · ${pad(r.hour)}:${pad(r.minute)}`;
}

// Bir hatırlatıcının bir sonraki ne zaman çalacağını hesaplar
function nextDate(r: Reminder, now: Date): Date {
  const d = new Date(now);
  d.setHours(r.hour, r.minute, 0, 0);
  if (r.repeat === 'daily') {
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
    return d;
  }
  if (r.repeat === 'weekly') {
    const diff = (r.weekday - 1 - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + diff);
    if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 7);
    return d;
  }
  d.setDate(r.monthDay);
  if (d.getTime() <= now.getTime()) {
    d.setMonth(d.getMonth() + 1);
    d.setDate(r.monthDay);
  }
  return d;
}

function whenLabel(next: Date, now: Date) {
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(next) - startOf(now)) / 86400000);
  let day: string;
  if (days === 0) day = 'Bugün';
  else if (days === 1) day = 'Yarın';
  else if (days < 7) day = DAY_FULL[next.getDay()];
  else day = `${next.getDate()}.${pad(next.getMonth() + 1)}`;
  return `${day} ${pad(next.getHours())}:${pad(next.getMinutes())}`;
}

async function ensurePermission() {
  if (Platform.OS === 'web') return true;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Hatırlatıcılar',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

async function scheduleReminder(r: Reminder, petName: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const types = Notifications.SchedulableTriggerInputTypes;
  const base = { hour: r.hour, minute: r.minute, channelId: 'reminders' };
  const trigger =
    r.repeat === 'daily'
      ? { type: types.DAILY, ...base }
      : r.repeat === 'weekly'
        ? { type: types.WEEKLY, weekday: r.weekday, ...base }
        : { type: types.MONTHLY, day: r.monthDay, ...base };
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${r.emoji} ${r.title}`,
      body: petName ? `${petName} seni bekliyor!` : 'Dostun seni bekliyor!',
      sound: true,
    },
    trigger: trigger as Notifications.NotificationTriggerInput,
  });
}

async function cancelReminder(id: string | null) {
  if (Platform.OS === 'web' || !id) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}

export default function RemindersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { pet, isPremium } = useApp();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === 'web' ? Math.max(insets.bottom, 34) : insets.bottom;

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Template | null>(null);

  const templates = getTemplates(pet?.type ?? 'dog');
  const petName = pet?.name ?? '';

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setReminders(JSON.parse(stored) as Reminder[]);
      })
      .catch(() => undefined);
  }, []);

  const save = (list: Reminder[]) => {
    setReminders(list);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list)).catch(() => undefined);
  };

  const openAdd = () => {
    if (!isPremium && reminders.length >= FREE_LIMIT) {
      setMessage(`Ücretsiz planda en fazla ${FREE_LIMIT} hatırlatıcı ekleyebilirsin.`);
      return;
    }
    setMessage('');
    setDraft(null);
    setOpen(true);
  };

  const confirmAdd = async () => {
    if (!draft) return;
    const allowed = await ensurePermission();
    if (!allowed) {
      setOpen(false);
      setMessage('Bildirim izni verilmedi. Hatırlatıcı için telefon ayarlarından bildirimleri açmalısın.');
      return;
    }
    const reminder: Reminder = {
      id: `${Date.now()}`,
      emoji: draft.emoji,
      title: draft.title,
      hour: draft.hour,
      minute: draft.minute,
      repeat: draft.repeat,
      weekday: draft.weekday,
      monthDay: draft.monthDay,
      enabled: true,
      notificationId: null,
    };
    try {
      reminder.notificationId = await scheduleReminder(reminder, petName);
    } catch {
      setMessage('Hatırlatıcı kurulamadı. Lütfen tekrar dene.');
    }
    save([...reminders, reminder]);
    setOpen(false);
  };

  const toggle = async (r: Reminder, value: boolean) => {
    if (value) {
      const allowed = await ensurePermission();
      if (!allowed) {
        setMessage('Bildirim izni verilmedi. Telefon ayarlarından bildirimleri açmalısın.');
        return;
      }
      const notificationId = await scheduleReminder(r, petName).catch(() => null);
      save(reminders.map((x) => (x.id === r.id ? { ...x, enabled: true, notificationId } : x)));
    } else {
      await cancelReminder(r.notificationId);
      save(reminders.map((x) => (x.id === r.id ? { ...x, enabled: false, notificationId: null } : x)));
    }
  };

  const remove = (r: Reminder) => {
    const doRemove = async () => {
      await cancelReminder(r.notificationId);
      save(reminders.filter((x) => x.id !== r.id));
    };
    if (Platform.OS === 'web') {
      void doRemove();
      return;
    }
    Alert.alert('Hatırlatıcıyı sil', `"${r.title}" silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => void doRemove() },
    ]);
  };

  const update = (patch: Partial<Template>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const stepHour = (delta: number) => draft && update({ hour: (draft.hour + delta + 24) % 24 });
  const stepMinute = (delta: number) => draft && update({ minute: (draft.minute + delta + 60) % 60 });
  const stepDay = (delta: number) => draft && update({ monthDay: Math.min(28, Math.max(1, draft.monthDay + delta)) });

  // Liste: yaklaşan hatırlatıcılar önce, kapalı olanlar sonda
  const now = new Date();
  const withNext = reminders.map((r) => ({ r, next: r.enabled ? nextDate(r, now) : null }));
  const sorted = [...withNext].sort((a, b) => {
    if (a.next && b.next) return a.next.getTime() - b.next.getTime();
    if (a.next) return -1;
    if (b.next) return 1;
    return 0;
  });
  const upcoming = sorted.find((x) => x.next);
  const activeCount = reminders.filter((r) => r.enabled).length;

  const accentFor = (repeat: Repeat) =>
    repeat === 'daily' ? colors.marigold : repeat === 'weekly' ? colors.teal : colors.coral;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topInset + 12, paddingBottom: bottomInset + 110, paddingHorizontal: 20 }}
      >
        {/* Üst kart */}
        <LinearGradient
          colors={[colors.coral, colors.tangerine]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={[styles.heroBlob, styles.heroBlobOne, { backgroundColor: colors.marigold }]} />
          <View style={[styles.heroBlob, styles.heroBlobTwo, { backgroundColor: colors.teal }]} />
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: colors.softWhite }]}>Hatırlatıcılar</Text>
              <Text style={[styles.heroSub, { color: colors.heroText }]}>
                {petName ? `${petName} için` : 'Dostun için'} zamanı gelince haber verelim.
              </Text>
            </View>
            <View style={[styles.heroBell, { backgroundColor: colors.whiteWarm }]}>
              <Feather name="bell" size={22} color={colors.coral} />
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={[styles.statPill, { backgroundColor: colors.whiteWarm + '33' }]}>
              <Text style={[styles.statValue, { color: colors.softWhite }]}>{activeCount}</Text>
              <Text style={[styles.statLabel, { color: colors.heroText }]}>aktif</Text>
            </View>
            {!isPremium ? (
              <View style={[styles.statPill, { backgroundColor: colors.whiteWarm + '33' }]}>
                <Text style={[styles.statValue, { color: colors.softWhite }]}>
                  {reminders.length}/{FREE_LIMIT}
                </Text>
                <Text style={[styles.statLabel, { color: colors.heroText }]}>hak</Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.nextBox, { backgroundColor: colors.whiteWarm + '40' }]}>
            <Feather name="clock" size={14} color={colors.softWhite} />
            <Text style={[styles.nextText, { color: colors.softWhite }]} numberOfLines={1}>
              {upcoming && upcoming.next
                ? `Sıradaki: ${upcoming.r.emoji} ${upcoming.r.title} · ${whenLabel(upcoming.next, now)}`
                : 'Aktif hatırlatıcı yok'}
            </Text>
          </View>
        </LinearGradient>

        {Platform.OS === 'web' ? (
          <Text style={[styles.webNote, { color: colors.mutedForeground }]}>
            Bildirimler sadece telefonda çalışır. Burada ekranı deneyebilirsin.
          </Text>
        ) : null}

        {message ? (
          <View style={[styles.messageBox, { backgroundColor: colors.coral + '1A', borderColor: colors.coral + '55' }]}>
            <Feather name="info" size={16} color={colors.coral} />
            <Text style={[styles.message, { color: colors.coral }]}>{message}</Text>
          </View>
        ) : null}

        {reminders.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.emptyCircle, { backgroundColor: colors.marigold + '44' }]}>
              <Text style={styles.emptyEmoji}>🔔</Text>
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Henüz hatırlatıcı yok</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Mama, su, yürüyüş gibi şeyleri tek dokunuşla ekleyebilirsin.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hatırlatıcılarım</Text>
            {sorted.map(({ r, next }) => {
              const accent = accentFor(r.repeat);
              return (
                <View
                  key={r.id}
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.border, opacity: r.enabled ? 1 : 0.6 },
                  ]}
                >
                  <View style={[styles.accentBar, { backgroundColor: r.enabled ? accent : colors.border }]} />
                  <View style={[styles.emojiCircle, { backgroundColor: accent + '33' }]}>
                    <Text style={styles.emoji}>{r.emoji}</Text>
                  </View>
                  <View style={styles.cardCopy}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={[styles.timeText, { color: colors.coral }]}>
                        {pad(r.hour)}:{pad(r.minute)}
                      </Text>
                      <View style={[styles.repeatPill, { backgroundColor: accent + '33' }]}>
                        <Text style={[styles.repeatPillText, { color: colors.foreground }]}>
                          {REPEAT_LABEL[r.repeat]}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {r.enabled && next ? `Sıradaki: ${whenLabel(next, now)}` : 'Kapalı'}
                    </Text>
                  </View>
                  <View style={styles.cardActions}>
                    <Switch
                      value={r.enabled}
                      onValueChange={(v) => void toggle(r, v)}
                      trackColor={{ true: colors.teal }}
                    />
                    <Pressable onPress={() => remove(r)} style={styles.trash} accessibilityLabel="Sil">
                      <Feather name="trash-2" size={17} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <Pressable
          onPress={openAdd}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.coral, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <Feather name="plus" size={20} color={colors.primaryForeground} />
          <Text style={[styles.addText, { color: colors.primaryForeground }]}>Hatırlatıcı ekle</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[styles.backdrop, { backgroundColor: colors.foreground + '66' }]}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={[styles.grabber, { backgroundColor: colors.border }]} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Ne hatırlatalım?</Text>
              <View style={styles.chips}>
                {templates.map((t) => {
                  const selected = draft?.key === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      onPress={() => setDraft(t)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? colors.coral : colors.muted,
                          borderColor: selected ? colors.coral : colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.chipEmoji}>{t.emoji}</Text>
                      <Text style={[styles.chipText, { color: selected ? colors.primaryForeground : colors.foreground }]}>
                        {t.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {draft ? (
                <View>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>SAAT</Text>
                  <View style={styles.timeRow}>
                    <Stepper value={pad(draft.hour)} onMinus={() => stepHour(-1)} onPlus={() => stepHour(1)} />
                    <Text style={[styles.colon, { color: colors.foreground }]}>:</Text>
                    <Stepper value={pad(draft.minute)} onMinus={() => stepMinute(-5)} onPlus={() => stepMinute(5)} />
                  </View>

                  <Text style={[styles.label, { color: colors.mutedForeground }]}>NE SIKLIKLA?</Text>
                  <View style={styles.repeatRow}>
                    {([
                      ['daily', 'Her gün'],
                      ['weekly', 'Haftada bir'],
                      ['monthly', 'Ayda bir'],
                    ] as const).map(([value, label]) => (
                      <Pressable
                        key={value}
                        onPress={() => update({ repeat: value })}
                        style={[styles.repeatButton, { backgroundColor: draft.repeat === value ? colors.teal : colors.muted }]}
                      >
                        <Text
                          style={[
                            styles.repeatText,
                            { color: draft.repeat === value ? colors.primaryForeground : colors.foreground },
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {draft.repeat === 'weekly' ? (
                    <View style={styles.daysRow}>
                      {DAY_SHORT.map((label, index) => (
                        <Pressable
                          key={label}
                          onPress={() => update({ weekday: index + 1 })}
                          style={[styles.dayButton, { backgroundColor: draft.weekday === index + 1 ? colors.teal : colors.muted }]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              { color: draft.weekday === index + 1 ? colors.primaryForeground : colors.foreground },
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  {draft.repeat === 'monthly' ? (
                    <View style={styles.monthRow}>
                      <Text style={[styles.monthLabel, { color: colors.foreground }]}>Ayın</Text>
                      <Stepper value={String(draft.monthDay)} onMinus={() => stepDay(-1)} onPlus={() => stepDay(1)} />
                      <Text style={[styles.monthLabel, { color: colors.foreground }]}>. günü</Text>
                    </View>
                  ) : null}

                  <View style={[styles.summary, { backgroundColor: colors.marigold + '33' }]}>
                    <Text style={styles.summaryEmoji}>{draft.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.summaryTitle, { color: colors.foreground }]}>{draft.title}</Text>
                      <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>{describe(draft)}</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              <Pressable
                onPress={() => void confirmAdd()}
                disabled={!draft}
                style={[styles.confirm, { backgroundColor: draft ? colors.coral : colors.muted }]}
              >
                <Text style={[styles.confirmText, { color: draft ? colors.primaryForeground : colors.mutedForeground }]}>
                  Ekle
                </Text>
              </Pressable>
              <Pressable onPress={() => setOpen(false)} style={styles.cancel}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Vazgeç</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Stepper({ value, onMinus, onPlus }: { value: string; onMinus: () => void; onPlus: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.stepper, { backgroundColor: colors.muted }]}>
      <Pressable onPress={onMinus} style={styles.stepButton} accessibilityLabel="Azalt">
        <Feather name="minus" size={20} color={colors.foreground} />
      </Pressable>
      <Text style={[styles.stepValue, { color: colors.foreground }]}>{value}</Text>
      <Pressable onPress={onPlus} style={styles.stepButton} accessibilityLabel="Artır">
        <Feather name="plus" size={20} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  hero: {
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  heroBlob: { position: 'absolute', borderRadius: 100, opacity: 0.2 },
  heroBlobOne: { width: 150, height: 150, right: -40, top: -70 },
  heroBlobTwo: { width: 90, height: 90, left: -30, bottom: -40 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 25, letterSpacing: -0.6 },
  heroSub: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 4 },
  heroBell: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  heroStats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  statPill: { flexDirection: 'row', alignItems: 'baseline', gap: 5, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  statLabel: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  nextBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10 },
  nextText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, flex: 1 },

  webNote: { fontFamily: 'Inter_500Medium', fontSize: 11, marginBottom: 12 },
  messageBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 14 },
  message: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 17, flex: 1 },

  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.3, marginBottom: 10, paddingHorizontal: 3 },

  empty: { borderRadius: 26, borderWidth: 1, padding: 28, alignItems: 'center' },
  emptyCircle: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 14 },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  emojiCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  cardCopy: { flex: 1 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  timeText: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.4 },
  repeatPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  repeatPillText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  cardSub: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 4 },
  cardActions: { alignItems: 'center', gap: 2 },
  trash: { padding: 6 },

  addButton: {
    minHeight: 58,
    borderRadius: 22,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  addText: { fontFamily: 'Inter_700Bold', fontSize: 15 },

  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, paddingTop: 10, paddingBottom: 30 },
  grabber: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, letterSpacing: -0.4, marginBottom: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, borderWidth: 1 },
  chipEmoji: { fontSize: 16 },
  chipText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.2, marginTop: 22, marginBottom: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  colon: { fontFamily: 'Inter_700Bold', fontSize: 26 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, paddingHorizontal: 4 },
  stepButton: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontFamily: 'Inter_700Bold', fontSize: 22, minWidth: 40, textAlign: 'center' },
  repeatRow: { flexDirection: 'row', gap: 8 },
  repeatButton: { flex: 1, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  repeatText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  daysRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  dayButton: { flex: 1, minHeight: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 },
  monthLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14, marginTop: 20 },
  summaryEmoji: { fontSize: 26 },
  summaryTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  summaryText: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 2 },
  confirm: { minHeight: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  confirmText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  cancel: { minHeight: 40, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  cancelText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});