import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const EMOJI = { dog: '🐶', cat: '🐱' } as const;

export default function PetStrip() {
  const colors = useColors();
  const router = useRouter();
  const { pets, pet, setActivePet, hapticsEnabled } = useApp();

  if (pets.length === 0) return null;

  const tap = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.foreground }]}>Dostlarım</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {pets.map((item) => {
          const active = pet?.id === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.name}
              onPress={() => {
                tap();
                setActivePet(item.id);
              }}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? colors.coral : colors.card,
                  borderColor: active ? colors.coral : colors.border,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <Text style={styles.emoji}>{EMOJI[item.type]}</Text>
              <Text
                style={[
                  styles.name,
                  { color: active ? colors.primaryForeground : colors.foreground },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hayvan ekle"
          onPress={() => {
            tap();
            router.push('/settings');
          }}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: colors.muted,
              borderColor: 'transparent',
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          <Feather name="plus" size={16} color={colors.mutedForeground} />
          <Text style={[styles.name, { color: colors.mutedForeground }]}>Ekle</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: -0.2,
    marginBottom: 8,
    paddingHorizontal: 3,
  },
  row: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    minHeight: 42,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  emoji: {
    fontSize: 17,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    maxWidth: 120,
  },
});