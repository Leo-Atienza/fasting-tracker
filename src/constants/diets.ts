import type { DietPreferenceId } from '@/src/domain/types';

export const DIET_OPTIONS: { id: DietPreferenceId; label: string; description: string }[] = [
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    description: 'No meat or fish; may include dairy/eggs.',
  },
  {
    id: 'vegan',
    label: 'Vegan',
    description: 'Plant-based only.',
  },
  {
    id: 'pescatarian',
    label: 'Pescatarian',
    description: 'Fish/seafood included; avoids other meats.',
  },
  {
    id: 'omnivore',
    label: 'Omnivore',
    description: 'A mix of animal and plant foods.',
  },
  {
    id: 'meat_forward',
    label: 'Primarily meat-forward',
    description: 'Meal ideas skew toward animal proteins (not medical advice).',
  },
];

/** Same order as `DIET_OPTIONS` — single source for persist allowlists. */
export const DIET_PREFERENCE_IDS: DietPreferenceId[] = DIET_OPTIONS.map((o) => o.id);
