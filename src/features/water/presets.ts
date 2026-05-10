import type { ComponentProps } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export interface WaterPresetDef {
  id: string;
  ml: number;
  label: string;
  icon: ComponentProps<typeof FontAwesome>['name'];
}

export const WATER_PRESETS: WaterPresetDef[] = [
  { id: 'sip', ml: 150, label: 'Small sip', icon: 'tint' },
  { id: 'glass', ml: 250, label: 'Glass', icon: 'glass' },
  { id: 'bottle_half', ml: 330, label: 'Small bottle', icon: 'flask' },
  { id: 'bottle', ml: 500, label: 'Bottle', icon: 'bitbucket' },
  { id: 'bottle_lg', ml: 750, label: 'Large bottle', icon: 'coffee' },
  { id: 'mug', ml: 350, label: 'Mug', icon: 'coffee' },
];

/** Stitch "Quick Add" row (glass · bottle · mug). */
export const WATER_PRIMARY_PRESET_IDS: string[] = ['glass', 'bottle', 'mug'];

export function presetsByPrimaryThenRest(): WaterPresetDef[] {
  const primaryIds = new Set(WATER_PRIMARY_PRESET_IDS);
  const primary = WATER_PRIMARY_PRESET_IDS.map((id) => WATER_PRESETS.find((p) => p.id === id)).filter(
    Boolean,
  ) as WaterPresetDef[];
  const rest = WATER_PRESETS.filter((p) => !primaryIds.has(p.id));
  return [...primary, ...rest];
}
