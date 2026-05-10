import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { DIET_OPTIONS } from '@/src/constants/diets';
import { formatVolume, mlToOz, ozToMl } from '@/src/lib/units';
import { useAppStore, type WaterUnit } from '@/src/store/useAppStore';

export default function SettingsScreen() {
  const theme = useColorScheme() ?? 'light';
  const palette = Colors[theme];

  const dietPreferenceId = useAppStore((s) => s.dietPreferenceId);
  const setDiet = useAppStore((s) => s.setDietPreferenceId);

  const waterDailyGoalMl = useAppStore((s) => s.waterDailyGoalMl);
  const waterUnit = useAppStore((s) => s.waterUnit);
  const setGoal = useAppStore((s) => s.setWaterDailyGoalMl);
  const setWaterUnit = useAppStore((s) => s.setWaterUnit);

  const [draftGoal, setDraftGoal] = useState(String(Math.round(waterDailyGoalMl)));

  useFocusEffect(
    useCallback(() => {
      const canonicalMl = useAppStore.getState().waterDailyGoalMl;
      const unit = useAppStore.getState().waterUnit;
      const display =
        unit === 'oz' ? Math.round(mlToOz(canonicalMl)) : Math.round(canonicalMl);
      setDraftGoal(String(display));
    }, []),
  );

  function commitGoal() {
    const n = Number(draftGoal);
    if (Number.isNaN(n)) {
      Alert.alert('Invalid goal', 'Enter numbers only.');
      return;
    }
    const ml = waterUnit === 'oz' ? ozToMl(n) : Math.round(n);
    setGoal(ml);
    setDraftGoal(String(waterUnit === 'oz' ? Math.round(n) : ml));
    Alert.alert('Saved', `Goal set to ${formatVolume(ml, waterUnit)} per day`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={[styles.h, { color: palette.text }]} accessibilityRole="header">
          Diet preference
        </Text>
        <Text style={[styles.help, { color: palette.tabIconDefault }]}>
          Changes apply to meal suggestion filters only.
        </Text>
        <View style={{ gap: 10, marginBottom: 20 }}>
          {DIET_OPTIONS.map((opt) => {
            const selected = dietPreferenceId === opt.id;
            return (
              <Pressable
                key={opt.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setDiet(opt.id)}
                style={[
                  styles.card,
                  selected && { borderColor: palette.tint },
                  {
                    borderColor: palette.tabIconDefault,
                  },
                ]}>
                <Text style={[styles.optionTitle, { color: palette.text }]}>{opt.label}</Text>
                <Text style={[styles.help, { color: palette.tabIconDefault }]}>{opt.description}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.h, { color: palette.text }]}>Hydration defaults</Text>
        <Text style={[styles.help, { color: palette.tabIconDefault }]}>
          Daily target for the Water tab progress bar (local only).
        </Text>

        <View style={styles.row}>
          {( ['ml','oz'] as WaterUnit[]).map((u) => (
            <Pressable
              key={u}
              accessibilityRole="button"
              accessibilityLabel={`Water unit ${u}`}
              onPress={() => {
                const canonicalMl = useAppStore.getState().waterDailyGoalMl;
                setWaterUnit(u);
                setDraftGoal(
                  String(u === 'oz' ? Math.round(mlToOz(canonicalMl)) : Math.round(canonicalMl)),
                );
              }}
              style={[
                styles.unitChip,
                { borderColor: palette.tabIconDefault },
                waterUnit === u && { borderColor: palette.tint },
              ]}>
              <Text
                style={[styles.unitChipText, { color: palette.text }]}>
                {u.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: palette.tabIconDefault }]}>Daily goal ({waterUnit})</Text>
        <TextInput
          value={draftGoal}
          accessibilityLabel={`Daily goal in ${waterUnit}`}
          onChangeText={setDraftGoal}
          keyboardType="decimal-pad"
          placeholder={waterUnit === 'oz' ? 'e.g. 84' : 'e.g. 2500'}
          placeholderTextColor={palette.tabIconDefault}
          style={[styles.input, { color: palette.text, borderColor: palette.tabIconDefault }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save hydration goal"
          onPress={commitGoal}
          style={[styles.saveBtn, { backgroundColor: palette.tint }]}>
          <Text style={styles.saveText}>Save goal</Text>
        </Pressable>

        <Text style={[styles.disclaimer, { color: palette.tabIconDefault }]}>
          This screen does not diagnose or treat medical conditions.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pad: {
    padding: 18,
    paddingBottom: 40,
    gap: 12,
  },
  h: { fontSize: 20, fontWeight: '700' },
  help: {
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    padding: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  optionTitle: { fontWeight: '700', fontSize: 15 },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  unitChip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    borderRadius: 8,
  },
  unitChipText: { fontWeight: '700', letterSpacing: 1 },
  label: { fontWeight: '600', marginTop: 8 },
  input: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    fontSize: 16,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  saveBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  saveText: { color: '#fff', fontWeight: '700' },
  disclaimer: {
    marginTop: 26,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
});
