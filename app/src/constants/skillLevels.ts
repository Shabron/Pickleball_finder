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
