import React from 'react';
import { BAND_EDGES, describeRatings } from '@/lib/record';

// Every rated prediction as one dot on a 1-to-3 scale, stacked in 0.1 bins, with the
// average as a pencil rule. One mark is one record: nothing is binned away but the
// stacking. The dotted guides are the band edges (1.7 and 2.3).

const position = (r: number) => ((Math.min(3, Math.max(1, r)) - 1) / 2) * 100;

interface RatingStripProps {
  ratings: number[];
  mean?: number | null;
  height?: number;
  dot?: number;
  guides?: boolean;
  /** What the strip says, for screen readers. */
  label?: string;
  className?: string;
}

const RatingStrip: React.FC<RatingStripProps> = ({ ratings, mean, height = 44, dot = 5, guides = true, label, className }) => {
  const bins = new Map<number, number>();
  for (const r of ratings) {
    const k = Math.round(r * 10);
    bins.set(k, (bins.get(k) ?? 0) + 1);
  }
  const tallest = Math.max(1, ...bins.values());
  // Dots touch-but-one; a tall stack is packed closer so it still fits.
  const pitch = Math.min(dot + 1, (height - dot - 8) / Math.max(1, tallest - 1));

  const seen = new Map<number, number>();
  const dots = [...ratings]
    .sort((a, b) => a - b)
    .map((r, i) => {
      const k = Math.round(r * 10);
      const n = seen.get(k) ?? 0;
      seen.set(k, n + 1);
      return (
        <span
          key={i}
          className="strip-dot"
          style={{ left: `${position(k / 10)}%`, bottom: 2 + n * pitch, animationDelay: `${i * 8}ms` }}
        />
      );
    });

  return (
    <div
      className={`strip ${className ?? ''}`}
      style={{ height, ['--d' as string]: `${dot}px` }}
      role="img"
      aria-label={label ?? describeRatings(ratings, mean)}
    >
      <span className="strip-base" />
      {guides && BAND_EDGES.map((e) => <span key={e} className="strip-guide" style={{ left: `${position(e)}%` }} />)}
      {dots}
      {mean != null && ratings.length > 0 && <span className="strip-mean" style={{ left: `${position(mean)}%` }} />}
    </div>
  );
};

/** The scale under (or over) a column of strips: what 1, 2 and 3 mean. */
export const StripAxis: React.FC<{ className?: string; short?: boolean }> = ({ className, short }) => (
  <div className={`strip t-label ${className ?? ''}`} style={{ height: 16 }} aria-hidden="true">
    <span className="absolute left-0 -ml-1 whitespace-nowrap">1{short ? '' : ' Missed'}</span>
    <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">2{short ? '' : ' Partly'}</span>
    <span className="absolute right-0 -mr-1 whitespace-nowrap">{short ? '' : 'Came true '}3</span>
  </div>
);

/** One rating on a small 1-to-3 rule. Decorative: the figure beside it carries the value. */
export const RatingMark: React.FC<{ rating: number; className?: string }> = ({ rating, className }) => {
  const x = 3 + (position(rating) / 100) * 58;
  return (
    <svg className={className} width="64" height="12" viewBox="0 0 64 12" aria-hidden="true">
      <line x1="3" x2="61" y1="8.5" y2="8.5" stroke="hsl(var(--input))" strokeWidth="1" />
      {[3, 32, 61].map((t) => (
        <line key={t} x1={t} x2={t} y1="5.5" y2="8.5" stroke="hsl(var(--input))" strokeWidth="1" />
      ))}
      <circle cx={x} cy="8.5" r="3.5" fill="hsl(var(--pencil))" />
    </svg>
  );
};

export default RatingStrip;
