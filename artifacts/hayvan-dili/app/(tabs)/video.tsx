import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

const API_BASE = 'https://slategraysmallcopyleft.onrender.com';
const MAX_VIDEO_BYTES = 15 * 1024 * 1024;
const DEVICE_ID_KEY = 'hayvan-dili-device-id';

type FeedVideo = {
  id: string;
  url: string;
  animal: 'cat' | 'dog';
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
};

const UPLOAD_ERRORS: Record<string, string> = {
  INAPPROPRIATE_CONTENT: 'Bu video uygun bulunmadı, paylaşılamadı.',
  NOT_CAT_OR_DOG: 'Videoda kedi ya da köpek görünmüyor. Sadece kedi ve köpek videoları paylaşılabilir.',
  FILE_TOO_LARGE: 'Video çok büyük. En fazla yaklaşık 30 saniyelik bir video seç.',
  INVALID_FILE_TYPE: 'Bu dosya desteklenmiyor. Lütfen bir video seç.',
  CHECK_FAILED: 'Video şu an kontrol edilemedi. Biraz sonra tekrar dene.',
};

async function getDeviceId() {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function VideoCard({
  video,
  onLike,
  onReport,
}: {
  video: FeedVideo;
  onLike: (id: string) => void;
  onReport: (id: string) => void;
}) {
  const colors = useColors();
  const player = useVideoPlayer(`${API_BASE}${video.url}`, (p) => {
    p.loop = true;
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />
      <View style={styles.cardFooter}>
        <Text style={[styles.animalTag, { color: colors.mutedForeground }]}>
          {video.animal === 'cat' ? '🐱 Kedi' : '🐶 Köpek'}
        </Text>
        <View style={styles.actions}>
          <Pressable onPress={() => onLike(video.id)} style={styles.actionButton} accessibilityRole="button" accessibilityLabel="Beğen">
            <Feather name="heart" size={22} color={video.likedByMe ? colors.coral : colors.mutedForeground} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>{video.likeCount}</Text>
          </Pressable>
          <Pressable onPress={() => onReport(video.id)} style={styles.actionButton} accessibilityRole="button" accessibilityLabel="Bildir">
            <Feather name="flag" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function VideoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const deviceIdRef = useRef<string>('');

  const loadVideos = useCallback(async () => {
    try {
      if (!deviceIdRef.current) deviceIdRef.current = await getDeviceId();
      const response = await fetch(`${API_BASE}/api/videos`, {
        headers: { 'x-device-id': deviceIdRef.current },
      });
      if (!response.ok) throw new Error('list failed');
      const data = (await response.json()) as { videos: FeedVideo[] };
      setVideos(data.videos);
      setMessage('');
    } catch {
      setMessage('Videolar yüklenemedi. İnternetini kontrol edip tekrar dene.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVideos();
  }, [loadVideos]);

  const pickAndUpload = async () => {
    if (uploading) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setMessage('Video seçmek için galeri iznini açmalısın.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: 30,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) {
        setMessage(UPLOAD_ERRORS.FILE_TOO_LARGE);
        return;
      }

      setUploading(true);
      setMessage('');
      if (!deviceIdRef.current) deviceIdRef.current = await getDeviceId();

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const blob = await (await fetch(asset.uri)).blob();
        formData.append('video', blob, 'video.mp4');
      } else {
        formData.append('video', new File(asset.uri) as unknown as Blob);
      }

      const response = await fetch(`${API_BASE}/api/videos`, {
        method: 'POST',
        headers: { 'x-device-id': deviceIdRef.current },
        body: formData,
      });

      if (!response.ok) {
        let code = '';
        try {
          code = ((await response.json()) as { error?: string }).error ?? '';
        } catch {
          code = '';
        }
        setMessage(UPLOAD_ERRORS[code] ?? 'Video yüklenemedi. Lütfen tekrar dene.');
        return;
      }

      const data = (await response.json()) as { video: FeedVideo };
      setVideos((current) => [data.video, ...current]);
      setMessage('Videon paylaşıldı! 🎉');
    } catch (error) {
      console.error('[Hayvan Dili] Video yükleme hatası:', error);
      setMessage('Video yüklenemedi. Lütfen tekrar dene.');
    } finally {
      setUploading(false);
    }
  };

  const likeVideo = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/videos/${id}/like`, {
        method: 'POST',
        headers: { 'x-device-id': deviceIdRef.current },
      });
      if (!response.ok) return;
      const data = (await response.json()) as { likeCount: number; likedByMe: boolean };
      setVideos((current) =>
        current.map((item) => (item.id === id ? { ...item, likeCount: data.likeCount, likedByMe: data.likedByMe } : item)),
      );
    } catch {
      // sessizce geç
    }
  };

  const reportVideo = (id: string) => {
    const send = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/videos/${id}/report`, {
          method: 'POST',
          headers: { 'x-device-id': deviceIdRef.current },
        });
        if (response.ok) {
          setVideos((current) => current.filter((item) => item.id !== id));
          setMessage('Bildirdiğin için teşekkürler, video kaldırıldı.');
        }
      } catch {
        setMessage('Bildirim gönderilemedi. Lütfen tekrar dene.');
      }
    };

    if (Platform.OS === 'web') {
      void send();
      return;
    }
    Alert.alert('Videoyu bildir', 'Bu videoyu uygunsuz olarak bildirmek istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Bildir', style: 'destructive', onPress: () => void send() },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topInset + 10 }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Sevimli Videolar</Text>
        <Pressable
          onPress={pickAndUpload}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Video paylaş"
          style={[styles.uploadButton, { backgroundColor: colors.teal, opacity: uploading ? 0.6 : 1 }]}
        >
          {uploading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Feather name="plus" size={18} color={colors.primaryForeground} />
              <Text style={[styles.uploadText, { color: colors.primaryForeground }]}>Paylaş</Text>
            </>
          )}
        </Pressable>
      </View>

      {uploading ? (
        <Text style={[styles.info, { color: colors.mutedForeground }]}>Video kontrol ediliyor, bu birkaç saniye sürebilir…</Text>
      ) : null}
      {message ? <Text style={[styles.info, { color: colors.coral }]}>{message}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.coral} style={styles.loader} />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VideoCard video={item} onLike={likeVideo} onReport={reportVideo} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={loadVideos}
          refreshing={false}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              Henüz video yok. İlk sevimli videoyu sen paylaş!
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.5 },
  uploadButton: { minWidth: 92, height: 40, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 14 },
  uploadText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  info: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 17, paddingHorizontal: 20, marginBottom: 10 },
  loader: { marginTop: 40 },
  list: { paddingHorizontal: 20, paddingBottom: 120, gap: 16 },
  empty: { fontFamily: 'Inter_500Medium', fontSize: 14, textAlign: 'center', marginTop: 40 },
  card: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  video: { width: '100%', height: 360, backgroundColor: '#000' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  animalTag: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
});