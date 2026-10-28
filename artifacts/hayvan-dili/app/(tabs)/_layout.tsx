import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useColors, useIsDark } from '@/hooks/useColors';
import { useT } from '@/hooks/useT';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  const colors = useColors();
  const t = useT();
  const isDark = useIsDark();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarLabelStyle: { fontSize: 10 },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabHome'),
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="video"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="translate"
        options={{
          title: t('tabTranslate'),
          tabBarLabel: () => (
            <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.coral }}>
              {t('tabTranslate')}
            </Text>
          ),
          tabBarIcon: () => (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.coral,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: colors.coral,
                shadowOpacity: 0.4,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
              }}
            >
              <Feather name="mic" size={20} color={colors.primaryForeground} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: t('tabReminders'),
          tabBarIcon: ({ color }) => <Feather name="bell" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabSettings'),
          tabBarIcon: ({ color }) => <Feather name="settings" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="premium"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}