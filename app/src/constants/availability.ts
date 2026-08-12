export interface DaypartPreset {
  key: string;
  label: string;
  shortLabel: string;
  group: 'Weekday' | 'Weekend';
  days: string[];
  start: string;
  end: string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKEND = ['Sat', 'Sun'];

/**
 * Quick-select time-of-day presets. Applying one merges the given days/times
 * into the existing per-day availability — it does not clear other days,
 * so multiple presets (e.g. "Weekday Morning" + "Weekend Evening") can be
 * combined on top of each other.
 */
export const DAYPART_PRESETS: DaypartPreset[] = [
  { key: 'weekdayMorning', label: 'Weekday Morning', shortLabel: 'Morning', group: 'Weekday', days: WEEKDAYS, start: '8:00 AM', end: '12:00 PM' },
  { key: 'weekdayAfternoon', label: 'Weekday Afternoon', shortLabel: 'Afternoon', group: 'Weekday', days: WEEKDAYS, start: '12:00 PM', end: '5:00 PM' },
  { key: 'weekdayEvening', label: 'Weekday Evening', shortLabel: 'Evening', group: 'Weekday', days: WEEKDAYS, start: '5:00 PM', end: '9:00 PM' },
  { key: 'weekendMorning', label: 'Weekend Morning', shortLabel: 'Morning', group: 'Weekend', days: WEEKEND, start: '8:00 AM', end: '12:00 PM' },
  { key: 'weekendAfternoon', label: 'Weekend Afternoon', shortLabel: 'Afternoon', group: 'Weekend', days: WEEKEND, start: '12:00 PM', end: '5:00 PM' },
  { key: 'weekendEvening', label: 'Weekend Evening', shortLabel: 'Evening', group: 'Weekend', days: WEEKEND, start: '5:00 PM', end: '9:00 PM' },
];
