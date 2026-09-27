export const SKILL_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  lowIntermediate: 'Low Intermediate',
  highIntermediate: 'High Intermediate',
  advanced: 'Advanced',
  professional: 'Professional',
};

export function getSkillLevelLabel(level?: string): string {
  if (!level) return 'N/A';
  return SKILL_LEVEL_LABELS[level] || level;
}

export const PLAY_STYLE_LABELS: Record<string, string> = {
  singles: 'Singles',
  doubles: 'Doubles',
  mixed: 'Mixed',
  any: 'Any style',
};

export function getPlayStyleLabel(style?: string): string | undefined {
  if (!style) return undefined;
  return PLAY_STYLE_LABELS[style.toLowerCase()] || style;
}
