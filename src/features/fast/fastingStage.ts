const HOUR = 60 * 60 * 1000;

export type StageIcon =
  | 'meditation'
  | 'weather-sunset-up'
  | 'chart-timeline-variant'
  | 'fire'
  | 'recycle';

export type FastingStage = {
  badge: string;
  title: string;
  description: string;
  icon: StageIcon;
};

/** Educational staging only — not a medical timeline. */
export function getFastingStage(elapsedMs: number, isActive: boolean): FastingStage {
  if (!isActive) {
    return {
      badge: 'Prep',
      title: 'Fuel your discipline',
      description:
        'Pick an optional fasting goal, hydrate well, then begin when your schedule aligns. Coaching copy here is motivational, not diagnostic.',
      icon: 'meditation',
    };
  }

  const h = elapsedMs / HOUR;

  if (h < 4) {
    return {
      badge: 'Warm-up',
      title: 'Settling into the window',
      description:
        'Many people ride a familiar hunger wave early while the body adjusts. Water, electrolytes if appropriate for you, and gentle movement can smooth the glide path.',
      icon: 'weather-sunset-up',
    };
  }

  if (h < 12) {
    return {
      badge: 'Steady state',
      title: 'Metabolic glide',
      description:
        'You are further into glycogen use and fat-supported energy for many individuals. Signals vary wildly—prioritize hydration and sleep hygiene.',
      icon: 'chart-timeline-variant',
    };
  }

  if (h < 18) {
    return {
      badge: 'Peak focus',
      title: 'Ketosis band',
      description:
        'Some fasters describe steadier appetite cues here. Ketone chatter is nuanced in humans—treat milestones as motivational, not lab values.',
      icon: 'fire',
    };
  }

  return {
    badge: 'Extended',
    title: 'Autophagy curiosity',
    description:
      'Autophagy is always-on biology; timelines in headlines oversimplify. Celebrate your consistency—pair long windows with clinician guidance when unsure.',
    icon: 'recycle',
  };
}
