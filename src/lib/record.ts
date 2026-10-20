// What the pages read off a pundit's record. Display only: the scores themselves
// come from the loader (src/data/loadSipps.ts), and nothing here changes them.
import { getAccuracyColor, type Prediction, type PredictionCategory, type SIPP } from '@/data/sippData';

export type CategoryFilter = PredictionCategory | 'all';

export const CATEGORIES: { value: PredictionCategory; label: string }[] = [
  { value: 'economy', label: 'Economy' },
  { value: 'politics', label: 'Politics' },
  { value: 'technology', label: 'Technology' },
  { value: 'foreign-policy', label: 'Foreign policy' },
  { value: 'social-trends', label: 'Social trends' },
];

export const categoryLabel = (c: PredictionCategory): string =>
  CATEGORIES.find((x) => x.value === c)?.label ?? c.replace('-', ' ');

/** The key a category has in SIPP.categoryAccuracy ("foreign-policy" → "foreign_policy"). */
export const categoryKey = (c: PredictionCategory) =>
  c.replace('-', '_') as keyof SIPP['categoryAccuracy'];

export const isRated = (p: Prediction): p is Prediction & { accuracyRating: number } =>
  p.verificationStatus === 'verified' && typeof p.accuracyRating === 'number' && !Number.isNaN(p.accuracyRating);

export const inCategory = (p: Prediction, c: CategoryFilter) => c === 'all' || p.category === c;

export const ratedIn = (sipp: SIPP, c: CategoryFilter = 'all') =>
  sipp.predictions.filter((p) => isRated(p) && inCategory(p, c)) as (Prediction & { accuracyRating: number })[];

export const openIn = (sipp: SIPP, c: CategoryFilter = 'all') =>
  sipp.predictions.filter((p) => !isRated(p) && inCategory(p, c));

/** The average the leaderboard shows: overall, or the category's. */
export const scoreIn = (sipp: SIPP, c: CategoryFilter = 'all') =>
  c === 'all' ? sipp.averageAccuracy : sipp.categoryAccuracy[categoryKey(c)];

export type Band = 'low' | 'middle' | 'high';
/** The bands the About page describes: under 1.7 low, 2.3 and over high. */
export const bandOf = (score: number): Band => {
  const c = getAccuracyColor(score);
  return c === 'accuracy-low' ? 'low' : c === 'accuracy-high' ? 'high' : 'middle';
};
export const BAND_EDGES = [1.7, 2.3] as const;

export const fmtScore = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '—');
export const fmtRating = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '—');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "17 Feb 2025". */
export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

/** "3 years" → "3-year horizon"; anything else is shown as it is. */
export const fmtHorizon = (timeframe?: string) => {
  if (!timeframe) return '';
  const m = timeframe.match(/^(\d+)\s*years?$/i);
  if (m) return `${m[1]}-year horizon`;
  const mo = timeframe.match(/^(\d+)\s*months?$/i);
  return mo ? `${mo[1]}-month horizon` : timeframe;
};

/** A strip in words, for screen readers. */
export const describeRatings = (ratings: number[], mean?: number | null) => {
  if (!ratings.length) return 'No rated predictions.';
  const lo = Math.min(...ratings);
  const hi = Math.max(...ratings);
  const avg = mean ?? ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return `${ratings.length} rated, from ${fmtRating(lo)} to ${fmtRating(hi)}, average ${fmtScore(avg)}.`;
};

export const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Links in refreshed data come from model output, so only plain web links are rendered. */
export const isWebLink = (url?: string): url is string => !!url && /^https?:\/\//i.test(url);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
