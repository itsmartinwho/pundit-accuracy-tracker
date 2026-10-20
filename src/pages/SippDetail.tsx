import React from 'react';
import { useParams } from 'react-router-dom';
import { useSippDataset } from '@/data/loadSipps';
import { calculateSippAccuracy } from '@/data/predictionAnalysis';
import type { SIPP } from '@/data/sippData';
import PageShell, { Meta } from '@/components/PageShell';
import DataNotice from '@/components/DataNotice';
import Portrait from '@/components/Portrait';
import RatingStrip, { StripAxis } from '@/components/RatingStrip';
import { OpenPrediction, RatedPrediction } from '@/components/PredictionItem';
import {
  CATEGORIES,
  bandOf,
  categoryKey,
  describeRatings,
  fmtScore,
  openIn,
  ordinal,
  plural,
  ratedIn,
} from '@/lib/record';

// A pundit's page: who, the average and every rating behind it, the averages by
// category, then the record (rated, newest first), the pending, and the patterns.

const SectionHead: React.FC<{ id: string; title: string; meta?: React.ReactNode }> = ({ id, title, meta }) => (
  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-foreground pb-3">
    <h2 id={id} className="t-name m-0 text-[34px] sm:text-[40px]">
      {title}
    </h2>
    {meta && <p className="t-label m-0">{meta}</p>}
  </div>
);

const rankOf = (sipp: SIPP, all: SIPP[]) => 1 + all.filter((s) => s.averageAccuracy > sipp.averageAccuracy).length;

const SippDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useSippDataset();
  const sipp = data?.sipps.find((s) => s.id === id) ?? null;

  if (isLoading) {
    return (
      <PageShell>
        <p className="t-label py-24" role="status">
          Loading the record…
        </p>
      </PageShell>
    );
  }

  if (!data || !sipp) {
    return (
      <PageShell title="Not found">
        <div className="py-20 sm:py-28">
          <p className="t-label m-0">No such pundit</p>
          <h1 className="t-name m-0 mt-4 text-[52px] sm:text-[76px]">Nobody by that name</h1>
          <p className="m-0 mt-4 max-w-[34em] text-[19px] text-ink-soft">
            There is no one filed under “{id}”. The ten on the leaderboard are the only pundits here.
          </p>
        </div>
      </PageShell>
    );
  }

  const rated = ratedIn(sipp).sort((a, b) => b.dateStated.localeCompare(a.dateStated));
  const open = openIn(sipp).sort((a, b) => b.dateStated.localeCompare(a.dateStated));
  const ratings = rated.map((p) => p.accuracyRating);
  const average = sipp.averageAccuracy;
  const { patterns, strongestCategory, weakestCategory } = calculateSippAccuracy(sipp.predictions);
  const rank = rankOf(sipp, data.sipps);
  const synthetic = data.meta.kind === 'synthetic';
  const analysis = sipp.patternAnalysis?.split(/\n\s*\n/).filter((p) => p.trim()) ?? [];

  return (
    <PageShell title={sipp.name}>
      {/* Who, and the average with every rating behind it. */}
      <header className="grid gap-x-16 gap-y-10 pb-10 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,27rem)] lg:items-end lg:pb-12">
        <div className="min-w-0">
          <Portrait name={sipp.name} src={sipp.photoUrl} size={80} className="sm:size-[92px]" />
          <h1 className="t-name m-0 mt-5 text-[54px] sm:text-[80px] lg:text-[96px]">{sipp.name}</h1>
          <p className="m-0 mt-4 max-w-[30em] text-[19px] italic leading-snug text-ink-soft sm:text-[21px]">
            {sipp.shortBio}
          </p>
          <p className="t-label m-0 mt-4">
            <Meta
              parts={[
                plural(sipp.predictions.length, 'prediction'),
                `${rated.length} rated`,
                `${open.length} pending`,
                `${ordinal(rank)} of ${data.sipps.length}`,
              ]}
            />
          </p>
        </div>

        <div className="lg:border-l lg:pl-10">
          <p className="t-label m-0">Average, 1 to 3</p>
          <p className="t-name m-0 mt-2 text-[104px] leading-[0.8] text-pencil sm:text-[128px]">
            {ratings.length ? fmtScore(average) : '—'}
          </p>
          <p className="t-label m-0 mt-4">
            {ratings.length ? `${bandOf(average)} band · ${plural(ratings.length, 'rating')}` : 'No rated predictions yet'}
          </p>
          <RatingStrip className="mt-6" ratings={ratings} mean={ratings.length ? average : null} height={58} dot={6} />
          <StripAxis className="mt-2" />
        </div>
      </header>

      <DataNotice meta={data.meta} />

      <div className="mt-14 grid gap-x-16 gap-y-16 sm:mt-20 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:gap-x-24">
        {/* By category: sticky beside the record on a wide screen. */}
        <section aria-labelledby="by-category" className="lg:sticky lg:top-8 lg:self-start">
          <SectionHead id="by-category" title="By category" />
          <ul className="m-0 list-none p-0">
            {CATEGORIES.map(({ value, label }) => {
              const these = ratedIn(sipp, value).map((p) => p.accuracyRating);
              const score = these.length ? sipp.categoryAccuracy[categoryKey(value)] : null;
              const mark = value === strongestCategory ? 'Highest' : value === weakestCategory ? 'Lowest' : null;
              return (
                <li key={value} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 border-b py-4">
                  <h3 className="t-label m-0 text-foreground">
                    {label}
                    {mark && <span className="ml-2 text-pencil">· {mark}</span>}
                  </h3>
                  <p className="m-0 text-right">
                    <span className="t-figure text-[20px] leading-none text-pencil">{score === null ? '—' : fmtScore(score)}</span>
                    <span className="t-label ml-2">{these.length} rated</span>
                  </p>
                  <RatingStrip
                    className="col-span-2 mt-2"
                    ratings={these}
                    mean={score}
                    height={34}
                    dot={5}
                    label={`${label}: ${describeRatings(these, score)}`}
                  />
                </li>
              );
            })}
          </ul>
          <StripAxis className="mt-2" short />
        </section>

        <div className="min-w-0">
          <section aria-labelledby="record">
            <SectionHead id="record" title="Record" meta={`${rated.length} rated · newest first`} />
            {rated.length ? (
              <ol className="m-0 list-none p-0">
                {rated.map((p) => (
                  <RatedPrediction key={p.id} prediction={p} />
                ))}
              </ol>
            ) : (
              <p className="py-6 text-ink-soft">No prediction has been rated yet.</p>
            )}
          </section>

          <section aria-labelledby="pending" className="mt-16 sm:mt-20">
            <SectionHead id="pending" title="Pending" meta={`${open.length} not yet rated`} />
            {open.length ? (
              <ol className="m-0 list-none p-0">
                {open.map((p) => (
                  <OpenPrediction key={p.id} prediction={p} />
                ))}
              </ol>
            ) : (
              <p className="py-6 text-ink-soft">Nothing is waiting on an outcome.</p>
            )}
          </section>

          <section aria-labelledby="patterns" className="mt-16 sm:mt-20">
            <SectionHead id="patterns" title="Patterns" meta="Across the rated predictions" />
            {patterns.length ? (
              <ul className="m-0 list-none p-0">
                {patterns.map((p) => (
                  <li key={p.type} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 border-b py-4">
                    <h3 className="t-name m-0 text-[24px]">{p.type}</h3>
                    <p className="t-figure m-0 text-right text-[15px]">
                      {Math.round(p.frequency * 100)}%<span className="t-label ml-2">of rated</span>
                    </p>
                    <p className="col-span-2 m-0 text-[16px] text-ink-soft">{p.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-ink-soft">Too few rated predictions to see a pattern.</p>
            )}

            {analysis.length > 0 && (
              <details className="group mt-6">
                <summary className="t-label cursor-pointer list-none text-foreground hover:text-pencil [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className="mr-2 inline-block transition-transform group-open:rotate-90">
                    ▸
                  </span>
                  The written analysis
                </summary>
                <div className="mt-4 max-w-[38em]">
                  <p className="t-label m-0">
                    {synthetic
                      ? 'Part of the demo data, like the ratings it describes.'
                      : 'Written by a model from the ratings above. No person has checked it.'}
                  </p>
                  {analysis.map((para, i) => (
                    <p key={i} className="m-0 mt-4 text-[17px] text-ink-soft">
                      {para.trim()}
                    </p>
                  ))}
                </div>
              </details>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
};

export default SippDetail;
