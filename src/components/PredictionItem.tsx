import React from 'react';
import type { Prediction } from '@/data/sippData';
import { RatingMark } from './RatingStrip';
import { categoryLabel, fmtDate, fmtHorizon, fmtRating, isWebLink } from '@/lib/record';

// A prediction in the record: when it was said and under what, the words, what
// happened, and its rating on the 1-to-3 rule. A pending one has its horizon instead.

const ROW =
  'grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-2 border-b py-5 md:grid-cols-[8.5rem_minmax(0,1fr)_auto] md:py-6';

const Stamp: React.FC<{ prediction: Prediction }> = ({ prediction }) => (
  <p className="t-label m-0 md:pt-[5px]">
    <time dateTime={prediction.dateStated}>{fmtDate(prediction.dateStated)}</time>
    <span className="md:hidden"> · </span>
    <span className="md:mt-1 md:block">{categoryLabel(prediction.category)}</span>
  </p>
);

const Words: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="m-0 text-[19px] leading-snug text-foreground sm:text-[20px]">{children}</p>
);

export const RatedPrediction: React.FC<{ prediction: Prediction & { accuracyRating: number } }> = ({ prediction }) => {
  const links = [
    isWebLink(prediction.source) && { href: prediction.source, label: 'Source' },
    isWebLink(prediction.outcomeSource) && { href: prediction.outcomeSource, label: 'Outcome source' },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <li className={ROW}>
      <Stamp prediction={prediction} />
      <p className="col-start-2 row-start-1 m-0 flex items-center justify-end gap-2 self-start md:col-start-3 md:pt-[5px]">
        <RatingMark rating={prediction.accuracyRating} />
        <span className="t-figure min-w-[3ch] text-right text-[17px] leading-none text-foreground">
          {fmtRating(prediction.accuracyRating)}
        </span>
        <span className="sr-only"> out of 3</span>
      </p>
      <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
        <Words>{prediction.predictedOutcome}</Words>
        {prediction.actualOutcome && (
          <p className="m-0 mt-2 text-[16px] leading-normal text-ink-soft">{prediction.actualOutcome}</p>
        )}
        {prediction.analysisExplanation && (
          <p className="m-0 mt-2 text-[15px] italic leading-normal text-muted-foreground">
            {prediction.analysisExplanation}
          </p>
        )}
        {links.length > 0 && (
          <p className="t-label m-0 mt-3 flex flex-wrap gap-x-5">
            {links.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="link-quiet hover:text-foreground">
                {l.label}
                <span aria-hidden="true"> ↗</span>
              </a>
            ))}
          </p>
        )}
      </div>
    </li>
  );
};

export const OpenPrediction: React.FC<{ prediction: Prediction }> = ({ prediction }) => (
  <li className={ROW}>
    <Stamp prediction={prediction} />
    <p className="t-label col-start-2 row-start-1 m-0 text-right md:col-start-3 md:pt-[5px]">
      {prediction.verificationStatus === 'unverified' ? 'Unverified' : fmtHorizon(prediction.timeframe) || 'Pending'}
    </p>
    <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
      <Words>{prediction.predictedOutcome}</Words>
      {isWebLink(prediction.source) && (
        <p className="t-label m-0 mt-3">
          <a href={prediction.source} target="_blank" rel="noopener noreferrer" className="link-quiet hover:text-foreground">
            Source<span aria-hidden="true"> ↗</span>
          </a>
        </p>
      )}
    </div>
  </li>
);
