/**
 * Small shared helpers for showing players/posts in plain language.
 */
import { PLAY_STYLE_LABELS } from '../constants/skillLevels';

const SKILL_ORDER: Record<string, number> = {
  beginner: 0, lowIntermediate: 1, highIntermediate: 2, advanced: 3, professional: 4,
};

export interface MatchSelf {
  skillLevel?: string;
  playStyle?: string;
}

/** One short, honest reason this player suits "me" — or null when nothing stands out. */
export function matchReason(
  other: { level?: string; playStyle?: string; distanceMi?: number },
  me?: MatchSelf | null
): string | null {
  const a = SKILL_ORDER[me?.skillLevel ?? ''];
  const b = SKILL_ORDER[other.level ?? ''];
  if (a != null && b != null) {
    if (a === b) return 'Same level as you';
    if (Math.abs(a - b) === 1) return 'Close to your level';
  }
  const mine = me?.playStyle;
  const theirs = other.playStyle?.toLowerCase();
  if (mine && theirs && mine !== 'any' && mine === theirs) {
    return `Also plays ${PLAY_STYLE_LABELS[theirs]?.toLowerCase() ?? theirs}`;
  }
  if (other.distanceMi != null && other.distanceMi <= 3) return 'Lives close by';
  return null;
}

export function timeAgo(dateString?: string): string {
  if (!dateString) return '';
  const s = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatMiles(km?: number | null): string | null {
  if (km == null || Number.isNaN(km)) return null;
  const mi = km / 1.609344;
  if (mi < 0.1) return '< 0.1 mi';
  return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Collapses { Mon: {start,end}, Tue: {...} } into readable lines, grouping
 * consecutive days with identical hours: "Mon – Fri" · "8:00 AM – 12:00 PM".
 */
export function summarizeAvailability(
  availability?: Record<string, { start?: string; end?: string }> | null
): { days: string; hours: string }[] {
  if (!availability) return [];
  const entries = DAYS.filter(d => availability[d]).map(d => ({
    day: d,
    idx: DAYS.indexOf(d),
    hours: [availability[d].start, availability[d].end].filter(Boolean).join(' – ') || 'Any time',
  }));
  const out: { days: string; hours: string }[] = [];
  let i = 0;
  while (i < entries.length) {
    let j = i;
    while (j + 1 < entries.length && entries[j + 1].hours === entries[i].hours && entries[j + 1].idx === entries[j].idx + 1) j++;
    const span = j - i;
    const days =
      span === 0 ? entries[i].day : span === 1 ? `${entries[i].day}, ${entries[j].day}` : `${entries[i].day} – ${entries[j].day}`;
    out.push({ days, hours: entries[i].hours });
    i = j + 1;
  }
  return out;
}
