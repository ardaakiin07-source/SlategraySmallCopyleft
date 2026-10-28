import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useApp, type PetType } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const BREEDS: Record<PetType, string[]> = {
  dog: [
    'Golden Retriever',
    'Labrador',
    'Kangal',
    'Alman Kurdu',
    'Pomeranian',
    'Terrier',
    'Husky',
    'Cocker Spaniel',
    'Melez / Bilmiyorum',
  ],
  cat: [
    'Tekir',
    'Sarman',
    'British Shorthair',
    'Van Kedisi',
    'Ankara Kedisi',
    'Scottish Fold',
    'İran Kedisi',
    'Melez / Bilmiyorum',
  ],
};

const EMOJI: Record<PetType, string> = { dog: '🐶', cat: '🐱' };
const TYPE_NAME: Record<PetType, string> = { dog: 'Köpek', cat: 'Kedi' };

export default function PetManager() {
  const colors = useColors();
  const { pets, pet, addPet, removePet, setActivePet, hapticsEnabled } = useApp();

  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<PetType | null>(null);
  const [breed, setBreed] = useState('');
  const [name, setName] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const tap = () => {
    if (hapticsEnabled) Haptics.selectionAsync();
  };

  const catCount = pets.filter((item) => item.type === 'cat').length;
  const dogCount = pets.filter((item) => item.type === 'dog').length;
  const summary = pets.length === 0 ? 'Henüz hayvan yok' : `${catCount} kedi, ${dogCount} köpek`;

  const resetForm = () => {
    setAdding(false);
    setType(null);
    setBreed('');
    setName('');
  };

  const chooseType = (next: PetType) => {
    tap();
    if (next !== type) setBreed('');
    setType(next);
  };

  const canAdd = !!type && name.trim().length > 0;

  const submit = () => {
    if (!type || !canAdd) return;
    addPet({
      type,
      name: name.trim(),
      breed: breed.trim() || 'Melez / Bilmiyorum',
    });
    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
  };

  const onDelete = (id: string) => {
    // İlk basış: "Emin misin?" sorar. İkinci basış: siler.
    if (confirmId !== id) {
      tap();
      setConfirmId(id);
      return;
    }
    removePet(id);
    setConfirmId(null);
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dostlarım</Text>
      <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>{summary}</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {pets.map((item) => {
          const active = pet?.id === item.id;
          const confirming = confirmId === item.id;
          return (
            <View
              key={item.id}
              style={[
                styles.petRow,
                { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.name} seç`}
                onPress={() => {
                  tap();
                  setConfirmId(null);
                  setActivePet(item.id);
                }}
                style={({ pressed }) => [styles.petMain, { opacity: pressed ? 0.85 : 1 }]}
              >
                <View
                  style={[
                    styles.petIcon,
                    { backgroundColor: active ? colors.coral : colors.muted },
                  ]}
                >
                  <Text style={styles.petEmoji}>{EMOJI[item.type]}</Text>
                </View>
                <View style={styles.petCopy}>
                  <Text style={[styles.petName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.petInfo, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {TYPE_NAME[item.type]}
                    {item.breed ? `, ${item.breed}` : ''}
                  </Text>
                </View>
                {active ? <Feather name="check-circle" size={20} color={colors.coral} /> : null}
              </Pressable>

              {pets.length > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name} sil`}
                  onPress={() => onDelete(item.id)}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    {
                      backgroundColor: confirming ? colors.destructive : colors.muted,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  {confirming ? (
                    <Text style={[styles.deleteText, { color: colors.primaryForeground }]}>Sil</Text>
                  ) : (
                    <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                  )}
                </Pressable>
              ) : null}
            </View>
          );
        })}

        {adding ? (
          <View style={styles.form}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Hangi hayvan?</Text>
            <View style={styles.typeRow}>
              {(['cat', 'dog'] as PetType[]).map((option) => {
                const selected = type === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityLabel={TYPE_NAME[option]}
                    onPress={() => chooseType(option)}
                    style={({ pressed }) => [
                      styles.typeChip,
                      {
                        backgroundColor: selected ? colors.coral : colors.muted,
                        transform: [{ scale: pressed ? 0.96 : 1 }],
                      },
                    ]}
                  >
                    <Text style={styles.typeEmoji}>{EMOJI[option]}</Text>
                    <Text
                      style={[
                        styles.typeText,
                        { color: selected ? colors.primaryForeground : colors.mutedForeground },
                      ]}
                    >
                      {TYPE_NAME[option]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {type ? (
              <>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                  Cinsi (seç ya da kendin yaz)
                </Text>
                <View style={styles.chips}>
                  {BREEDS[type].map((option) => {
                    const selected = breed === option;
                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="button"
                        onPress={() => {
                          tap();
                          setBreed(option);
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? colors.teal : colors.muted,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: selected ? colors.primaryForeground : colors.foreground },
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  value={breed}
                  onChangeText={setBreed}
                  placeholder="Başka bir cins yaz"
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={30}
                  style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
                />

                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Adı</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Örn. Pamuk"
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={24}
                  returnKeyType="done"
                  onSubmitEditing={submit}
                  style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
                />
              </>
            ) : null}

            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Vazgeç"
                onPress={() => {
                  tap();
                  resetForm();
                }}
                style={({ pressed }) => [
                  styles.cancelButton,
                  { backgroundColor: colors.muted, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={[styles.actionText, { color: colors.mutedForeground }]}>Vazgeç</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hayvanı ekle"
                disabled={!canAdd}
                onPress={submit}
                style={({ pressed }) => [
                  styles.saveButton,
                  {
                    backgroundColor: colors.coral,
                    opacity: canAdd ? 1 : 0.4,
                    transform: [{ scale: pressed && canAdd ? 0.97 : 1 }],
                  },
                ]}
              >
                <Feather name="plus" size={18} color={colors.primaryForeground} />
                <Text style={[styles.actionText, { color: colors.primaryForeground }]}>Ekle</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            testID="pet-add-open"
            accessibilityRole="button"
            accessibilityLabel="Hayvan ekle"
            onPress={() => {
              tap();
              setConfirmId(null);
              setAdding(true);
            }}
            style={({ pressed }) => [styles.addRow, { opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={[styles.petIcon, { backgroundColor: colors.teal }]}>
              <Feather name="plus" size={20} color={colors.primaryForeground} />
            </View>
            <Text style={[styles.addText, { color: colors.foreground }]}>Hayvan ekle</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    letterSpacing: -0.3,
    paddingHorizontal: 3,
  },
  sectionHint: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 2,
    paddingHorizontal: 3,
  },
  card: {
    marginTop: 10,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  petMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  petIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petEmoji: {
    fontSize: 20,
  },
  petCopy: {
    flex: 1,
  },
  petName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  petInfo: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    minWidth: 40,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  deleteText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  form: {
    padding: 14,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  typeEmoji: {
    fontSize: 18,
  },
  typeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1.6,
    minHeight: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
});